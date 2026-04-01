import { Auth, AuthListener } from "../../jl_lib/jl_auth_2.0.0"
import { CommandBase, Connection, Device, DeviceInfo, OnRcspCallback, OnSendDataCallback, RcspOpImpl } from "../../jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0"
import { BleScanMessage, BluetoothDevice, ScanDevice } from "../rcsp-protocol/rcsp-util"
import { RcspOperateWrapper, OPWatchDial, OPWatch, OPSystemInfo, OPLargerFileTrans, OPFile, OPDirectoryBrowse, OPHeadSet, OPLargerFileGet } from "../../jl_lib/jl-rcsp-op/jl_op_watch_1.1.0"
import { ab2hex } from "../../utils/log";
import { veepooBle, veepooFeature } from '../../../miniprogram_dist/index'
import { ConnectImpl } from '../bluetooth'
export var isAuth = true
export interface RCSPOption {
  sendData: (deviceId: string, data: Uint8Array) => boolean
  getBleScan: () => RCSPWrapperBluetooth.IBleScan | undefined
  getBleConnect: () => RCSPWrapperBluetooth.IBleConnect | undefined
}

export namespace RCSPWrapperBluetooth {
  export interface IBleScanCallback {
    /** 蓝牙适配器变化*/
    onBluetoothAdapterAvailable?: (available: boolean) => void
    /** 开始扫描设备*/
    onScanStart?: () => void
    /** 扫描失败*/
    onScanFailed?: (error: { errorCode: number, msg?: string }) => void
    /** 扫描结束*/
    onScanFinish?: () => void
    /** 发送设备*/
    onFound?: (devs: ScanDevice[]) => void
  }
  export interface IBleScan {
    /*蓝牙适配器是否可用*/
    isBluetoothAdapterAvailable(): boolean
    /*是否正在扫描*/
    isScanning(): boolean;
    /*添加回调*/
    addCallback(callback: IBleScanCallback): void;
    /*移除回调*/
    removeCallback(callback: IBleScanCallback): void;
    /*开始扫描*/
    startScan(scanTimeOut?: number): boolean;
    /*刷新扫描*/
    refreshScan(): void;
    /*停止扫描*/
    stopScan(): void;
  }
  export interface IBleConnectCallback {
    /** 蓝牙适配器变化*/
    onBluetoothAdapterAvailable?: (available: boolean) => void
    /** MTU改变*/
    onMTUChange?: (device: BluetoothDevice, mtu: number) => void
    /** 连接成功*/
    onConnectSuccess?: (device: BluetoothDevice) => void
    /** 连接失败*/
    onConnectFailed?: (device: BluetoothDevice, error: { errorCode: number, msg?: string }) => void
    /** 连接断开*/
    onConnectDisconnect?: (device: BluetoothDevice) => void
  }

  export interface IBleConnect {
    /*蓝牙适配器是否可用*/
    isBluetoothAdapterAvailable(): boolean
    addCallback(callback: IBleConnectCallback): void;
    /*移除回调*/
    removeCallback(callback: IBleConnectCallback): void;
    /** 连接设备*/
    connectDevice(device: BluetoothDevice): boolean;
    /** 断开已连接设备 */
    disconnect(device: BluetoothDevice): void;
    /** 获取已连接设备列表*/
    getConnectedDeviceIds(): Array<BluetoothDevice> | null;
    /** 获取设备MTU*/
    getMTU(device: BluetoothDevice): number | undefined;
    /** 是否正在连接*/
    isConnecting(device: BluetoothDevice): boolean;
    /** 是否已连接*/
    isConnected(device: BluetoothDevice): boolean;
  }
}
export namespace RCSP {
  //RCSP封装器事件
  export class RCSPWrapperEvent {
    type: 'onSwitchUseDevice' | 'onRcspInit' | 'onMandatoryUpgrade' | 'onRcspCommand' | 'onADVInfo' | undefined
    onSwitchUseDeviceEvent?: { device: BluetoothDevice | undefined }
    onRcspInitEvent?: { device: BluetoothDevice, isInit: boolean }
    onMandatoryUpgradeEvent?: { device: BluetoothDevice }
    onRcspCommandEvent?: { device: BluetoothDevice, command: CommandBase }
    onADVInfo?: { device: BluetoothDevice, advInfo: BleScanMessage }
  }
  //RCSP封装器事件回调
  export class RCSPWrapperEventCallback {
    onEvent(_res: RCSP.RCSPWrapperEvent) {
    }
  }
}


