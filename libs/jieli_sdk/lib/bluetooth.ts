import { loge, logi, logv, setTagEnable } from "../utils/log";
export class BluetoothManager {
  private _tag = "BluetoothManager"
  private _scanImpl: ScanImpl
  private _connectImpl: ConnectImpl
  private _bluetoothAdapterAvailable: boolean = false
  constructor() {
    setTagEnable(this._tag, true)
    this._scanImpl = new ScanImpl()
    this._connectImpl = new ConnectImpl()
    wx.onBluetoothAdapterStateChange((res) => {
      //监听蓝牙适配器状态
      console.log('adapterState changed, now is', res)
      if (res.available != this._bluetoothAdapterAvailable) {
        this._onBluetoothAdapterAvailable(res.available)
      }
    })
    wx.getBluetoothAdapterState({
      success: (res) => {
        this._onBluetoothAdapterAvailable(res.available)
      },
      fail: e => {
        loge('获取蓝牙适配器状态失败，错误码：' + e.errCode, this._tag);
      }
    })
  }
  /**
   * 打开蓝牙适配器
   */
  public openBluetoothAdapter(callback?: { success: () => void, fail: () => void }) {
    wx.openBluetoothAdapter({
      success: () => {
        callback?.success()
        wx.getBluetoothAdapterState({
          success: (res) => {
            this._onBluetoothAdapterAvailable(res.available)
          },
          fail: e => {
            loge('获取蓝牙适配器状态失败，错误码：' + e.errCode, this._tag);
          }
        })
      },
      fail: (error) => {
        callback?.fail()
      }
    })
  }
  public closeBluetoothAdapter(callback?: { success: () => void, fail: () => void }) {
    wx.closeBluetoothAdapter({
      success: () => {
        callback?.success()
      },
      fail: (error) => {
        callback?.fail()
      }
    })
  }
  /**
   * 是否蓝牙适配器可用
   */
  public isBluetoothAdapterAvailable(): boolean {
    return this._bluetoothAdapterAvailable
  }
  /**
   * 
   */
  public getScanImpl(): IScan {
    return this._scanImpl
  }
  /**
   * 
   */
  public getConnectImpl(): IConnect {
    return this._connectImpl
  }
  private _onBluetoothAdapterAvailable(available: boolean) {
    this._bluetoothAdapterAvailable = available;
    this._scanImpl.onBluetoothAdapterAvailable(available)
    this._connectImpl.onBluetoothAdapterAvailable(available)
  }
}
export class BluetoothError {
  errCode: BluetoothErrorConstant = BluetoothErrorConstant.ERROR_NONE
  errMsg?: string
  constructor(errorCode: BluetoothErrorConstant, errMsg?: string) {
    this.errCode = errorCode
    this.errMsg = errMsg
  }
}
export enum BluetoothErrorConstant {
  //微信的api错误
  ERROR_NONE = 0, //ok | 正常 |adapter
  ERROR_CONNECTED = - 1,// already connect | 已连接 |
  ERROR_ADAPTER_NOT_INIT = 10000, // not init | 未初始化蓝牙适配器 |
  ERROR_ADAPTER_NOT_AVAILABLE = 10001, // not available | 当前蓝牙适配器不可用 |
  ERROR_NO_DEV = 10002,// no device | 没有找到指定设备 |
  ERROR_CONNECTION_FAIL = 10003,// connection fail | 连接失败 |
  ERROR_NO_SERVICE = 10004,// no service | 没有找到指定服务 |
  ERROR_NO_CHARACTERISTIC = 10005,// no characteristic | 没有找到指定特征 |
  ERROR_NO_CONNECTION = 10006,// no connection | 当前连接已断开 |
  ERROR_PROPERTY_NOT_SUPOORT = 10007,// property not support | 当前特征不支持此操作 |
  ERROR_SYSTEM_ERROR = 10008,// system error | 其余所有系统上报的异常 |
  ERROR_SYSTEM_NOT_SUPPORT = 10009,// system not support | Android 系统特有，系统版本低于 4.3 不支持 BLE |
  ERROR_EPERATE_TIME_OUT = 10012,// operate time out | 连接超时 |
  ERROR_INVALID_DATA = 10013,// invalid_data | 连接 deviceId 为空或者是格式不正确 |
  //自定义的蓝牙错误
  ERROR_ = 20000,
}
export interface IScan {
  /*蓝牙适配器是否可用*/
  isBluetoothAdapterAvailable(): boolean
  /*是否正在扫描*/
  isScanning(): boolean
  /*添加回调*/
  addCallback(callback: ScanCallback): void
  /*移除回调*/
  removeCallback(callback: ScanCallback): void
  /*开始扫描*/
  startScan(scanTimeOut?: number): boolean
  /*刷新扫描*/
  refreshScan(): void
  /*停止扫描*/
  stopScan(): void
  /*获取扫描配置*/
  getScanSettingConfigure(): ScanSettingConfigure
  /*设置扫描配置*/
  setScanSettingConfigure(scanSettingConfigure: ScanSettingConfigure): void
}
class ScanImpl implements IScan {
  private _tag = "ScanImpl"
  /**扫描配置*/
  private _scanSettingConfigure: ScanSettingConfigure
  private _platform: string = "android"
  private _scanTimeoutID?: number
  private _scanSystemConnectedDevInterval?: number
  private _isScanning: boolean = false
  private _bluetoothAdapterAvailable: boolean = false
  private _scanDevList: Array<ScanDevice> = new Array()
  private _callbacks: Array<ScanCallback> = new Array<ScanCallback>()
  constructor() {
    setTagEnable(this._tag, false)
    this._platform = wx.getSystemInfoSync().platform
    this._scanSettingConfigure = new ScanSettingConfigure()
  }
  getScanSettingConfigure(): ScanSettingConfigure {
    return this._scanSettingConfigure
  }
  /*设置扫描配置*/
  setScanSettingConfigure(scanSettingConfigure: ScanSettingConfigure): void {
    this._scanSettingConfigure = scanSettingConfigure
  }
  public onBluetoothAdapterAvailable(available: boolean) {
    this._bluetoothAdapterAvailable = available
    if (!this._bluetoothAdapterAvailable) {//蓝牙不可用
      this.stopScan()
    }
    this._onBluetoothAdapterAvailable(available)
  }
  /**
   * 是否蓝牙适配器可用
   */
  public isBluetoothAdapterAvailable(): boolean {
    return this._bluetoothAdapterAvailable
  }
  /**
   * 是否正在扫描
   */
  public isScanning(): boolean {
    return this._isScanning
  }
  /**
   * 添加回调
   */
  public addCallback(callback: ScanCallback) {
    if (this._callbacks.indexOf(callback) == -1) {
      this._callbacks.push(callback);
    }
  }
  /**
   * 移除回调
   */
  public removeCallback(callback: ScanCallback) {
    var index = this._callbacks.indexOf(callback);
    if (index != -1) {
      this._callbacks.splice(index, 1);
    }
  }
  /**
   * 开始扫描设备
   */
  public startScan(scanTimeOut?: number): boolean {
    let res = false
    if (this.isBluetoothAdapterAvailable()) {//蓝牙是否打开
      if (scanTimeOut) {//更新扫描时间
        this._scanSettingConfigure.scanTimeOut = scanTimeOut
      }
      if (this._isScanning) {//正在扫描中		
        this.refreshScan()
      } else {
        this._stopTiming()
        this._startTiming()
        this._startScan()
      }
      res = true
    } else {
      const e: BluetoothError = {
        errCode: BluetoothErrorConstant.ERROR_ADAPTER_NOT_AVAILABLE,
        errMsg: "not available"
      }
      this._onScanFailed(e)
    }
    return res
  }
  /**
   * 刷新扫描
   */
  public refreshScan() {
    if (this._isScanning) {//正在扫描
      this._scanDevList.length = 0
      this._stopTiming()
      this._startTiming()
      //也需要把系统设备添加进去
    }
  }
  /**
   * 停止扫描设备
   */
  public stopScan(): boolean {
    let res = false
    this._stopTiming()
    if (this._scanSystemConnectedDevInterval) {
      clearInterval(this._scanSystemConnectedDevInterval)
    }
    this._stopScan()
    return res
  }
  private _startScan() {
    logi("开始搜索蓝牙设备", this._tag);
    wx.startBluetoothDevicesDiscovery({
      services: this._scanSettingConfigure.filterServic,
      allowDuplicatesKey: this._scanSettingConfigure.allowDuplicatesKey,
      interval: this._scanSettingConfigure.interval,
      powerLevel: this._scanSettingConfigure.powerLevel,
      success: e => {
        logi('开始搜索蓝牙设备成功:' + e.errMsg, this._tag);
        this._isScanning = true
        this._onScanStart()
        this._onBluetoothDeviceFound();
        if (this._scanSettingConfigure.isContainSystemsConnectedDevice) {
          this._onSystemConnectedDeviceFound()
        }
      },
      fail: e => {
        loge('搜索蓝牙设备失败，错误码：' + e.errCode, this._tag);
        this._stopTiming()
        this._onScanFailed(e)
      }
    });
  }
  private _stopScan() {
    this._isScanning = false
    wx.stopBluetoothDevicesDiscovery()
    wx.offBluetoothDeviceFound()
    this._onScanFinish()
  }
  private _onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      logv(" _onBluetoothDeviceFound 1: " + JSON.stringify(res), this._tag)
      res.devices.forEach(device => {
        const scanDevice = new ScanDevice(device.deviceId, convertWechatDeviceToBluetoothDevice(device), false)
        this._handlerFoundDevcie(scanDevice)
      })
      this._onFound(this._scanDevList)
    })
  }
  private _handlerFoundDevcie(scanDev: ScanDevice) {
    const foundDevices = this._scanDevList
    const idx = inArray(foundDevices, 'deviceId', scanDev.device.deviceId)
    if (idx === -1) {
      this._scanDevList[foundDevices.length] = scanDev
    } else {//更新信息
      this._scanDevList[idx] = scanDev
    }
  }
  /** 系统已连接设备*/
  private _onSystemConnectedDeviceFound() {
    this._scanSystemConnectedDevInterval = setInterval(() => {
      this._getSystemConnectedDevice({
        success: (scanDevices: Array<ScanDevice>) => {
          scanDevices.forEach(device => {
            this._handlerFoundDevcie(device)
          })
          //TODO 这里会频繁刷新，导致ui卡顿
          this._onFound(this._scanDevList)
        }, fail: (error: WechatMiniprogram.BluetoothError) => {
          loge("_onSystemConnectedDeviceFound errCode: " + error.errCode + "  errMsg:" + error.errMsg, this._tag)
        }
      })
    }, 50)
  }
  private _getSystemConnectedDevice(callback: { success: (scanDevs: Array<ScanDevice>) => void, fail: (error: WechatMiniprogram.BluetoothError) => void }) {
    // logv("_getSystemConnectedDevice",this._tag)
    const obj: WechatMiniprogram.GetConnectedBluetoothDevicesOption = { services: [] }
    if (this._platform == 'ios') {
      obj.services = ['AE00']
    } else {
      obj.services = new Array()
    }
    obj.success = (res) => {
      // console.log("getConnectedBluetoothDevices : " + JSON.stringify(res))
      const resultArray = new Array()
      for (let index = 0; index < res.devices.length; index++) {
        const device = res.devices[index];
        const blueToothDevice: BluetoothDevice = new BluetoothDevice()
        blueToothDevice.deviceId = device.deviceId
        blueToothDevice.localName = device.name
        blueToothDevice.name = device.name
        blueToothDevice.RSSI = 0
        blueToothDevice.serviceData = {}
        blueToothDevice.advertisData = new ArrayBuffer(0)
        blueToothDevice.advertisServiceUUIDs = []
        blueToothDevice.connectable = true

        const scanDevice = new ScanDevice(device.deviceId, blueToothDevice, true)
        resultArray.push(scanDevice)
      }
      callback.success(resultArray)
    }
    obj.fail = (res) => {
      callback.fail(res)
    }
    wx.getConnectedBluetoothDevices(obj)
  }
  private _stopTiming() {
    if (this._scanTimeoutID) {
      clearTimeout(this._scanTimeoutID)
    }
    this._scanTimeoutID = undefined;
  }
  private _startTiming(): boolean {
    let result = false
    if (!this._scanTimeoutID) {
      this._scanTimeoutID = setTimeout(() => {
        if (this._scanSystemConnectedDevInterval) {
          clearInterval(this._scanSystemConnectedDevInterval)
        }
        this._stopScan();
      }, this._scanSettingConfigure.scanTimeOut)
      result = true
    } else {//扫描定时器不为空
    }
    return result
  }
  private _onBluetoothAdapterAvailable(available: boolean) {
    this._callbacks.forEach(c => {
      if (c.onBluetoothAdapterAvailable) {
        c.onBluetoothAdapterAvailable(available);
      }
    });
  }
  private _onScanStart() {
    loge("_onScanStart")
    this._callbacks.forEach(c => {
      if (c.onScanStart) {
        c.onScanStart();
      }
    });
  }
  private _onScanFailed(error: BluetoothError) {
    loge("_onScanFailed:" + JSON.stringify(error))
    this._callbacks.forEach(c => {
      if (c.onScanFailed) {
        c.onScanFailed(error);
      }
    });
  }
  private _onScanFinish() {
    loge("_onScanFinish")
    this._callbacks.forEach(c => {
      if (c.onScanFinish) {
        c.onScanFinish();
      }
    });
  }
  private _onFound(devices: ScanDevice[]) {
    this._callbacks.forEach(c => {
      if (c.onFound) {
        c.onFound(devices);
      }
    });
  }
}
export class BluetoothDevice {
  /** 当前蓝牙设备的信号强度，单位 dBm */
  RSSI: number = 0
  /** 当前蓝牙设备的广播数据段中的 ManufacturerData 数据段。 */
  advertisData?: ArrayBuffer
  /** 当前蓝牙设备的广播数据段中的 ServiceUUIDs 数据段 */
  advertisServiceUUIDs?: string[]
  /** 当前蓝牙设备是否可连接（ Android 8.0 以下不支持返回该值 ） */
  connectable: boolean = true
  /** 蓝牙设备 id */
  deviceId: string = ""
  /** 当前蓝牙设备的广播数据段中的 LocalName 数据段 */
  localName: string = ""
  /** 蓝牙设备名称，某些设备可能没有 */
  name?: string
  /** 当前蓝牙设备的广播数据段中的 ServiceData 数据段 */
  serviceData: any
  public equals(o: BluetoothDevice | null): boolean {
    if (o == null) return false;
    if (this == o) return true;
    return this.deviceId == o.deviceId;
  }
}
export class ScanDevice {
  deviceId: string
  device: BluetoothDevice
  isSystem: boolean
  constructor(deviceId: string, device: BluetoothDevice, isSystem: boolean) {
    this.deviceId = deviceId
    this.device = device
    this.isSystem = isSystem
  }
}
export class ScanSettingConfigure {
  /**是否包含系统设备*/
  public isContainSystemsConnectedDevice: boolean = false
  /** 是否打开扫描超时 todo 后续拓展*/
  public isOpenScanTimeout: boolean = true
  /** 扫描超时时间*/
  public scanTimeOut: number = 30000
  /** 过滤Services，要搜索的蓝牙设备主服务的 UUID 列表（支持 16/32/128 位 UUID）。
   * 某些蓝牙设备会广播自己的主 service 的 UUID。如果设置此参数，则只搜索广播包有对应 UUID 的主服务的蓝牙设备。
   * 建议通过该参数过滤掉周边不需要处理的其他蓝牙设备。*/
  public filterServic?: Array<string>
  /** 允许重复上报同一个设备*/
  public allowDuplicatesKey: boolean = true
  /** 上报设备的间隔，单位 ms。0 表示找到新设备立即上报，其他数值根据传入的间隔上报。*/
  public interval: number = 0
  /** 扫描模式*/
  public powerLevel: 'low' | 'medium' | 'high' = 'medium'
}
export class ScanCallback {
  /**适配器发生变化*/
  onBluetoothAdapterAvailable?: (available: boolean) => void
  /** 开始扫描设备*/
  onScanStart?: () => void
  /** 扫描失败*/
  onScanFailed?: (error: BluetoothError) => void
  /** 扫描结束*/
  onScanFinish?: () => void
  /** 发送设备*/
  onFound?: (devs: ScanDevice[]) => void
}

