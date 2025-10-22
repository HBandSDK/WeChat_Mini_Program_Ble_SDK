import { veepooBle } from '../miniprogram_dist/index'
// import { ConnectImpl } from '../jieli_sdk/lib/bluetooth'
import { PackResFormat, Uint8ArrayToString } from "./jl_lib/jl_packResFormat_1.0.0";
import { RCSPOpSystemInfo, RCSPOpWatchDial, RCSPOpWatch } from "./lib/rcsp-impl/rcsp";
import { OPDirectoryBrowse, OPLargerFileTrans } from "./jl_lib/jl-rcsp-op/jl_op_watch_1.1.0";
// ota
import { BluetoothDevice } from "../jieli_sdk/lib/bluetooth"
import { DeviceBluetooth, DeviceManager } from "../jieli_sdk/lib/rcsp-impl/dev-bluetooth"
import { RCSP, RCSPManager } from "../jieli_sdk/lib/rcsp-impl/rcsp"
import { OTAConfig, ReConnectMsg, UpgradeType, OTAImpl } from "../jieli_sdk/jl_lib/jl-ota/jl_ota_2.1.0"
import { RcspOTAManager } from "../jieli_sdk/jl_lib/jl-ota/ota-rcsp"
import { Reconnect, ReconnectCallback, ReconnectOp } from "../jieli_sdk/lib/reconnect"
// 认证
import { Device, ab2hex } from "./jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0";
import { BleDataHandler, BleSendDataHandler } from './lib/ble-data-handler';
// let ConnectedImp = new ConnectImpl();


/* 
表盘传输相关代码开始
*/

export const veepooJLBluetoothConnectionManager = function (device: any) {
  DeviceManager.connecDevice(device);
}
// 读取文件数据
export const veepooJLGetFileDataManager = function (tempFilePaths: any, callback: any) {
  const fs = wx.getFileSystemManager()
  fs.getFileInfo({
    filePath: tempFilePaths.path,
    success: (res) => {
      let fd = fs.openSync({
        filePath: tempFilePaths.path
      })
      let uint8 = new Uint8Array(res.size);

      console.log("fd 内容=>", fd);
      fs.read({
        fd: fd,
        arrayBuffer: uint8.buffer,
        length: res.size,
        success: (_res) => {
          let lastModifyTime = tempFilePaths.time
          let dialData = uint8
          console.log("读取文件成功", uint8);
          const packResFormat = new PackResFormat()
          const fileName = tempFilePaths.name
          const fileInfoData = packResFormat.getFileData(uint8, fileName + '.json')
          // 读取文件
          let value = {
            uint8,
            fileName
          }
          if (fileInfoData == undefined) {
            let result = {
              error: '获取文件信息失败'
            }
            callback(result)

          } else {
            const fileInfo = Uint8ArrayToString(fileInfoData)

            let result = {
              fileName: fileName,
              fileInfo: fileInfo,
              lastModifyTime: lastModifyTime,
              dialData: dialData
            }
            callback(result)
          }
        }, complete: (_res) => {
          fs.close({ fd })
        }
      })
    }
  })

}