export class RcspWrapperManager {
  private _eventCallback: Array<RCSP.RCSPWrapperEventCallback> = new Array()
  private _RcspOpImplMap = new Map<string, RcspOpImpl>()
  private _RcspOperateWrapperMap = new Map<string, RcspOperateWrapper>()
  private _bluetoothDeviceMap = new Map<string, BluetoothDevice>()
  private _AuthMap = new Map<string, Auth>()
  private _currentRcspOperateWrapper: { deviceId: string, wrapper: RcspOperateWrapper } | undefined
  private _bleConnect: RCSPWrapperBluetooth.IBleConnect | undefined
  private _bleScan: RCSPWrapperBluetooth.IBleScan | undefined
  private _option: RCSPOption | undefined
  private _OnRcspCallback: OnRcspCallback = {
    onRcspInit: (device, isInit) => {
      this._onRcspInit(device, isInit)
    }, onRcspResponse: (_device, _command) => {
    }, onConnectStateChange: (_device, _status) => {

    }, onMandatoryUpgrade: (device) => {
      const deviceId = device?.deviceId
      let blueToothDevice: BluetoothDevice | undefined
      if (deviceId) {
        blueToothDevice = this._bluetoothDeviceMap.get(deviceId)
      }
      if (blueToothDevice == undefined) {
        return
      }
      const event = new RCSP.RCSPWrapperEvent()
      event.type = "onMandatoryUpgrade"
      event.onMandatoryUpgradeEvent = { device: blueToothDevice }
      this._notifyEvent(event)
    }, onRcspCommand: (device, command) => {
      const deviceId = device?.deviceId
      let blueToothDevice: BluetoothDevice | undefined
      if (deviceId) {
        blueToothDevice = this._bluetoothDeviceMap.get(deviceId)
      }
      if (blueToothDevice == undefined) {
        return
      }
      const event = new RCSP.RCSPWrapperEvent()
      event.type = "onRcspCommand"
      event.onRcspCommandEvent = { device: blueToothDevice, command }
      this._notifyEvent(event)
    }, onRcspDataCmd: (_device, _dataCmd) => {
    }, onRcspError: (_device, _error, _message) => {
    }
  }

