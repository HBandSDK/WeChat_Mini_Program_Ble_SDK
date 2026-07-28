import { RCSPManager, RCSP } from "../../jieli_sdk/lib/rcsp-impl/rcsp"
import { veepooJLAuthenticationManager, veepooJLOTAInITManager, veepooJLStartOTAManager, veepooJLOTAUnloadObserveManager } from "../../jieli_sdk/index"
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
import { DeviceManager, DeviceBluetooth } from "../../jieli_sdk/lib/rcsp-impl/dev-bluetooth";
import { BluetoothDevice } from "../../jieli_sdk/lib/rcsp-protocol/rcsp-util";
import { RcspOTAManager } from "../../jieli_sdk/jl_lib/jl-ota/ota-rcsp"
import { OTAConfig, ReConnectMsg, UpgradeType, OTAImpl } from "../../jieli_sdk/jl_lib/jl-ota/jl_ota_2.1.0";
import { Device } from "../../jieli_sdk/jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0";
import { Reconnect, ReconnectCallback, ReconnectOp } from "../../jieli_sdk/lib/reconnect";
import { getDeviceDataMac, incrementMacAddress } from "../../jieli_sdk/utils/util";

// pages/function_test/ota/index.ts
let _Reconnect: Reconnect | null = null;
// 回连识别日志去重：每个deviceId只打印一次(鸿蒙扫描 allowDuplicatesKey 会反复上报同一设备)
let _reconnectPrintedDev = new Set<string>()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isOTAing: false,
    otaProgressText: "",
    fileStatus: 0,
    fileInfo: "",
    fileName: "",
    rcspReady: false,
  },
  otaData: Uint8Array.prototype,

  /**
   * 生命周期函数--监听页面加载
   */
  _RCSPWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  _rcspOTAWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  reconnectingDeviceId: "",
  onLoad() {

    BleDataHandler.init()

    // this._RCSPWrapperEventCallback.onEvent = (event) => {
    //   if (event.type === "onSwitchUseDevice") {
    //     const connectedDeviceId = event.onSwitchUseDeviceEvent?.device?.deviceId
    //     console.log(" onSwitchUseDevice111: " + connectedDeviceId);
    //     this.setData({
    //       connectedDeviceId: connectedDeviceId == undefined ? "" : connectedDeviceId
    //     });
    //     if (connectedDeviceId != undefined) {
    //       setTimeout(() => {
    //         console.log('==================================认证成功=====================================');
    //         this.initOTA();
    //       }, 300);
    //     }
    //   }
    // }
    // RCSPManager.observe(this._RCSPWrapperEventCallback)

    // DeviceManager.observe(this._onRCSPBluetoothEvent)
    // 获取 veepooBle 存储的设备信息
    const bleInfo = wx.getStorageSync('bleInfo');

    // 注册 RCSP「切换控制设备」监听（接管成功后置 rcspReady）
    this._RCSPWrapperEventCallback = new RCSP.RCSPWrapperEventCallback();
    this._RCSPWrapperEventCallback.onEvent = (event) => {
      if (event.type === "onSwitchUseDevice") {
        const id = event.onSwitchUseDeviceEvent?.device?.deviceId || event.onSwitchUseDeviceEvent?.deviceId;
        if (id) {
          this.setData({ rcspReady: true });
        }
      }
    };
    RCSPManager.observe(this._RCSPWrapperEventCallback);
    // 监听蓝牙事件（含 onConnection 连接状态变化）
    DeviceManager.observe(this._onRCSPBluetoothEvent);

    // 鸿蒙(ohos)上 bleInfo 里缓存的 deviceId 是系统分配的虚拟地址，设备断开重连后会失效，
    // 用失效的 deviceId 调 createBLEConnection 会直接失败(onConnection status=3)。
    // 接管前先向系统查询当前已连接设备的有效 deviceId，查到则用之，查不到再回退 bleInfo。
    wx.getConnectedBluetoothDevices({
      services: [],
      success: (res) => {
        const list = (res.devices || []) as Array<WechatMiniprogram.BlueToothDevice>
        console.log('[连接诊断] 当前已连接BLE设备=' + JSON.stringify(list.map(d => d.deviceId)) + ' | bleInfo.deviceId=' + bleInfo?.deviceId)
        // 优先用 bleInfo 里记录的 deviceId(目标设备)；周围有多个已连接设备时 list.find(d=>d.deviceId) 会取到第一个(非目标)
        const cur = (bleInfo && bleInfo.deviceId && list.find(d => d.deviceId === bleInfo.deviceId)) || list.find(d => d.deviceId)
        if (cur) {
          this._takeOverDevice(cur.deviceId, cur.name || bleInfo?.name || '')
        } else if (bleInfo && bleInfo.deviceId) {
          this._takeOverDevice(bleInfo.deviceId, bleInfo.name || '')
        } else {
          wx.showToast({ title: '未找到已连接设备，请先连接' })
        }
      },
      fail: (e) => {
        console.log('[连接诊断] getConnectedBluetoothDevices fail=' + JSON.stringify(e))
        if (bleInfo && bleInfo.deviceId) {
          this._takeOverDevice(bleInfo.deviceId, bleInfo.name || '')
        } else {
          wx.showToast({ title: '未找到已连接设备，请先连接' })
        }
      }
    })

  },

  // 杰理 SDK 接管指定 deviceId（用系统查询到的有效地址）
  _takeOverDevice(deviceId: string, name: string) {
    console.log('[连接诊断] 杰理接管 deviceId=' + deviceId + ' name=' + name)
    const device = new BluetoothDevice()
    device.deviceId = deviceId
    device.localName = name
    // 有些版本会检测到已连接则直接回调成功
    DeviceManager.connecDevice(device)
  },


  initOTA() {

    // 取消认证监听
    DeviceManager.observe(this._onRCSPBluetoothEvent)

    this._rcspOTAWrapperEventCallback = {
      onEvent: (_res) => {
        if (_res.type == "onRcspInit" && _res.onRcspInitEvent) {
          if (_res.onRcspInitEvent.isInit && _res.onRcspInitEvent.device.deviceId.toUpperCase() == this.reconnectingDeviceId.toUpperCase()) {
            const bluetoothDevice = RCSPManager.getBluetoothDeviceByDeviceId(_res.onRcspInitEvent.device.deviceId)
            if (bluetoothDevice) {
              const rcspOperateWrapper = RCSPManager.getRcspOperateWrapper(bluetoothDevice)
              const rcspOpImpl = rcspOperateWrapper?.getRcspOpImpl()
              if (rcspOpImpl) {
                _Reconnect?.onDeviceConnected(bluetoothDevice.deviceId)
                this.rcspOTAManager.updateRcspOpImpl(rcspOpImpl)
              }
            }
          }
        }
      }
    }
    RCSPManager.observe(this._rcspOTAWrapperEventCallback)
  },


  onUnload() {
    // 销毁ota资源
    DeviceManager.removeObserve(this._onRCSPBluetoothEvent)
    RCSPManager.removeObserve(this._rcspOTAWrapperEventCallback)
  },
  setJLVerify() {
    let info = wx.getStorageSync('bleInfo')

    console.log('device===>', info);

    let device = info as BluetoothDevice;

    DeviceManager.connecDevice(device);
    return
  },
  // 读取文件
  clickReadFile() {
    wx.chooseMessageFile({
      count: 1,
      success: (res) => {
        const tempFilePaths = res.tempFiles
        console.log("tempFilePaths : ", tempFilePaths);
        this.setData({
          fileStatus: 1
        })
        const fs = wx.getFileSystemManager()
        fs.getFileInfo({
          filePath: tempFilePaths[0].path,
          success: (res) => {
            let fd = fs.openSync({
              filePath: tempFilePaths[0].path
            })
            let uint8 = new Uint8Array(res.size);
            fs.read({
              fd: fd,
              arrayBuffer: uint8.buffer,
              length: res.size,
              success: (_res) => {
                this.otaData = uint8
                console.log("读取文件成功 size=" + uint8.length + " head=[" + Array.from(uint8.slice(0, 8)).join(',') + "]");
                this.setData({
                  fileStatus: 2,
                  fileName: tempFilePaths[0].name,
                  fileInfo: "文件大小：" + res.size
                })
              }, complete: (_res) => {
                fs.close({ fd })
              }
            })
          }
        })

      }
    })
  },

  // 开始ota
  clickStartOTA() {
    let self = this;
    // [连接诊断] 点开始OTA时的接管状态
    const _cur = RCSPManager.getCurrentRcspOperateWrapper()
    console.log('[连接诊断] clickStartOTA isConnectedDevce=' + RCSPManager.isConnectedDevce()
      + ' currentDevice=' + _cur?.deviceId + ' bleInfo=' + JSON.stringify(wx.getStorageSync('bleInfo')))
    if (!RCSPManager.isConnectedDevce()) {
      wx.showToast({ title: "请先连接设备" })
      return
    };
    if (this.data.fileStatus == 2 && this.otaData.length > 0) {
      // 开始ota
      let value = {
        updateFileData: this.otaData
      }

      this._startOTA();
      // 开始ota，传入文件数据
      // veepooJLStartOTAManager(value, function (event: any) {
      //   console.log("event=>", event);
      //   self.setData({
      //     otaProgressText: event.otaProgressText
      //   })
      // })
    }
  },
  rcspOTAManager: RcspOTAManager.prototype,

  _startOTA() {
    const rcspOpImpl = RCSPManager.getCurrentRcspOperateWrapper()?.wrapper.getRcspOpImpl()
    if (rcspOpImpl == undefined) {
      return
    }
    /*--- 开始执行OTA升级 ---*/
    const otaConfig: OTAConfig = new OTAConfig()
    otaConfig.isSupportNewRebootWay = false,
      otaConfig.updateFileData = this.otaData
    this.rcspOTAManager = new RcspOTAManager(rcspOpImpl)

    this.setData({
      isOTAing: true
    })

    const that = this
    this.rcspOTAManager.startOTA(otaConfig, {
      onStartOTA: () => {

        this.setData({
          otaProgressText: "开始升级"
        });

      },
      onNeedReconnect: (reConnectMsg: ReConnectMsg) => {
        console.log("onNeedReconnect: ");
        _reconnectPrintedDev.clear() // 新一轮回连，重置打印去重

        this.setData({
          otaProgressText: "正在回连设备..."
        })

        //###实现回连，这一部分可以自己实现
        const op: ReconnectOp = {
          startScanDevice(): any {//开始扫描设备
            // RCSPBluetooth.bleScan.startScan()
            DeviceManager.starScan()
          },
          isReconnectDevice(scanDevice: BluetoothDevice): boolean { //判断是不是回连设备
            const oldDevice = that.rcspOTAManager.getCurrentOTADevice()
            const oldDeviceMac = that.rcspOTAManager.getCurrentOTADeviceMac()
            const scanName = (scanDevice.localName || scanDevice.name || '')
            const advHex = scanDevice.advertisData
              ? Array.from(new Uint8Array(scanDevice.advertisData)).map(b => b.toString(16).padStart(2, '0')).join('')
              : 'EMPTY'
            const parsedMac = scanDevice.advertisData ? getDeviceDataMac(scanDevice) : ''
            const expectMacPlus1 = oldDeviceMac ? incrementMacAddress(oldDeviceMac) : ''
            // 每个设备只打印一次回连识别日志(鸿蒙 allowDuplicatesKey 会反复上报同一设备)
            if (!_reconnectPrintedDev.has(scanDevice.deviceId)) {
              _reconnectPrintedDev.add(scanDevice.deviceId)
              console.log('[回连识别] isSupportNewADV=' + reConnectMsg.isSupportNewReconnectADV
                + ' name=' + scanName + ' scanId=' + scanDevice.deviceId
                + ' oldDeviceId=' + oldDevice?.deviceId + ' oldMac=' + oldDeviceMac + ' expectMac+1=' + expectMacPlus1
                + ' parsedMac=' + parsedMac + ' adv=' + advHex)
            }
            // 策略1: deviceId 相同。鸿蒙上设备偶现没真正断开(系统BLE保持)，OTA重启后虚拟地址未变，可直接匹配。
            // (系统已连接设备会被扫描到但 advertisData 为空，只能靠 deviceId 识别)
            if (oldDevice && oldDevice.deviceId && scanDevice.deviceId &&
              scanDevice.deviceId.toUpperCase() === oldDevice.deviceId.toUpperCase()) {
              return true
            }
            // 策略2: 广播包真实MAC匹配 bleAddr 或 bleAddr+1(设备断开重启后 deviceId 变化，靠MAC识别)。
            if (oldDeviceMac != undefined && parsedMac) {
              const cur = parsedMac.toUpperCase()
              if (cur === oldDeviceMac.toUpperCase() || cur === expectMacPlus1.toUpperCase()) return true
            }
            return false
          },
          connectDevice(device: BluetoothDevice): any {//连接设备
            DeviceManager.stopScan()
            const deviceTemp = new BluetoothDevice()
            deviceTemp.RSSI = device.RSSI
            deviceTemp.advertisData = device.advertisData
            deviceTemp.advertisServiceUUIDs = device.advertisServiceUUIDs
            deviceTemp.connectable = device.connectable
            deviceTemp.deviceId = device.deviceId
            deviceTemp.localName = device.localName
            deviceTemp.serviceData = device.serviceData
            console.log(" 回连，连接设备:" + device.deviceId);
            that.reconnectingDeviceId = device.deviceId
            DeviceManager.connecDevice(deviceTemp)
            // RCSPBluetooth.bleConnect.connectDevice(deviceTemp)
          }
        }
        const callback: ReconnectCallback = {
          onReconnectSuccess(deviceId: string) {
            console.error("onReconnectSuccess : " + deviceId);
            // /todo 回连成功应该把新设备和连接状态同步给 rcspOTA/
            if (that.rcspOTAManager) {
              that.rcspOTAManager.updateOTADevice(new Device(deviceId))
            }
            // that.rcspOTAManager.updateOTADevice(new Device(deviceId))
            _Reconnect = null;
          },
          onReconnectFailed() {//不用处理，库里会自动超时
            console.error("onReconnectFailed : ");
            _Reconnect = null;
          }
        }
        _Reconnect = new Reconnect(op, callback)
        _Reconnect.startReconnect(OTAImpl.RECONNECT_DEVICE_TIMEOUT);
      },
      onProgress: (type: UpgradeType, progress: number) => {
        let msg = type == UpgradeType.UPGRADE_TYPE_FIRMWARE ? '发送sdk升级数据' : '发送uboot升级数据'
        this.setData({
          otaProgressText: "正在" + msg + "...,进度：" + (new Number(progress).toFixed(2))
        })
      },
      onStopOTA: () => {
        this.setData({
          otaProgressText: "升级成功"
        })
        wx.showModal({
          title: '提示',
          content: '升级成功',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack({
                delta: 2
              })
            }
          }
        })
        //  const oldDevice = that.rcspOTAManager.getCurrentOTADevice()
        // const oldDeviceMac = that.rcspOTAManager.getCurrentOTADeviceMac()
        //升级完成，释放设备

        // const connectedDeviceIds = RCSPBluetooth.bleConnect.getConnectedDeviceIds()
        // if (connectedDeviceIds != null) {
        //     RCSPBluetooth.bleConnect.disconnect(connectedDeviceIds[0])
        // }
        const connectedDeviceIds = this.rcspOTAManager.getCurrentOTADevice()?.deviceId
        if (connectedDeviceIds) {
          const bluetoothDevice = new BluetoothDevice()
          bluetoothDevice.deviceId = connectedDeviceIds
          DeviceManager.disconnectDevice(bluetoothDevice)
        }
        this.rcspOTAManager.release()
      },
      onCancelOTA: () => {
        wx.showModal({
          title: '提示',
          content: '升级取消',
        })
        this.setData({
          otaProgressText: "升级取消"
        })
        //  const oldDevice = that.rcspOTAManager.getCurrentOTADevice()
        // const oldDeviceMac = that.rcspOTAManager.getCurrentOTADeviceMac()
        //升级取消，释放设备
        // const connectedDeviceIds = RCSPBluetooth.bleConnect.getConnectedDeviceIds()
        // if (connectedDeviceIds != null) {
        //     RCSPBluetooth.bleConnect.disconnect(connectedDeviceIds[0])
        // }
        const connectedDeviceIds = this.rcspOTAManager.getCurrentOTADevice()?.deviceId
        if (connectedDeviceIds) {
          const bluetoothDevice = new BluetoothDevice()
          bluetoothDevice.deviceId = connectedDeviceIds
          DeviceManager.disconnectDevice(bluetoothDevice)
        }
      },
      onError: (error: number, message: string) => {
        if (_Reconnect != null) {
          _Reconnect.stopReconnect()
        }
        this.setData({
          otaProgressText: '升级失败: 错误code：' + error + " 信息：" + message
        })
        console.error('升级失败: 错误code：' + error + " 信息：" + message)
        wx.showModal({
          title: '提示',
          content: '升级失败: 错误code：' + error + " 信息：" + message,
        })
        //  const oldDevice = that.rcspOTAManager.getCurrentOTADevice()
        // const oldDeviceMac = that.rcspOTAManager.getCurrentOTADeviceMac()
        //升级失败，释放设备
        // const connectedDeviceIds = RCSPBluetooth.bleConnect.getConnectedDeviceIds()
        // if (connectedDeviceIds != null) {
        //     RCSPBluetooth.bleConnect.disconnect(connectedDeviceIds[0])
        // }
        const connectedDeviceIds = this.rcspOTAManager.getCurrentOTADevice()?.deviceId
        if (connectedDeviceIds) {
          const bluetoothDevice = new BluetoothDevice()
          bluetoothDevice.deviceId = connectedDeviceIds
          DeviceManager.disconnectDevice(bluetoothDevice)
        }
        this.rcspOTAManager.release()
      }
    })
  },

  hex2Mac(buffer: ArrayBuffer) {
    const hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join(':')
  },

  _onRCSPBluetoothEvent(event: DeviceBluetooth.DeviceBluetoothEvent) {
    if (event.type === 'onConnection') {//[连接诊断] 捕获BLE连接状态变化(0断开/2已连接)
      const st = event.onConnectionEvent?.status
      const dev = event.onConnectionEvent?.device
      console.log('[连接诊断] onConnection status=' + st + ' (0=断开 1=连接中 2=已连接 3=失败) device=' + dev?.deviceId
        + ' | isConnectedDevce=' + RCSPManager.isConnectedDevce())
    } else if (event.type === 'onDiscoveryStatus') {
      if (event.onDiscoveryStatusEvent) {
        const bStart = event.onDiscoveryStatusEvent.bStart
        if (!bStart) {//扫描结束
          if (_Reconnect != null) {
            _Reconnect.onScanStop()//扫描结束，通知回连，回连会再次调用扫描
          }
        }
      }
    } else if (event.type === 'onDiscovery') {
      if (event.onDiscoveryEvent) {
        const device = event.onDiscoveryEvent.device
        const bleScanMassage = event.onDiscoveryEvent.bleScanMessage
        device.advertisData = bleScanMassage.rawData
        if (_Reconnect != null) {
          _Reconnect.onDiscoveryDevice(device)//发现设备，回调给回连
        }
      }
    }
  }

});