// 传输表盘  
export const veepooJLAddDialTransferStartManager = function (value: any, callback: any) {
  RCSPOpSystemInfo?.getSystemInfo().then((systemInfo) => {
    if (systemInfo.callStatus == 1) {//手表通话中
      let result = {
        callStatus: 1,
        message: '通话中，不可操作'
      }
      callback(result)
    } else if (systemInfo.callStatus == 0) {//手表空闲
      if (value.dialData.length > 0) {
        const _callback: OPLargerFileTrans.TransferTaskCallback = {
          onError: (code: number) => {
            let result = {
              error: "传输失败，code:" + code
            }
            callback(result)
          },
          onStart: () => {

            let result = {
              transferProgressText: "开始传输",
              isTransfering: true
            }
            callback(result)
          },
          onProgress: (progress: number) => {

            let result = {
              transferProgressText: "正在传输，进度:" + progress,
              progress
            }
            callback(result)
          },
          onSuccess: () => {
            let result = {
              transferProgressText: "传输成功",
              isTransfering: false
            }
            callback(result)
          },
          onCancel: (_code: number) => {

            let result = {
              transferProgressText: "传输取消",
              isTransfering: false
            }
            callback(result)
          }
        }
        RCSPOpWatchDial?.addWatchResourseFile(value.dialData, value.fileName, value.lastModifyTime, true, _callback).then((res) => {
          if (res instanceof OPDirectoryBrowse.File) {//传输成功且刷新目录
            //设置为当前表盘
            RCSPOpWatchDial?.setUsingDial(res)
          } else if (res == undefined) {//传输完成后,目录浏览找不到该文件
            console.error("传输完成后找不到该文件，可能是文件名不符合标准，太长或者带中文");
          } else {//传输成功且不刷新目录
            console.log("目录浏览的相对路径：path：" + res);
          }
        }).catch((error) => {
          let result = {
            error: '添加表盘失败，' + error
          }
          callback(result)
        })
      } else {
        let result = {
          error: '请先读取表盘文件'
        }
        callback(result)
        return
      }
    }
  })
}


// 获取表盘列表
export const veepooJLGetDialListManager = function (callback: any) {
  RCSPOpWatchDial?.getWatchResourseFileList().then((res) => {
    console.log("获取表盘列表", res);
    for (let index = 0; index < res.length; index++) {
      const element = res[index];
      //@ts-ignore
      element.name = element.getName()
    }

    let result = {
      dialList: _getWatchFile(res),
      customBackgroundList: _getCustomBackgroundFile(res)
    }
    callback(result)

  }).catch((error) => {
    console.error("获取表盘列表,失败：", error);
  })
}
/**
 * 获取表盘文件
 */
const _getWatchFile = (fileList: OPDirectoryBrowse.File[]) => {
  const filt = "WATCH"
  const result = new Array<OPDirectoryBrowse.File>()
  for (let index = 0; index < fileList.length; index++) {
    const element = fileList[index];
    if (element.getName()?.toUpperCase().includes(filt)) {
      result.push(element)
    }
  }
  return result
}
/**
* 获取自定义背景文件
*/
const _getCustomBackgroundFile = (fileList: OPDirectoryBrowse.File[]) => {
  const filt = "BGP"
  const result = new Array<OPDirectoryBrowse.File>()
  for (let index = 0; index < fileList.length; index++) {
    const element = fileList[index];
    if (element.getName()?.toUpperCase().includes(filt)) {
      result.push(element)
    }
  }
  return result
}

/* 
设置当前使用表盘
*/
export const veepooJLSetToCurrentUseManager = function (file: any, callback: any) {
  RCSPOpWatchDial?.setUsingDial(file).then((_res) => {
    callback({ title: "设置为当前使用成功", result: _res })
  }).catch((error) => {
    callback({ title: "设置为当前使用失败，" + error })
  })
}

// 使用当前表盘列表
export const veepooJLUseTheCurrentDialListManager = function (callback: any) {
  //先进行目录浏览，才可以获取到对应的正在使用文件
  RCSPOpWatchDial?.getUsingDial().then((res) => {
    console.log("当前使用表盘，", res);

    // res.name = res.getName()
    let result = {
      useDial: res.getName()
    }
    callback(result)
  }).catch((error) => {
    let result = {
      error: "当前使用表盘，失败：" + error
    }
    callback(result)
  })
}

/* 
删除表盘
*/
export const veepooJLDeleteDialManager = function (file: any, callback: any) {
  RCSPOpWatchDial?.deleteDial(file).then((_res) => {
    let message = {
      title: "删除表盘成功",
      message: _res,
      deteleState: true
    }
    callback(message)
  }).catch((error) => {
    let message = {
      title: "删除表盘失败",
      message: error,
      deteleState: false
    }
    callback(message)
  });
}




/**
 * 表盘操作--获取表盘版本信息
 */