  // private
  _bleConnectCallback: RCSPWrapperBluetooth.IBleConnectCallback = {
    /** 连接成功*/
    onConnectSuccess: (device: BluetoothDevice) => {
      wx.setStorageSync('JLBleConnected', true)

      this._onRCSPBluetoothEvent({
        type: "onConnection",
        onConnectionEvent: {
          device: device,
          status: 2
        }
      })


    },
    /** 连接失败*/
    onConnectFailed: (device: BluetoothDevice) => {
      this._onRCSPBluetoothEvent({
        type: "onConnection",
        onConnectionEvent: {
          device: device,
          status: 0
        }
      })
    },
    /** 连接已断开*/
    onConnectDisconnect: (device: BluetoothDevice) => {
      this._onRCSPBluetoothEvent({
        type: "onConnection",
        onConnectionEvent: {
          device: device,
          status: 0
        }
      })
    }
  }
  private _OnSendDataCallback: OnSendDataCallback = {
    sendDataToDevice: (device, data) => {
      console.log("_OnSendDataCallback data :" + ab2hex(data));

      return this._SendData(device.deviceId, data)
    }
  }
  constructor() {

  }
  JieLiDeviceVerify(device: any, callback?: any) {
    this._onRCSPBluetoothEvent({
      type: "onConnection",
      onConnectionEvent: {
        device: device,
        status: 2
      }
    }, (res: any) => {
      callback(res);
    })
  }
  /* 
  连接断开清除数据
  */
  JLOnConnectDisconnect(device: BluetoothDevice) {
    this._onRCSPBluetoothEvent({
      type: "onConnection",
      onConnectionEvent: {
        device: device,
        status: 0
      }
    })
  }
  init(option: RCSPOption) {
    this._option = option
    this._bleConnect = option.getBleConnect()
    this._bleScan = option.getBleScan()
    this._bleConnect?.addCallback(this._bleConnectCallback)
  }
  release() {
    if (this._bleConnectCallback) {
      this._bleConnect?.removeCallback(this._bleConnectCallback)
    }
  }
  switchDevice(device: BluetoothDevice) {
    const deviceIds = Array.from(this._RcspOperateWrapperMap.keys())
    for (let index = 0; index < deviceIds.length; index++) {
      const deviceId = deviceIds[index];
      if (deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
        this._currentRcspOperateWrapper = { deviceId: deviceId, wrapper: this._RcspOperateWrapperMap.get(deviceId)! }
        this._switchDevice(device)
      }
    }
  }
  onReceiveData(deviceId: string, data: ArrayBuffer) {
    const operateWrapper = this._RcspOperateWrapperMap.get(deviceId)
    if (operateWrapper) {
      operateWrapper.getRcspOpImpl().transmitDeviceData(new Device(deviceId), new Uint8Array(data))
    }
    for (const auth of this._AuthMap.values()) {
      auth.handlerAuth(deviceId, data)
    }
  }
  observe(onEvent: RCSP.RCSPWrapperEventCallback) {
    if (!this._eventCallback.includes(onEvent)) {
      this._eventCallback.push(onEvent)
    }
    return this
  }
  removeObserve(onEvent: RCSP.RCSPWrapperEventCallback) {
    const index = this._eventCallback.indexOf(onEvent)
    if (index != -1) {
      this._eventCallback.splice(index, 1)
    }
    return this
  }
  getDeviceInfo(bluetoothDevice: BluetoothDevice): DeviceInfo | undefined {
    const deviceInfo = this._RcspOperateWrapperMap.get(bluetoothDevice.deviceId)?.getRcspOpImpl().getDeviceInfo(bluetoothDevice)
    return deviceInfo
  }
  getADVInfo(bluetoothDevice: BluetoothDevice) {
    const OpHeadSet = this._RcspOperateWrapperMap.get(bluetoothDevice.deviceId)?.getOperaterByClass(OPHeadSet.OperateHeadSetInfo.prototype)
    return OpHeadSet?.getADVInfoSync()
  }
  getBluetoothDeviceByDeviceId(deviceId: string) {
    return this._bluetoothDeviceMap.get(deviceId)
  }
  getRcspOperateWrapper(device: BluetoothDevice) {
    return this._RcspOperateWrapperMap.get(device.deviceId)
  }
  getCurrentRcspOperateWrapper() {
    return this._currentRcspOperateWrapper
  }
  isConnectedDevce() {
    return this._currentRcspOperateWrapper != undefined
  }
  private _switchDevice(device: BluetoothDevice | undefined) {//切换控制设备后，同步更新 RCSP-op
    console.log("切换控制设备后，同步更新 RCSP-op");
    RCSPOpSystemInfo?.removeAllEventCallback()
    RCSPOpFile?.removeAllEventCallback()
    RCSPOpDirectoryBrowse?.removeAllEventCallback()
    RCSPOpLargeFileTransfer?.removeAllEventCallback()
    RCSPOpWatchDial?.removeAllEventCallback()
    RCSPOpWatch?.removeAllEventCallback()
    RCSPOpHeadSet?.removeAllEventCallback()
    // RCSPOpEq?.removeAllEventCallback()
    // RCSPOpBTMusic?.removeAllEventCallback()
    // RCSPOpFM?.removeAllEventCallback()
    // RCSPOpDevMusic?.removeAllEventCallback()
    // RCSPOpAlarm?.removeAllEventCallback()
    // RCSPOpLight?.removeAllEventCallback()
    // RCSPOpSoundCard?.removeAllEventCallback()
    // RCSPOpSearchDev?.removeAllEventCallback()
    RCSPOpLargeFileGet?.removeAllEventCallback()

    const operateWrapper = this.getCurrentRcspOperateWrapper()?.wrapper
    RCSPOpSystemInfo = operateWrapper?.getOperaterByClass(OPSystemInfo.OperateSystemInfo.prototype)
    RCSPOpFile = operateWrapper?.getOperaterByClass(OPFile.OperateFile.prototype)
    RCSPOpDirectoryBrowse = operateWrapper?.getOperaterByClass(OPDirectoryBrowse.OperateDirectoryBrowse.prototype)
    RCSPOpLargeFileTransfer = operateWrapper?.getOperaterByClass(OPLargerFileTrans.OperateLargeFileTrans.prototype)
    RCSPOpWatchDial = operateWrapper?.getOperaterByClass(OPWatchDial.OperateWatchDial.prototype)
    RCSPOpWatch = operateWrapper?.getOperaterByClass(OPWatch.OperateWatch.prototype)
    RCSPOpHeadSet = operateWrapper?.getOperaterByClass(OPHeadSet.OperateHeadSetInfo.prototype)
    // RCSPOpEq = operateWrapper?.getOperaterByClass(OPEq.OperateEq.prototype)
    // RCSPOpBTMusic = operateWrapper?.getOperaterByClass(OPBTMusic.OperateBTMusic.prototype)
    // RCSPOpFM = operateWrapper?.getOperaterByClass(OPFM.OperateFM.prototype)
    // RCSPOpDevMusic = operateWrapper?.getOperaterByClass(OPDevMusic.OperateDevMusic.prototype)
    // RCSPOpAlarm = operateWrapper?.getOperaterByClass(OPAlarm.OperateAlarm.prototype)
    // RCSPOpLight = operateWrapper?.getOperaterByClass(OPLight.OperateLight.prototype)
    // RCSPOpSoundCard = operateWrapper?.getOperaterByClass(OPSoundCard.OperateSoundCard.prototype)
    // RCSPOpSearchDev = operateWrapper?.getOperaterByClass(OPSearchDev.OperateSearchDev.prototype)
    RCSPOpLargeFileGet = operateWrapper?.getOperaterByClass(OPLargerFileGet.OperateLargeFileGet.prototype)
    //todo 把事件总线添加进入op
    this._onSwitchUseDeviceEvent(device)
  }
  private _SendData(deviceId: string, data: Uint8Array) {
    if (this._option) {
      return this._option.sendData(deviceId, data)
    }
    return false
  }
  private _onSwitchUseDeviceEvent(device: BluetoothDevice | undefined) {
    const event = new RCSP.RCSPWrapperEvent()
    event.type = 'onSwitchUseDevice'
    event.onSwitchUseDeviceEvent = { device }
    this._notifyEvent(event)
  }
  private _onRCSPBluetoothEvent(event: { type: string, onConnectionEvent: { device: BluetoothDevice, status: number }, }, callback?: any) {
    if (event.type === 'onConnection' && event.onConnectionEvent) {
      const device = event.onConnectionEvent.device
      if (event.onConnectionEvent.status == 2) {//已连接
        if (isAuth) {//需要认证
          let auth = new Auth()
          let authListener: AuthListener = {
            onSendData: (deviceId: string, data: ArrayBuffer) => {
              this._SendData(deviceId, new Uint8Array(data))
            },
            onAuthSuccess: () => {
              this._AuthMap.delete(device.deviceId)
              console.log(" onAuthSuccess: " + device.name);
              console.log("认证成功=====================================================");
              let msg = {
                authStatus: true,
                device: device.deviceId
              }
              this._onDeviceConnected(device)
              callback(msg)

            },
            onAuthFailed: () => {
              this._AuthMap.delete(device.deviceId)
              console.log("onAuthFailed: ");
              //认证失败也走RCSP命令,为了处理频繁断连的情况
              let msg = {
                authStatus: false,
                device: device.deviceId
              }
              this._onDeviceConnected(device)
              callback(msg)

            },
          }
          this._AuthMap.set(device.deviceId, auth)
          auth.startAuth(event.onConnectionEvent.device.deviceId, authListener)
        } else {//不需要认证
          this._onDeviceConnected(event.onConnectionEvent.device)
        }
      } else if (event.onConnectionEvent.status == 0) {//已断开
        this._onDeviceDisconnected(event.onConnectionEvent.device)
      }
    }
  }

