// app.ts
import { getLogger } from "../jieli_sdk/utils/logger";
import { setLogger as setOTALogger } from "../jieli_sdk/jl_lib/jl-ota/jl_ota_2.1.0";
import { setLogger as setRCSPLogger } from "../jieli_sdk/jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0";
import { setLogger as setAppLogger } from "../jieli_sdk/utils/log";
import { RCSPManager, RCSP, RCSPOpWatchDial } from "../jieli_sdk/lib/rcsp-impl/rcsp";
import { BleDataHandler, BleSendDataHandler } from "../jieli_sdk/lib/ble-data-handler";
import { Bluetooth, UUID_NOTIFY, UUID_SERVICE, UUID_WRITE, wxBluetooth } from "../jieli_sdk/lib/rcsp-impl/bluetooth";
import { DeviceBluetooth, DeviceManager } from "../jieli_sdk/lib/rcsp-impl/dev-bluetooth";
import { CommandBase, Connection, Device, DeviceInfo, OnRcspCallback, OnSendDataCallback, RcspOpImpl } from "../jieli_sdk/jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0"

export class veepooJLBle {
  // sdk初始化
  init: Function

  // 监听连接状态
  connectionStatus: Function

  constructor() {
    // 杰里sdk初始化
    this.init = function () {
      // 连接成功，属于杰里设备
      wx.setStorageSync('JLBleConnected', false)
      // 杰里连接成功
      wx.setStorageSync('getServiceStatus', false)
      const logger = getLogger()
      if (logger != null) {
        console.log('logger=>', logger)
        setOTALogger(logger)
        setRCSPLogger(logger)
        setAppLogger(logger)
      }
      {
        //蓝牙
        // var bluetooth = new Bluetooth()
        const bluetooth = wxBluetooth
        // bluetooth.bluetoothManager.openBluetoothAdapter()
        //RCSP协议
        RCSPManager.init({
          sendData: (deviceId, data) => {
            console.log("发送数据deviceId,data", deviceId, data)
            console.log("deviceId, UUID_SERVICE, UUID_WRITE, data=>", deviceId, UUID_SERVICE, UUID_WRITE, data)
            return BleSendDataHandler.sendData(deviceId, UUID_SERVICE, UUID_WRITE, data)
          }, getBleConnect: () => {
            return bluetooth.bleConnect
          }, getBleScan: () => {
            return bluetooth.bleScan
          }
        })
        //设备管理
        const bluetoothOption = new DeviceBluetooth.BluetoothOption()
        bluetoothOption.isUseMultiDevice = true
        bluetoothOption.bleScanStrategy = 0
        console.log("bluetoothOption=>", bluetoothOption)
        DeviceManager.init({
          bluetoothOption,
          iScan: bluetooth.bleScan,
          iConnect: bluetooth.bleConnect
        }).observe((event: any) => {
          switch (event.type) {
            case 'onBleDataBlockChanged'://调整mtu成功
              const eventInfo = event.onBleDataBlockChangedEvent;
              console.log('eventInfo==>', eventInfo);

              console.log("调整mtu成功")
              if (eventInfo && eventInfo.status == 0) {
                BleSendDataHandler.setMtu(eventInfo.device.deviceId, eventInfo.block);
                console.log("eventInfo.device.deviceId, eventInfo.block=>", eventInfo.device.deviceId, eventInfo.block)
              }
              break;
            case 'onShowDialog'://弹窗
              break;
            default:
              break;
          }
        })
        //蓝牙收数据
        const bleDataCallback = {
          onReceiveData: (res: WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult) => {
            console.log("蓝牙收数据=================res=>========================", res)
            if (res.characteristicId.toLowerCase() === UUID_NOTIFY.toLowerCase() && res.serviceId.toLowerCase() === UUID_SERVICE.toLowerCase()) {
              RCSPManager.onReceiveData(res.deviceId, res.value)
            }
          }
        }
        BleDataHandler.init()
        BleDataHandler.addCallbacks(bleDataCallback)
      }
    }

    // 监听连接状态
    this.connectionStatus = function (callback: any) {
      console.log("22423434")
      let time = setInterval(() => {
        wx.getConnectedBluetoothDevices({
          services: [],
          success(res) {
            console.log('已经连接的蓝牙', res)
            callback(res)
          }
        })
      }, 500)
    }
  }
}