export interface IConnect {
  /*蓝牙适配器是否可用*/
  isBluetoothAdapterAvailable(): boolean
  /**设置连接配置*/
  setConnectSettingConfigure(config: ConnectSettingConfigure): void
  /*添加回调*/
  addCallback(callback: ConnectImplCallback): void
  /*移除回调*/
  removeCallback(callback: ConnectImplCallback): void
  /** 连接设备*/
  connectDevice(device: BluetoothDevice, connectCallback: ConnectCallback): boolean
  /** 断开已连接设备 */
  disconnect(device: BluetoothDevice): void
  /** 断开已连接设备 */
  disconnect(device: BluetoothDevice): void
  /** 获取已连接设备列表*/
  getConnectedDeviceIds(): Array<BluetoothDevice> | null
  /** 获取设备MTU*/
  getMTU(device: BluetoothDevice): number | undefined
  /** 是否正在连接*/
  isConnecting(device: BluetoothDevice): boolean
  /** 是否已连接*/
  isConnected(device: BluetoothDevice): boolean
}
//todo 想办法不把区分OTA放在这里做
class ConnectImpl implements IConnect {
  private _tag = "ConnectImpl"
  private _bluetoothAdapterAvailable: boolean = false
  private _connectConfigure: ConnectSettingConfigure = new ConnectSettingConfigure()
  private _callbacks: Array<ConnectImplCallback> = new Array<ConnectImplCallback>()
  private _connectCallbacks: Map<string, ConnectCallback> = new Map()
  // private _connectCallback?: 
  private _connectingDeviceIdArray = new Array<BluetoothDevice>()
  private _connectedDeviceIdArray = new Array<BluetoothDevice>()
  private _mtuMap = new Map<string, number>()
  private _platform = 'android'
  constructor() {
    setTagEnable(this._tag, true)
    this._platform = wx.getSystemInfoSync().platform;
  }
  /**
   * 设置连接配置
   */
  public setConnectSettingConfigure(config: ConnectSettingConfigure) {
    this._connectConfigure = config
  }
  public onBluetoothAdapterAvailable(available: boolean) {
    this._bluetoothAdapterAvailable = available
    if (!available) {
      wx.offBLEConnectionStateChange()
    } else {
      this._registerConnStatusListener()
    }
    this._onBluetoothAdapterAvailable(available)
  }
  /**
   * 是否蓝牙适配器可用
   */
  public isBluetoothAdapterAvailable(): boolean {
    return this._bluetoothAdapterAvailable
  }
  /** 添加回调 */
  public addCallback(callback: ConnectImplCallback): void {
    if (this._callbacks.indexOf(callback) == -1) {
      this._callbacks.push(callback);
    }
  }
  /** 移除回调 */
  public removeCallback(callback: ConnectImplCallback): void {
    var index = this._callbacks.indexOf(callback);
    if (index != -1) {
      this._callbacks.splice(index, 1);
    }
  }
  /**
   * 连接设备
   */
  public connectDevice(device: BluetoothDevice, connectCallback: ConnectCallback): boolean {
    let result = false
    this._addConnectingDeviceId(device)
    this._connectCallbacks.set(device.deviceId, connectCallback)
    const connectOption: WechatMiniprogram.CreateBLEConnectionOption = {
      deviceId: device.deviceId
    }
    if (this._connectConfigure.timeout) {
      connectOption.timeout = this._connectConfigure.timeout
    }
    connectOption.success = () => {
      if (this._platform == 'android') {
        wx.setBLEMTU({//怀疑并发的时候会mtu混乱
          deviceId: device.deviceId,
          mtu: this._connectConfigure.mtu,

          success: res => {
            logv('调节MTU成功，' + res.mtu, this._tag);
            this._updateDeviceIdMtu(device.deviceId, res.mtu)
            this._onMTUChange(device, res.mtu)
            this._getBLEDeviceServices(device);
            // this._registerConnStatusListener()
          },
          fail: (res) => {

            wx.getBLEMTU({
              writeType: "writeNoResponse",
              deviceId: device.deviceId, success: res => {
                logv('调节MTU成功，' + JSON.stringify(res.mtu), this._tag);
                this._updateDeviceIdMtu(device.deviceId, res.mtu)
                this._onMTUChange(device, res.mtu)
                this._getBLEDeviceServices(device);
                // this._registerConnStatusListener()
              }, fail: res => {
                loge('调节MTU失败，' + JSON.stringify(res), this._tag);
                this.disconnect(device)
                const error: BluetoothError = {
                  errCode: BluetoothErrorConstant.ERROR_CONNECTION_FAIL,
                  errMsg: 'connection fail'
                }
                this._onConnectFailed(device, error)
              }
            })
          }
        })
      } else {
        // 延时，否则可能存在问题
        setTimeout(() => {
          wx.getBLEMTU({
            writeType: "writeNoResponse",// 写入不回复，删除ios无法通过
            deviceId: device.deviceId, success: res => {
              logv('调节MTU成功，' + JSON.stringify(res.mtu), this._tag);
              this._updateDeviceIdMtu(device.deviceId, res.mtu)
              this._onMTUChange(device, res.mtu)
              this._getBLEDeviceServices(device);
              // this._registerConnStatusListener()
            }, fail: res => {
              loge('调节MTU失败，' + JSON.stringify(res), this._tag);
              this.disconnect(device)
              const error: BluetoothError = {
                errCode: BluetoothErrorConstant.ERROR_CONNECTION_FAIL,
                errMsg: 'connection fail'
              }
              this._onConnectFailed(device, error)
            }
          })
        }, 1000);
      }
    }
    connectOption.fail = (e) => {
      loge('连接失败，' + e.errCode, this._tag);
      if (this.isConnecting(device)) {
        // loge('连接失败，已在 onBLEConnectionStateChange 处理，所以不做回调');
        return;
      } else {
        this._onConnectFailed(device, e)
      }
    }


    let vp_connected_verify = wx.getStorageSync("vp_connected_verify");

    // 后续新增
    if (vp_connected_verify) {
      wx.setStorageSync("vp_connected_verify", false);

      if (this._platform == 'android') {
        wx.setBLEMTU({//怀疑并发的时候会mtu混乱
          deviceId: device.deviceId,
          mtu: this._connectConfigure.mtu,

          success: res => {
            logv('调节MTU成功，' + res.mtu, this._tag);
            this._updateDeviceIdMtu(device.deviceId, res.mtu)
            this._onMTUChange(device, res.mtu)
            this._getBLEDeviceServices(device);
            // this._registerConnStatusListener()
          },
          fail: (res) => {

            wx.getBLEMTU({
              writeType: "writeNoResponse",
              deviceId: device.deviceId, success: res => {
                logv('调节MTU成功，' + JSON.stringify(res.mtu), this._tag);
                this._updateDeviceIdMtu(device.deviceId, res.mtu)
                this._onMTUChange(device, res.mtu)
                this._getBLEDeviceServices(device);
                // this._registerConnStatusListener()
              }, fail: res => {
                loge('调节MTU失败，' + JSON.stringify(res), this._tag);
                this.disconnect(device)
                const error: BluetoothError = {
                  errCode: BluetoothErrorConstant.ERROR_CONNECTION_FAIL,
                  errMsg: 'connection fail'
                }
                this._onConnectFailed(device, error)
              }
            })
          }
        })
      } else {

        setTimeout(() => {
          wx.getBLEMTU({
            writeType: "writeNoResponse",
            deviceId: device.deviceId, success: res => {
              logv('调节MTU成功，' + JSON.stringify(res.mtu), this._tag);
              this._updateDeviceIdMtu(device.deviceId, res.mtu)
              this._onMTUChange(device, res.mtu)
              this._getBLEDeviceServices(device);
              // this._registerConnStatusListener()
            }, fail: res => {
              loge('调节MTU失败，' + JSON.stringify(res), this._tag);
              this.disconnect(device)
              const error: BluetoothError = {
                errCode: BluetoothErrorConstant.ERROR_CONNECTION_FAIL,
                errMsg: 'connection fail'
              }
              this._onConnectFailed(device, error)
            }
          })
        }, 1000);

      }

    } else {
      console.log("========杰里开始重连=========");
      wx.setStorageSync("vp_connected_verify", true);

      wx.createBLEConnection(connectOption)
    }
    // wx.createBLEConnection(connectOption)
    return result
  }
  /** 断开已连接设备 */
  public disconnect(device: BluetoothDevice): void {
    // if (this.isConnectedOrConnecting() && this.currentDeviceId != null) {
    wx.closeBLEConnection({
      deviceId: device.deviceId,
    })
    // }
  }
  /** 获取已连接设备列表*/
  public getConnectedDeviceIds(): Array<BluetoothDevice> | null {
    return this._connectingDeviceIdArray
  }
  /** 获取设备MTU*/
  public getMTU(device: BluetoothDevice): number | undefined {
    if (this.isConnected(device)) {
      return this._mtuMap.get(device.deviceId)
    }
    return undefined
  }
  /** 是否正在连接*/
  public isConnecting(device: BluetoothDevice): boolean {
    var position = -1
    for (let index = 0; index < this._connectingDeviceIdArray.length; index++) {
      const element = this._connectingDeviceIdArray[index];
      if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
        position = index
        break
      }
    }
    logv("isConnecting : " + (position != -1), this._tag);
    return position != -1
  }
  /** 是否已连接*/
  public isConnected(device: BluetoothDevice): boolean {
    var position = -1
    for (let index = 0; index < this._connectedDeviceIdArray.length; index++) {
      const element = this._connectedDeviceIdArray[index];
      if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
        position = index
        break
      }
    }
    logv("isConnected : " + (position != -1), this._tag);
    return position != -1
  }
  private _registerConnStatusListener() {
    // logv("注册连接状态回调");
    let that = this;
    let resFun = (res: WechatMiniprogram.OnBLEConnectionStateChangeListenerResult) => {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      logv("蓝牙连接状态变化" + JSON.stringify(res));
      if (res.connected) {
        // that.status = 2;
        // that._getBLEDeviceServices();
      } else {
        const deviceIdLowerCase = res.deviceId.toLowerCase()
        let position = -1
        for (let index = 0; index < this._connectedDeviceIdArray.length; index++) {
          const element = this._connectedDeviceIdArray[index];
          if (element.deviceId.toLowerCase() === deviceIdLowerCase) {
            position = index
            break
          }
        }
        const deviceId = res.deviceId
        if (position != -1) {
          const device = this._connectedDeviceIdArray[position]
          that._onConnectDisconnect(device)
        } else {
          let position = -1
          for (let index = 0; index < this._connectingDeviceIdArray.length; index++) {
            const element = this._connectingDeviceIdArray[index];
            if (element.deviceId.toLowerCase() === deviceIdLowerCase) {
              position = index
              break
            }
          }
          if (position != -1) {
            const device = this._connectingDeviceIdArray[position]
            const error: BluetoothError = {
              errCode: BluetoothErrorConstant.ERROR_CONNECTION_FAIL,
              errMsg: "connection fail"
            }
            that._onConnectFailed(device, error)
          }

        }
      }
    }
    wx.onBLEConnectionStateChange(resFun);
  }
  /**
   * 获取所有服务
   */
  private _getBLEDeviceServices(device: BluetoothDevice) {
    logv('获取所有服务的 uuid:' + device.deviceId, this._tag);
    wx.getBLEDeviceServices({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: device.deviceId,
      success: res => {
        // logv('获取设备服务成功:' + JSON.stringify(res.services));
        var list = res.services;
        if (list.length <= 0) {
          const error: BluetoothError = {
            errCode: BluetoothErrorConstant.ERROR_NO_SERVICE,
            errMsg: "no service"
          }
          this._onConnectFailed(device, error)
          return;
        }
        let notifyServiceNum = 0;
        let notifySuccessServiceNum = 0;
        list.forEach((s) => {
          logv('设备服务:' + s.uuid.toLowerCase(), this._tag);
          const idx = inArray(this._connectConfigure.notifyServiceArray, "serviceUUID", s.uuid.toLowerCase())
          if (idx != -1) {
            const bluetoothService = this._connectConfigure.notifyServiceArray[idx]
            notifyServiceNum++;
            this._getBLEDeviceCharacteristics(device, s.uuid, bluetoothService.notifyCharacteristicsUUID, {
              notifySuccess: () => {
                notifySuccessServiceNum++;
                if (notifySuccessServiceNum == notifyServiceNum) {
                  this._onConnectSuccess(device)
                }
              }, notifyFail: () => {
                const error: BluetoothError = {
                  errCode: BluetoothErrorConstant.ERROR_NO_CHARACTERISTIC,
                  errMsg: "no charateristic"
                }
                this._onConnectFailed(device, error)
              }
            });
          }
        })
      },
      fail: e => {
        loge('获取设备服务失败，错误码：' + e.errCode, this._tag);
        this._onConnectFailed(device, e)
      }
    });
  }
  /**
   * 获取某个服务下的所有特征值
   */
  private _getBLEDeviceCharacteristics(device: BluetoothDevice, serviceId: string, characteristics: Array<string>, callback: { notifySuccess: () => void, notifyFail: () => void }) {
    logv("获取某个服务下的所有特征值" + "\tdeviceId=" + device.deviceId + "\tserviceId=" + serviceId, this._tag);
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: device.deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId,
      success: res => {
        let list = res.characteristics;
        logv("getBLEDeviceCharacteristics" + "\tlist=" + JSON.stringify(list), this._tag);
        // if (list.length <= 0) {
        // 	this._connectFailed(deviceId)
        // 	return;
        // }
        // let hasNotifyUUID = false;
        let notifyCharacteristicNum = 0;
        let notifySuccessCharacteristicNum = 0;
        list.forEach((c) => {
          // if (c.uuid.toLowerCase() == UUID_NOTIFY || c.uuid.toLowerCase() == UUID_NOTIFY_LH.toLowerCase()) {
          // 	this._notifyBLECharacteristicValueChange({
          // 		deviceId: deviceId,
          // 		serviceId: serviceId,
          // 		characteristicId: c.uuid,
          // 	}, callback)
          // 	hasNotifyUUID = true;
          // }
          for (let index = 0; index < characteristics.length; index++) {
            const charateristic = characteristics[index];
            if (charateristic === c.uuid.toLowerCase()) {
              notifyCharacteristicNum++
              this._notifyBLECharacteristicValueChange({
                deviceId: device.deviceId,
                serviceId: serviceId,
                characteristicId: c.uuid,
              }, {
                notifySuccess: () => {
                  notifySuccessCharacteristicNum++;
                  if (notifySuccessCharacteristicNum == notifyCharacteristicNum) {
                    // this._onConnectSuccess(deviceId)
                    callback.notifySuccess()
                  }
                }, notifyFail: () => {
                  callback.notifySuccess()
                }
              })
            }
          }
        })
        // if (!hasNotifyUUID) {
        // 	loge('未能找到Notify特征值！');
        // 	this._connectFailed(deviceId);
        // }
      },
      fail: e => {
        loge('获取特征值失败，错误码：' + e.errCode, this._tag);
        this._onConnectFailed(device, e)
      }
    });
  }
  /**
  * 订阅操作成功后需要设备主动更新特征值的 value，才会触发 wx.onBLECharacteristicValueChange 回调。
  */
  private _notifyBLECharacteristicValueChange(obj: {
    deviceId: string,
    serviceId: string,
    characteristicId: string
  }, callback: { notifySuccess: () => void, notifyFail: () => void }) {
    const that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: obj.deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId: obj.serviceId,
      // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
      characteristicId: obj.characteristicId,
      success: (res) => {
        logv('使能通知成功：' + JSON.stringify(res) + " characteristicId : " + obj.characteristicId, this._tag);
        // this._connectSuccsed()
        //两个服务都使能了
        // if (true) {
        //   if (that.isAuth) {
        //     that._startAuth(obj.deviceId)
        //   } else {
        //     this._connectSuccsed()
        //   }
        // }
        callback.notifySuccess()
      },
      fail: (err) => {
        loge('使能通知失败' + JSON.stringify(err));
        // this._connectFailed()
        callback.notifyFail()
      }
    });
  }


  private _addConnectingDeviceId(device: BluetoothDevice) {
    this._connectingDeviceIdArray.push(device)
  }
  private _deleteConnectingDeviceId(device: BluetoothDevice) {
    var position = -1
    for (let index = 0; index < this._connectingDeviceIdArray.length; index++) {
      const element = this._connectingDeviceIdArray[index];
      if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
        position = index
        break
      }
    }
    if (position != -1) {
      this._connectingDeviceIdArray.splice(position, 1);
    }
  }
  private _addConnectedDeviceId(device: BluetoothDevice) {
    this._connectedDeviceIdArray.push(device)
  }
  private _deleteConnectedDeviceId(device: BluetoothDevice) {
    var position = -1
    for (let index = 0; index < this._connectedDeviceIdArray.length; index++) {
      const element = this._connectedDeviceIdArray[index];
      if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
        position = index
        break
      }
    }
    if (position != -1) {
      this._connectedDeviceIdArray.splice(position, 1);
    }
  }
  private _updateDeviceIdMtu(deviceId: string, mtu: number) {
    this._mtuMap.set(deviceId, mtu)
  }
  private _deleteDeviceIdMtu(deviceId: string) {
    this._mtuMap.delete(deviceId)
  }
  private _onBluetoothAdapterAvailable(available: boolean) {
    this._callbacks.forEach(c => {
      if (c.onBluetoothAdapterAvailable) {
        c.onBluetoothAdapterAvailable(available);
      }
    });
  }
  private _onMTUChange(device: BluetoothDevice, mtu: number) {
    const callback = this._connectCallbacks.get(device.deviceId)
    if (callback) {
      callback.onMTUChange?.(device, mtu)
    }
    this._callbacks.forEach(c => {
      if (c.onMTUChange) {
        c.onMTUChange(device, mtu);
      }
    });
  }
  private _onConnectSuccess(device: BluetoothDevice) {
    logv("_onConnectSuccess : " + device.deviceId, this._tag)
    this._deleteConnectingDeviceId(device)
    this._addConnectedDeviceId(device)
    const callback = this._connectCallbacks.get(device.deviceId)
    if (callback) {
      callback.onConnectSuccess?.(device)
      this._connectCallbacks.delete(device.deviceId)
    }
    this._callbacks.forEach(c => {
      if (c.onConnectSuccess) {
        c.onConnectSuccess(device);
      }
    });
  }
  private _onConnectFailed(device: BluetoothDevice, error: BluetoothError) {
    this._deleteConnectingDeviceId(device)
    const callback = this._connectCallbacks.get(device.deviceId)
    if (callback) {
      callback.onConnectFailed?.(device, error)
      this._connectCallbacks.delete(device.deviceId)
    }
    this._callbacks.forEach(c => {
      if (c.onConnectFailed) {
        c.onConnectFailed(device, error);
      }
    });
  }
  private _onConnectDisconnect(device: BluetoothDevice) {
    this._deleteConnectedDeviceId(device)
    this._deleteDeviceIdMtu(device.deviceId)
    this._callbacks.forEach(c => {
      if (c.onConnectDisconnect) {
        c.onConnectDisconnect(device);
      }
    });
  }
}
export class ConnectSettingConfigure {
  /**连接超时*/
  timeout?: number
  /**mtu 23~512*/
  mtu: number = 512
  /**使能的service*/
  notifyServiceArray: Array<BluetoothService> = new Array()
}
export class BluetoothService {
  /**小写*/
  serviceUUID: string = ""
  /**小写*/
  notifyCharacteristicsUUID: Array<string> = new Array()
}
export class ConnectImplCallback {
  /**适配器发生变化*/
  onBluetoothAdapterAvailable?: (available: boolean) => void
  /** MTU改变*/
  onMTUChange?: (device: BluetoothDevice, mtu: number) => void
  /** 连接成功*/
  onConnectSuccess?: (device: BluetoothDevice) => void
  /** 连接失败*/
  onConnectFailed?: (device: BluetoothDevice, error: BluetoothError) => void
  /** 连接断开*/
  onConnectDisconnect?: (device: BluetoothDevice) => void
}
export class ConnectCallback {
  /** MTU改变*/
  onMTUChange?: (device: BluetoothDevice, mtu: number) => void
  /** 连接成功*/
  onConnectSuccess?: (device: BluetoothDevice) => void
  /** 连接失败*/
  onConnectFailed?: (device: BluetoothDevice, error: BluetoothError) => void
}
export function convertWechatDeviceToBluetoothDevice(device: WechatMiniprogram.BlueToothDevice): BluetoothDevice {
  const result = new BluetoothDevice()
  result.RSSI = device.RSSI
  result.advertisData = device.advertisData
  result.advertisServiceUUIDs = device.advertisServiceUUIDs
  result.connectable = device.connectable
  result.deviceId = device.deviceId
  result.localName = device.localName
  result.name = device.name
  result.serviceData = device.serviceData
  return result
}
function inArray(arr: any, key: any, val: any) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}
function hexToArrayBuffer(hex: any) {
  let typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h: any) {
    return parseInt(h, 16)
  }))
  let buffer = typedArray.buffer
  return buffer;
}