  // arkts 实际上就是ts的一个删减版，

  private _onDeviceConnected(device: BluetoothDevice) {//蓝牙已连接,已认证
    let rcspOpImpl = this._RcspOpImplMap.get(device.deviceId)
    console.log("rcspOpImpl蓝牙认证======>", rcspOpImpl)
    console.log("device蓝牙认证======>", device)
    if (rcspOpImpl == undefined) {
      rcspOpImpl = new RcspOpImpl()
      this._RcspOpImplMap.set(device.deviceId, rcspOpImpl)
    }
    if (this._OnRcspCallback) {
      rcspOpImpl.addOnRcspCallback(this._OnRcspCallback)
      rcspOpImpl.setOnSendDataCallback(this._OnSendDataCallback)
    }
    console.log('new Device(device.deviceId, device.name), Connection.CONNECTION_CONNECTED=>', new Device(device.deviceId, device.name), Connection.CONNECTION_CONNECTED)
    rcspOpImpl.transmitDeviceStatus(new Device(device.deviceId, device.name), Connection.CONNECTION_CONNECTED)
    const operateWrapper = new RcspOperateWrapper(rcspOpImpl)
    this._bluetoothDeviceMap.set(device.deviceId, device)
    this._RcspOperateWrapperMap.set(device.deviceId, operateWrapper)

    {//监听设备的广播包
      const opHeadSet = operateWrapper.getOperaterByClass(OPHeadSet.OperateHeadSetInfo.prototype)
      const operaterEventCallbackHeadset: OPHeadSet.OperaterEventCallbackHeadset = {
        onEvent: (_event) => {
          switch (_event.type) {
            case 'DeviceBroadcast':
              const advInfo = _event.DeviceBroadcast?.broadcast
              if (advInfo != null) {
                const event = new RCSP.RCSPWrapperEvent()
                event.type = 'onADVInfo'
                event.onADVInfo = { device: device, advInfo: advInfo }
                this._notifyEvent(event)
              }
              break;
            default:
              break;
          }
        }
      }
      opHeadSet?.registerEventCallback(operaterEventCallbackHeadset)
    }
    if (this._RcspOperateWrapperMap.size == 1) {//只有一个设备，需要设置为当前操作
      this._currentRcspOperateWrapper = { deviceId: device.deviceId, wrapper: operateWrapper }
      this._switchDevice(device)
    }
  }
  private _onDeviceDisconnected(device: BluetoothDevice) {
    const operateWrapper = this._RcspOperateWrapperMap.get(device.deviceId)
    if (operateWrapper) {
      if (this._OnRcspCallback) {
        const rcspOpImpl = operateWrapper.getRcspOpImpl()
        rcspOpImpl.transmitDeviceStatus(new Device(device.deviceId, device.name), Connection.CONNECTION_DISCONNECT)
        rcspOpImpl.removeOnRcspCallback(this._OnRcspCallback)
        rcspOpImpl.setOnSendDataCallback(undefined)
      }
      operateWrapper.release()
      this._bluetoothDeviceMap.delete(device.deviceId)
      this._RcspOperateWrapperMap.delete(device.deviceId)
    }
    if (device.deviceId === this._currentRcspOperateWrapper?.deviceId) {//断开的是当前操作设备
      if (this._RcspOperateWrapperMap.size > 0) {//还有已连接设备
        const deviceId: string = Array.from(this._RcspOperateWrapperMap.keys())[0]
        const operateWrapper = this._RcspOperateWrapperMap.get(deviceId)
        this._currentRcspOperateWrapper = { deviceId: deviceId, wrapper: operateWrapper! }
        this._switchDevice(this._bluetoothDeviceMap.get(deviceId))
      } else {//未连接设备
        this._currentRcspOperateWrapper = undefined
        this._switchDevice(undefined)
      }
    }
  }
  private _onRcspInit(device: Device | null, isInit: boolean | undefined) {
    const deviceId = device?.deviceId
    let blueToothDevice: BluetoothDevice | undefined
    if (deviceId) {
      blueToothDevice = this._bluetoothDeviceMap.get(deviceId)
    }
    if (blueToothDevice == undefined) {
      return
    }
    if (deviceId && isInit && device) {
      const deviceInfo = this._RcspOperateWrapperMap.get(deviceId)?.getRcspOpImpl().getDeviceInfo(device)
      let mac = deviceInfo?.bleAddr ? deviceInfo?.bleAddr : deviceInfo?.edrAddr
      if (deviceInfo && mac) {
        this._onRcspInitEventHandle(blueToothDevice, true)
      } else {//没有设备信息
        this._onRcspInitEventHandle(blueToothDevice, false)
        // this._rcspBluetooth.disconnectDevice(blueToothDevice)
        console.log("没有设备信息=>", deviceInfo)
        this._bleConnect?.disconnect(blueToothDevice)

      }
    } else if (deviceId && !isInit) {//未初始化成功
      this._onRcspInitEventHandle(blueToothDevice, false)
      // this._rcspBluetooth.disconnectDevice(blueToothDevice)
      console.log('未初始化成功deviceId=>', deviceId, isInit)
      this._bleConnect?.disconnect(blueToothDevice)
    }
  }
  private _onRcspInitEventHandle(bluetooth: BluetoothDevice, isInit: boolean) {
    const event = new RCSP.RCSPWrapperEvent()
    event.type = 'onRcspInit'
    event.onRcspInitEvent = { device: bluetooth, isInit }
    this._notifyEvent(event)
  }
  private _notifyEvent(event: RCSP.RCSPWrapperEvent) {
    this._eventCallback.forEach(element => {
      element.onEvent(event)
    });
  }
}