export const veepooJLGetDialVersionInfoManager = (file: OPDirectoryBrowse.File, callback: any) => {
  RCSPOpWatchDial?.getDialVersionInfo(file).then((res) => {
    callback(res)
  }).catch((error) => {
    callback({ error: "获取表盘版本信息失败," + error })
  })
}
/**
* 表盘操作--获取表盘背景
*/
export const veepooJLGetDialBackgroundManager = (file: OPDirectoryBrowse.File, callback: any) => {
  RCSPOpWatchDial?.getDialCustomBackground(file).then((res) => {
    const content = res == null ? "无" : res.getName()

    let result = {
      name: file.getName(),
      content: content
    }
    callback(result)

  }).catch((error) => {
    callback({ error: "获取表盘背景失败," + error })
  })
}

/* 
表盘传输相关代码开始
*/


// 切换杰里服务
// export const veepooJLHandoverDeviceServiceManager = function (device: any) {
//   ConnectedImp.jieLiNotifyMonitorValueChange(device)
// }

// 杰里sdk认证
export const veepooJLAuthenticationManager = function (device: any, callback: any) {
  wx.getSystemInfo({
    success(system) {
      if (system.platform === 'android') {
        wx.setBLEMTU({//怀疑并发的时候会mtu混乱 
          deviceId: device.deviceId,
          writeType: "writeNoResponse",
          mtu: 512,
          success: res => {
            console.log("第一个res=>", res)
            let value = {
              device: device,
              mtu: res.mtu
            }
            // BleSendDataHandler.setMtu(device.deviceId, res.mtu);
            // 切换杰里服务等
            // ConnectedImp.handoverServiceManager(value, (result: any) => {
            //   callback(result)
            // })

          },
          fail: (res) => {
            wx.getBLEMTU({
              writeType: "writeNoResponse",
              deviceId: device.deviceId, success: res => {
                console.log("第二个res=>", res);
                let value = {
                  device: device,
                  mtu: 244
                }

                // BleSendDataHandler.setMtu(device.deviceId, res.mtu);

                // 切换杰里服务等
                // ConnectedImp.handoverServiceManager(value, (result: any) => {
                //   callback(result)
                // })
              }
            })
          }
        })


      } else {

        setTimeout(() => {

          wx.getBLEMTU({
            writeType: "writeNoResponse",
            deviceId: device.deviceId, success: res => {
              console.log("ios res=>", res)
              let value = {
                device: device,
                mtu: 244
              }
              // BleSendDataHandler.setMtu(device.deviceId, res.mtu);
              // 切换杰里服务等
              // ConnectedImp.handoverServiceManager(value, (result: any) => {
              //   callback(result)
              // })
            }
          })
        }, 1000)

      }
    }
  })

}

// 杰里断开蓝牙连接
export const veepooJLDisconnectDevice = function (device: any) {
  // RCSPManager.JLOnConnectDisconnect(device)
  DeviceManager.disconnectDevice(device)
}

// 蓝牙断开监听
const BLEConnectionStateChange = function () {
  veepooBle.veepooWeiXinSDKBLEConnectionStateChangeManager(function (e: any) {
    console.log("蓝牙断开=>", e)
  })
}

/* 
 ota相关代码开始
*/
const veepooJLOTAReadFileDataManager = function () {

}

// 开始升级
let rcspOTAManager = RcspOTAManager.prototype
let otaData = Uint8Array.prototype
// scanCallback: ScanCallback.prototype,
let rcspWrapperEventCallback = RCSP.RCSPWrapperEventCallback.prototype
let _Reconnect: Reconnect | null = null;
let reconnectingDeviceId = ""


