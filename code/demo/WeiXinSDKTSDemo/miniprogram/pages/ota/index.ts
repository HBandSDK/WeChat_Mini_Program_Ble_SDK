import { RCSPManager, RCSP } from "../../jieli_sdk/lib/rcsp-impl/rcsp"
import { veepooJLAuthenticationManager, veepooJLOTAInITManager, veepooJLStartOTAManager, veepooJLOTAUnloadObserveManager } from "../../jieli_sdk/index"
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
import { DeviceManager, DeviceBluetooth } from "../../jieli_sdk/lib/rcsp-impl/dev-bluetooth";
import { BluetoothDevice } from "../../jieli_sdk/lib/rcsp-protocol/rcsp-util";
import { RcspOTAManager } from "../../jieli_sdk/jl_lib/jl-ota/ota-rcsp"
import { OTAConfig, ReConnectMsg, UpgradeType, OTAImpl } from "../../jieli_sdk/jl_lib/jl-ota/jl_ota_2.1.0";
import { ab2hex, Device } from "../../jieli_sdk/jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0";
import { Reconnect, ReconnectCallback, ReconnectOp } from "../../jieli_sdk/lib/reconnect";
import { getDeviceDataMac, incrementMacAddress } from "../../jieli_sdk/utils/util";

// pages/function_test/ota/index.ts
let _Reconnect: Reconnect | null = null;
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
  },
  otaData: Uint8Array.prototype,

  /**
   * 生命周期函数--监听页面加载
   */
  _RCSPWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  _rcspOTAWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  reconnectingDeviceId: "",
  onLoad() {
    // 初始化，接受杰里数据
    BleDataHandler.init()

    this._RCSPWrapperEventCallback = new RCSP.RCSPWrapperEventCallback()
    this._RCSPWrapperEventCallback.onEvent = (event) => {
      if (event.type === "onSwitchUseDevice") {
        const connectedDeviceId = event.onSwitchUseDeviceEvent?.device?.deviceId
        console.log(" onSwitchUseDevice111: " + connectedDeviceId);
        this.setData({
          connectedDeviceId: connectedDeviceId == undefined ? "" : connectedDeviceId
        });
        if (connectedDeviceId != undefined) {
          setTimeout(() => {
            console.log('==================================认证成功=====================================');
            this.initOTA();
          }, 300);
        }
      }
    }
    RCSPManager.observe(this._RCSPWrapperEventCallback)

    DeviceManager.observe(this._onRCSPBluetoothEvent)
  },


  initOTA() {

    // 取消认证监听
    RCSPManager.removeObserve(this._RCSPWrapperEventCallback)

    DeviceManager.observe(this._onRCSPBluetoothEvent)

    this._rcspOTAWrapperEventCallback = {
      onEvent: (_res) => {
        if (_res.type == "onRcspInit" && _res.onRcspInitEvent) {//单备份升级会切换ble地址，导致rcspOpImpl变换
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
                console.log("读取文件成功", uint8);
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
    if (!RCSPManager.isConnectedDevce()) {
      wx.showToast({ title: "请先连接设备" })
      return
    }
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
    otaConfig.isSupportNewRebootWay = true
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
            let result = false;
            const oldDevice = that.rcspOTAManager.getCurrentOTADevice()
            const oldDeviceMac = that.rcspOTAManager.getCurrentOTADeviceMac()
            // console.log(" reConnectMsg.isSupportNewReconnectADV : " + reConnectMsg.isSupportNewReconnectADV);
            // console.log(" oldDeviceMac " + oldDeviceMac);
            if (reConnectMsg.isSupportNewReconnectADV) {//使用新回连方式，需要通过rcsp协议获取到设备的ble地址
              if (oldDeviceMac != undefined && scanDevice.advertisData) {
                let currentMac = getDeviceDataMac(scanDevice);
                let mac = incrementMacAddress(oldDeviceMac);
                return currentMac === mac;
              } else {
                console.error("RCSP协议未拿到设备的BLE地址")
              }
            } else {//旧回连方式，deviceId相同即可
              result = oldDevice!.deviceId == scanDevice.deviceId
              // console.log("旧方式回连 : oldMAC: " + oldDevice!.deviceId + " scanMAC: " + scanDevice.deviceId + " result: " + result);
            }
            return result
          },
          connectDevice(device: BluetoothDevice): any {//连接设备
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
            /todo 回连成功应该把新设备和连接状态同步给 rcspOTA/
            that.rcspOTAManager.updateOTADevice(new Device(deviceId))
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
    if (event.type === 'onDiscoveryStatus') {
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