export var RCSPManager = new RcspWrapperManager()

export var RCSPOpSystemInfo: OPSystemInfo.IOperateSystemInfo | undefined

export var RCSPOpFile: OPFile.IOperateFile | undefined

export var RCSPOpDirectoryBrowse: OPDirectoryBrowse.IOperateDirectoryBrowse | undefined

export var RCSPOpLargeFileTransfer: OPLargerFileTrans.IOperateLargeFileTrans | undefined

export var RCSPOpWatchDial: OPWatchDial.IOperateWatchDial | undefined

export var RCSPOpWatch: OPWatch.IOperateWatch | undefined

export var RCSPOpHeadSet: OPHeadSet.IOperateHeadSetInfo | undefined

// export var RCSPOpEq: OPEq.IOperateEq | undefined

// export var RCSPOpBTMusic: OPBTMusic.IOperateBTMusic | undefined

// export var RCSPOpFM: OPFM.IOperateFM | undefined

// export var RCSPOpDevMusic: OPDevMusic.IOperateDevMusic | undefined

// export var RCSPOpAlarm: OPAlarm.IOperateAlarm | undefined

// export var RCSPOpLight: OPLight.IOperateLight | undefined

// export var RCSPOpSoundCard: OPSoundCard.IOperateSoundCard | undefined

// export var RCSPOpSearchDev: OPSearchDev.IOperateSearchDev | undefined

export var RCSPOpLargeFileGet: OPLargerFileGet.IOperateLargeFileGet | undefined