// 开始升级
export const veepooJLStartOTAManager = function (value: any, callback: any) {
  const rcspOpImpl = RCSPManager.getCurrentRcspOperateWrapper()?.wrapper.getRcspOpImpl();
  if (rcspOpImpl == undefined) {
    return
  }
  /*--- 开始执行OTA升级 ---*/
  const otaConfig: OTAConfig = new OTAConfig()
  otaConfig.isSupportNewRebootWay = true
  otaConfig.updateFileData = value.updateFileData
  rcspOTAManager = new RcspOTAManager(rcspOpImpl)
  rcspOTAManager.startOTA(otaConfig, {
    onStartOTA: () => {
      let message = {
        otaProgressText: "开始升级"
      }
      callback(message)
    },
    onNeedReconnect: (reConnectMsg: ReConnectMsg) => {
      console.log("onNeedReconnect: ");
      let message = {
        otaProgressText: "正在回连设备..."
      }

      callback(message)
      //###实现回连，这一部分可以自己实现
      const op: ReconnectOp = {
        startScanDevice(): any {//开始扫描设备
          // RCSPBluetooth.bleScan.startScan()
          console.log('开始扫描回连设备');

          DeviceManager.starScan()
        },
        isReconnectDevice(scanDevice: BluetoothDevice): boolean { //判断是不是回连设备
          let result = false;
          const oldDevice = rcspOTAManager.getCurrentOTADevice()
          const oldDeviceMac = rcspOTAManager.getCurrentOTADeviceMac()
          // console.log(" reConnectMsg.isSupportNewReconnectADV : " + reConnectMsg.isSupportNewReconnectADV);
          // console.log(" oldDeviceMac " + oldDeviceMac);
          if (reConnectMsg.isSupportNewReconnectADV) {//使用新回连方式，需要通过rcsp协议获取到设备的ble地址
            if (oldDeviceMac != undefined && scanDevice.advertisData) {
              const advertisStr = ab2hex(scanDevice.advertisData).toUpperCase()
              const index = advertisStr.indexOf("D60541544F4C4A");
              if (index != -1) {
                const unit8Array = new Uint8Array(scanDevice.advertisData)
                const macArray = unit8Array.slice(index + 8, index + 14).reverse()
                // console.log("新回连广播包 newMAC : " + ab2hex(macArray).toUpperCase())
                result = oldDeviceMac.toUpperCase() == hex2Mac(macArray).toUpperCase()
              }
              console.log("新回连广播包 oldMAC : " + oldDeviceMac + " scanMAC: " + scanDevice.deviceId + " result: " + result + " rawData: " + ab2hex(scanDevice.advertisData));
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
          reconnectingDeviceId = device.deviceId
          DeviceManager.connecDevice(deviceTemp)
          // RCSPBluetooth.bleConnect.connectDevice(deviceTemp)
        }
      }
      const callbackOP: ReconnectCallback = {
        onReconnectSuccess(deviceId: string) {
          console.error("onReconnectSuccess : " + deviceId);
          /todo 回连成功应该把新设备和连接状态同步给 rcspOTA/
          rcspOTAManager.updateOTADevice(new Device(deviceId))
          _Reconnect = null;
        },
        onReconnectFailed() {//不用处理，库里会自动超时
          console.error("onReconnectFailed : ");
          _Reconnect = null;
        }
      }
      _Reconnect = new Reconnect(op, callbackOP)
      _Reconnect.startReconnect(OTAImpl.RECONNECT_DEVICE_TIMEOUT);
    },
    onProgress: (type: UpgradeType, progress: number) => {
      let msg = type == UpgradeType.UPGRADE_TYPE_FIRMWARE ? '发送sdk升级数据' : '发送uboot升级数据'
      let message = {
        otaProgressText: "正在" + msg + "...,进度：" + (new Number(progress).toFixed(2)),
        message: msg,
        progress: new Number(progress).toFixed(2)
      }
      callback(message)
    },
    onStopOTA: () => {
      let message = {
        otaProgressText: "升级成功"
      }
      callback(message)
      const connectedDeviceIds = rcspOTAManager.getCurrentOTADevice()?.deviceId
      if (connectedDeviceIds) {
        const bluetoothDevice = new BluetoothDevice()
        bluetoothDevice.deviceId = connectedDeviceIds
        DeviceManager.disconnectDevice(bluetoothDevice)
      }
      rcspOTAManager.release()
    },
    onCancelOTA: () => {

      let message = {
        otaProgressText: "升级取消"
      }
      callback(message)

      const connectedDeviceIds = rcspOTAManager.getCurrentOTADevice()?.deviceId
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
      let msg = {
        otaProgressText: '升级失败: 错误code：' + error + " 信息：" + message,
        error: error,
        message: message
      }
      callback(msg)
      const connectedDeviceIds = rcspOTAManager.getCurrentOTADevice()?.deviceId
      if (connectedDeviceIds) {
        const bluetoothDevice = new BluetoothDevice()
        bluetoothDevice.deviceId = connectedDeviceIds
        DeviceManager.disconnectDevice(bluetoothDevice)
      }
      rcspOTAManager.release()
    }
  })
}

// ota初始化
export const veepooJLOTAInITManager = function () {
  DeviceManager.observe(_onRCSPBluetoothEvent)

  rcspWrapperEventCallback = {
    onEvent: (_res) => {
      if (_res.type == "onRcspInit" && _res.onRcspInitEvent) {//单备份升级会切换ble地址，导致rcspOpImpl变换
        if (_res.onRcspInitEvent.isInit && _res.onRcspInitEvent.device.deviceId.toUpperCase() == reconnectingDeviceId.toUpperCase()) {
          const bluetoothDevice = RCSPManager.getBluetoothDeviceByDeviceId(_res.onRcspInitEvent.device.deviceId)
          if (bluetoothDevice) {
            const rcspOperateWrapper = RCSPManager.getRcspOperateWrapper(bluetoothDevice)
            const rcspOpImpl = rcspOperateWrapper?.getRcspOpImpl()
            if (rcspOpImpl) {
              _Reconnect?.onDeviceConnected(bluetoothDevice.deviceId)
              rcspOTAManager.updateRcspOpImpl(rcspOpImpl)
            }
          }
        }
      }
    }
  }
  RCSPManager.observe(rcspWrapperEventCallback)
}

// 发现设备连接
const _onRCSPBluetoothEvent = function (event: DeviceBluetooth.DeviceBluetoothEvent) {
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

// 销毁ota
export const veepooJLOTAUnloadObserveManager = function () {
  DeviceManager.removeObserve(_onRCSPBluetoothEvent)
  RCSPManager.removeObserve(rcspWrapperEventCallback)
}


export const JLUpdateOTADevice = function (device: any) {
  const rcspOpImpl = RCSPManager.getCurrentRcspOperateWrapper()?.wrapper.getRcspOpImpl();
  console.log("_Reconnectsssse==>", _Reconnect)
  console.log("rcspOpImpl==>", rcspOpImpl)
  if (rcspOpImpl == undefined) {
    return
  }


  /*--- 开始执行OTA升级 ---*/
  rcspOTAManager = new RcspOTAManager(rcspOpImpl);
  // 回连成功，更改信息
  rcspOTAManager.updateOTADevice(new Device(device.deviceId));

  // 先更改ota设备信息，在进行如下
  const bluetoothDevice = RCSPManager.getBluetoothDeviceByDeviceId(device.deviceId)
  console.log("bluetoothDevice==>", bluetoothDevice)
  if (bluetoothDevice) {
    const rcspOperateWrapper = RCSPManager.getRcspOperateWrapper(bluetoothDevice);
    console.log("rcspOperateWrapper==>", rcspOperateWrapper)
    const rcspOpImpl = rcspOperateWrapper?.getRcspOpImpl();
    console.log("rcspOpImpl=>", rcspOpImpl)
    if (rcspOpImpl) {
      // 回连成功
      // let device = wx.getStorageSync('bleInfo')
      // _Reconnect?.onAssignmentDevice(device)
      _Reconnect?.onDeviceConnected(bluetoothDevice.deviceId)
      console.log("_Reconnect==>", _Reconnect)
      rcspOTAManager.updateRcspOpImpl(rcspOpImpl);
      console.log("rcspOTAManager=>", rcspOTAManager)
    }
  }


}

const hex2Mac = function (buffer: ArrayBuffer) {
  const hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join(':')
}

/*
 ota相关代码结束
*/


/*
 照片表盘相关代码开始
*/

export const veepooJLGetDeviceInfoManager = function (callback: any) {
  RCSPOpWatch?.getFlashInfo().then((res) => {
    let devScreenWidth = res.width
    let devScreenHeight = res.height
    let message = {
      devScreenWidth,
      devScreenHeight
    }
    callback(message)

  })
}

/*
 照片表盘相关代码结束
*/