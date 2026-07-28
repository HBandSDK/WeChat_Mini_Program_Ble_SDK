//缓存设备历史记录，设备回连处理

import { BluetoothDevice, ScanDevice, BleScanMessage } from "../rcsp-protocol/rcsp-util";
import { Reconnect, ReconnectOp, ReconnectCallback } from "../reconnect";
import { ParseDataUtil } from "../rcsp-protocol/rcsp-util";
import { ab2hex, logi } from "../../utils/log";
import { RCSPManager, RCSPWrapperBluetooth } from "./rcsp";
import * as RCSPProtocol from "../../jl_lib/jl-rcsp/jl_rcsp_watch_1.1.0";
// import { UIHelper } from "../product/product-cache-manager";
import { OPHeadSet } from "../../jl_lib/jl-rcsp-op/jl_op_watch_1.1.0";

export namespace DeviceBluetooth {
  export class BluetoothOption {

    /*=======================================================================*
 * 通用配置
 *=======================================================================*/

    /**
     * 是否允许自动重连
     * 说明:异常断开重连机制
     */
    reconnect: boolean = false
    /**
     * 命令超时时间
     */
    timeoutMs = 2000

    /**
     * 是否进入低功耗模式
     * 说明: 1. app端主动设置是否进入低功耗模式
     * 2. 如果为低功耗模式，则不连接经典蓝牙
     */
    enterLowPowerMode = false;
    /**
     * 是否使用多设备管理
     */
    isUseMultiDevice = false;

    /**
     * 是否使用设备认证
     */
    isUseDeviceAuth = true;

    /*=======================================================================*
     * BLE相关配置
     *=======================================================================*/
    /**
     * BLE过滤规则的过滤标识
     */
    scanFilterData?: string;  // 搜索过滤数据
    /**
     * OTA过滤规则的过滤标识
     */
    otaScanFilterData: string = "JLOTA";  // OTA搜索过滤数据
    /**
     * BLE扫描策略
     * 说明: 决定设备过滤规则
     * 可选参数:{@link 0}  --- 不使用过滤规则
     * {@link 1} --- 使用全部过滤规则
     * {@link 2} --- 仅使用标识过滤规则
     * {@link 3} --- 仅使用hash加密过滤规则
     */
    bleScanStrategy: 0 | 1 | 2 | 3 = 1; //BLE过滤规则
    /**
     * 是否使用BLE配对方式
     */
    isUseBleBondWay = false;
    /**
     * 是否自动连接BLE
     */
    isAutoConnectBle = false;
    /**
     * 是否需要改变BLE的MTU
     */
    isNeedChangeBleMtu = false;
  }
  export class DeviceBluetoothEvent {
    public type: 'onAdapterStatus' | 'onDiscoveryStatus' | 'onDiscovery' | 'onShowDialog' | 'onBleDataBlockChanged' | 'onConnection' | 'onHistoryRecordChange' | 'onError' | undefined
    /** 蓝牙适配器状态回调
    * @param bEnabled 蓝牙是否打开
    */
    public onAdapterStatusEvent?: { bEnabled: boolean }
    /**
     * 发现设备状态回调
     * @param bStart 是否搜索开始
     */
    public onDiscoveryStatusEvent?: { bStart: boolean }
    /**
     * 发现设备回调
     * @param device         蓝牙设备
     * @param bleScanMessage 广播信息
     */
    public onDiscoveryEvent?: { device: BluetoothDevice, bleScanMessage: BleScanMessage }
    /**
     * 产品弹窗回调
     *
     * @param device         蓝牙设备
     * @param bleScanMessage 广播信息
     */
    public onShowDialogEvent?: { device: BluetoothDevice, bleScanMessage: BleScanMessage }
    /**
     * BLE数据缓冲区送数据设置回调
     * 参数：
     * device: BLE设备
     * block 缓冲区大小
     * state： 0 - 成功, 其他失败
     */
    public onBleDataBlockChangedEvent?: { device: BluetoothDevice, block: number, status: number }
    /**
     * 蓝牙连接状态回调
     *
     * @param device 蓝牙设备
     * @param status 连接状态
     *               {0:已断开}
     *               {1：连接中}
     *               {2：已连接}
     *               {3：连接失败}
     */
    public onConnectionEvent?: { device: BluetoothDevice, status: number }
    /**
     * 错误事件回调
     *
     * @param error 错误事件
     */
    public onErrorEvent?: { errorCode: number, errMsg: string }
  }
}

namespace DeviceBluetoothInner {
  export class DeviceManager {
    reconnectImpl = new DevReconnect.ReconnectImpl()
    historyRecordManager = new HistoryDevInner.HistoryRecordManager()
    private _eventCallback: Array<(res: DeviceBluetooth.DeviceBluetoothEvent) => void> = new Array()
    private _bluetoothOption: DeviceBluetooth.BluetoothOption = new DeviceBluetooth.BluetoothOption()
    private _AdvertisePacketManager?: HistoryDevInner.AdvertisePacketManager
    private _IScan?: RCSPWrapperBluetooth.IBleScan
    private _IConnect?: RCSPWrapperBluetooth.IBleConnect
    private _ScanDeviceCacheMap = new Map<string, ScanDevice>()
    private _connectedDevices = new Array<BluetoothDevice>()
    private _connectingDevices = new Array<BluetoothDevice>()
    private _bluetoothDeviceMap = new Map<string, BluetoothDevice>()
    private _showPopDialogBlackMap = new Map<string, number>()
    private _IsInit = false
    private _isBluetoothAdapterAvailable = true
    private _ScanCallback: RCSPWrapperBluetooth.IBleScanCallback = {
      onBluetoothAdapterAvailable: (available: boolean) => {
        this._isBluetoothAdapterAvailable = available
        this._onAdapterStatusEvent(available)
      },
      onScanStart: () => {
        this._onScanStatusChange(true)
      },
      onScanFailed: (error: { errorCode: number, msg?: string }) => {
        this._onScanStatusChange(false)
        this._onError(error.errorCode, error.msg!)
      },
      onScanFinish: () => {
        this._onScanStatusChange(false)
      },
      onFound: (devs: ScanDevice[]) => {
        devs.forEach(device => {
          this._onDiscoveryScanDevice(device)
        });
      }
    }
    private _ConnectImplCallback: RCSPWrapperBluetooth.IBleConnectCallback = {
      /** MTU改变*/
      onMTUChange: (device: BluetoothDevice, mtu: number) => {
        //todo 要判断是不是操作的设备


        if (this.isConnected(device) || this.isConnecting(device)) {
          const event = new DeviceBluetooth.DeviceBluetoothEvent()
          event.type = "onBleDataBlockChanged"
          event.onBleDataBlockChangedEvent = { device, block: mtu, status: 0 }
          this._notifyEvent(event)
        }
      },
      /** 连接成功*/
      onConnectSuccess: (device: BluetoothDevice) => {
        //todo 要判断是不是操作的设备
        if (this.isConnecting(device)) {
          this._deleteConnectingDevice(device)
          this._addConnectedDevice(device)
          const tempScanDevice = this._ScanDeviceCacheMap.get(device.deviceId)  // 缓存广播包
          if (tempScanDevice) {
            this._AdvertisePacketManager?.saveCacheAdvertisePacket(tempScanDevice)
          }
          this.reconnectImpl?.onDeviceConnected(device)
          this._onConnectStatusChange(device, 2)
        }
      },
      /** 连接失败*/
      onConnectFailed: (device: BluetoothDevice, error: { errorCode: number, msg?: string }) => {
        //todo 要判断是不是操作的设备
        if (this.isConnected(device) || this.isConnecting(device)) {
          this._deleteConnectingDevice(device)
          this._onConnectStatusChange(device, 3)
        }
      },
      /** 连接断开*/
      onConnectDisconnect: (device: BluetoothDevice) => {
        //todo 要判断是不是操作的设备
        if (this.isConnected(device) || this.isConnecting(device)) {
          this._deleteConnectedDevice(device)
          this._onConnectStatusChange(device, 0)
        }
      }
    }
    private reconnectOp: DevReconnect.DeviceReconnectOp = {
      startScan: () => {
        if (this._IScan?.isBluetoothAdapterAvailable() == true) {
          this._IScan?.startScan()
        }
      },
      isHistoryDevMac: (mac: string) => {
        let result = this.historyRecordManager?.isHistoryDevice(mac)
        if (result == undefined) {
          result = false
        }
        return result
      },
      startBluetoothConnect: (device: BluetoothDevice, isOTADevice: boolean, isNow: boolean) => {
        this.connecDevice(device)
      }
    }

    init(config: { bluetoothOption?: DeviceBluetooth.BluetoothOption, iScan: RCSPWrapperBluetooth.IBleScan, iConnect: RCSPWrapperBluetooth.IBleConnect }) {
      if (config.bluetoothOption) {
        this._bluetoothOption = config.bluetoothOption
      }
      this._IsInit = true
      this._IScan = config.iScan
      this._IConnect = config.iConnect
      this._AdvertisePacketManager = new HistoryDevInner.AdvertisePacketManager()
      this.reconnectImpl.init(this.reconnectOp, this._bluetoothOption)
      this._init()
      return this
    }
    private _init() {
      this._IScan?.addCallback(this._ScanCallback)
      this._IConnect?.addCallback(this._ConnectImplCallback)
    }
    getBluetoothOption() {
      return this._bluetoothOption
    }
    release() {
      this._IsInit = false
      this._IScan?.removeCallback(this._ScanCallback)
      this._IConnect?.removeCallback(this._ConnectImplCallback)
    }
    observe(onEvent: (res: DeviceBluetooth.DeviceBluetoothEvent) => void) {
      if (!this._eventCallback.includes(onEvent)) {
        this._eventCallback.push(onEvent)
      }
      return this
    }
    removeObserve(onEvent: (res: DeviceBluetooth.DeviceBluetoothEvent) => void) {
      const index = this._eventCallback.indexOf(onEvent)
      if (index != -1) {
        this._eventCallback.splice(index, 1)
      }
      return this
    }
    /**
     * 开始扫描
     */
    starScan() {
      return this._IScan?.startScan()
    }
    isScanning() {
      return this._IScan?.isScanning()
    }
    /**
  * 刷新扫描
  */
    refreshScan() {
      return this._IScan?.refreshScan()
    }
    /**
     * 停止扫描
     */
    stopScan() {
      return this._IScan?.stopScan()
    }
    /**
     * 连接设备
     */
    connecDevice(device: BluetoothDevice) {
      if (this.isConnected(device) || this.isConnecting(device)) return
      this._addConnectingDevice(device)
      this._IConnect?.connectDevice(device)
    }
    /**
     * 断开设备
     */
    disconnectDevice(device: BluetoothDevice) {
      this._IConnect?.disconnect(device)
    }
    /** 是否正在连接*/
    isConnecting(device: BluetoothDevice): boolean {
      return this._isConnecting(device) != -1
    }
    /** 是否已连接*/
    isConnected(device: BluetoothDevice): boolean {
      return this._isConnected(device) != -1
    }
    getBluetoothDeviceByMac(mac: string): BluetoothDevice | undefined {
      return this._bluetoothDeviceMap.get(mac)
    }
    /** 是否已连接*/
    private _isConnected(device: BluetoothDevice): number {
      var position = -1
      for (let index = 0; index < this._connectedDevices.length; index++) {
        const element = this._connectedDevices[index];
        if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
          position = index
          break
        }
      }
      return position
    }
    /** 是否正在连接*/
    private _isConnecting(device: BluetoothDevice): number {
      var position = -1
      for (let index = 0; index < this._connectingDevices.length; index++) {
        const element = this._connectingDevices[index];
        if (element.deviceId.toLowerCase() === device.deviceId.toLowerCase()) {
          position = index
          break
        }
      }
      return position
    }
    private _addConnectingDevice(device: BluetoothDevice) {
      if (!this.isConnecting(device)) {
        this._connectingDevices.push(device)
      }
    }
    private _deleteConnectingDevice(device: BluetoothDevice) {
      var position = this._isConnecting(device)
      if (position != -1) {
        this._connectingDevices.splice(position, 1);
      }
    }
    private _addConnectedDevice(device: BluetoothDevice) {
      if (!this.isConnected(device)) {
        this._connectedDevices.push(device)
      }
    }
    private _deleteConnectedDevice(device: BluetoothDevice) {
      var position = this._isConnected(device)
      if (position != -1) {
        this._connectedDevices.splice(position, 1);
      }
    }
    private _onError(errorCode: number, msg: string) {
      const event1 = new DeviceBluetooth.DeviceBluetoothEvent()
      event1.type = "onError"
      event1.onErrorEvent = { errorCode, errMsg: msg }
      this._notifyEvent(event1)
    }
    private _onAdapterStatusEvent(enable: boolean) {
      const event = new DeviceBluetooth.DeviceBluetoothEvent()
      event.type = "onAdapterStatus"
      event.onAdapterStatusEvent = { bEnabled: enable }
      this._notifyEvent(event)
    }
    private _onScanStatusChange(isScan: boolean) {
      if (isScan) {
        this._ScanDeviceCacheMap.clear()
      } else {
        this.reconnectImpl.onScanStop()
      }
      const event = new DeviceBluetooth.DeviceBluetoothEvent()
      event.type = "onDiscoveryStatus"
      event.onDiscoveryStatusEvent = { bStart: isScan }
      this._notifyEvent(event)
    }
    /**
     * 
     * @param device 蓝牙设备
     * @param status 连接状态
     *               {0:已断开}
     *               {1：连接中}
     *               {2：已连接}
     *               {3：连接失败}
     */
    private _onConnectStatusChange(device: BluetoothDevice, status: number) {
      const event = new DeviceBluetooth.DeviceBluetoothEvent()
      event.type = "onConnection"
      event.onConnectionEvent = { device, status }
      this._notifyEvent(event)
    }
    //新的设备发现接口
    private _onDiscoveryScanDevice(device: ScanDevice) {
      if (!this._IsInit) return
      this._AdvertisePacketManager?.onDiscoveryScanDevice(device)
      let bleScanMassage: BleScanMessage | undefined
      let tempScanDevice: ScanDevice = device
      if (device.isSystem) {//系统已连接设备，需要读取缓存
        const cache = this._AdvertisePacketManager?.getCacheAdvertisePacket(device.deviceId)
        if (cache) {
          tempScanDevice = cache
        }
      }
      if (this._bluetoothOption && tempScanDevice) {
        bleScanMassage = ParseDataUtil.parseBluetoothDeviceFound(this._bluetoothOption, tempScanDevice.device)
      }
      if (bleScanMassage) {
        this._ScanDeviceCacheMap.set(device.deviceId, device)
        this._bluetoothDeviceMap.set(device.deviceId, tempScanDevice.device)
        this.reconnectImpl?.onDiscoveryDevice(tempScanDevice.device)
        const event = new DeviceBluetooth.DeviceBluetoothEvent()
        event.type = "onDiscovery"
        event.onDiscoveryEvent = { device: tempScanDevice.device, bleScanMessage: bleScanMassage }
        this._notifyEvent(event)
        //只会弹窗一次
        const cacheSeq = this._showPopDialogBlackMap.get(device.deviceId)
        if (cacheSeq != bleScanMassage.seq) {
          this._showPopDialogBlackMap.set(device.deviceId, bleScanMassage.seq)
          const event1 = new DeviceBluetooth.DeviceBluetoothEvent()
          event1.type = "onShowDialog"
          event1.onShowDialogEvent = { device: tempScanDevice.device, bleScanMessage: bleScanMassage }
          this._notifyEvent(event1)
        }
      }
    }
    private _notifyEvent(event: DeviceBluetooth.DeviceBluetoothEvent) {
      this._eventCallback.forEach(element => {
        element(event)
      });
    }
  }
}


export namespace HistoryDev {
  export class HistoryRecord {
    //设备信息
    name?: string; //蓝牙设备名称
    address = "11:22:33:44:55:66"; //蓝牙地址(不一定是经典蓝牙地址)
    mappedAddress?: string; //蓝牙映射地址
    devType: number = 0; //设备类型（BLE，EDR）
    connectType: number = 0; //连接方式
    sdkFlag = 0; //SDK标识
    //产品信息
    vid = 0; //厂商ID
    uid = 0; //客户ID
    pid = 0; //产品ID
    //经纬度信息
    //left device gps(默认是左侧设备，也默认左侧设备是主机)
    // leftDevLatitude = 0; //纬度
    // leftDevLongitude = 0; //经度
    // leftDevUpdateTime = 0; //更新时间
    // //right device gps
    // rightDevLatitude = 0;
    // rightDevLongitude = 0;
    // rightDevUpdateTime = 0;
    //额外信息
    isSupportSearchDevice = false;//支持查找设备
    onlineTime = 0; //上线时间
    updateAddress?: string;    //更新变化地址
  }
  export class HistoryDevEvent {
    type: 'onHistoryRecordChange' | 'onHistoryRecordClear' | undefined
    /**
    * 历史记录发生变化
    * @param op 0:  添加操作,1:  删除操作,2:  修改操作
   */
    onHistoryRecordChangeEvent?: { op: number, record: HistoryDev.HistoryRecord | undefined }
  }
}
//设备历史记录-不包含连接状态，和设备信息，广播信息
namespace HistoryDevInner {
  /************************************************************ 广播包缓存 ***********************************************************/
  export class AdvertisePacketManager {
    private _cacheArray = new Array<ScanDevice>()
    constructor() {
      this._cacheArray = Cache.getCacheAdvertisePacketArray()
    }
    /**
     *发现设备
     */
    public onDiscoveryScanDevice(device: ScanDevice) {
      //  广播包有更新
      if (device.isSystem) {//系统连接没有广播包
        return
      }
      const deviceId: string = device.deviceId
      const cachePacket = this.getCacheAdvertisePacket(deviceId)
      if (cachePacket) {//有缓存
        cachePacket.device = device.device
        cachePacket.deviceId = device.deviceId
        cachePacket.isSystem = device.isSystem
        Cache.setCacheAdvertisePacketArray(this._cacheArray)
      }
    }
    /**
     * 获取缓存的广播包
     */
    public getCacheAdvertisePacket(deviceId: string) {
      let result = undefined
      for (let index = 0; index < this._cacheArray.length; index++) {
        const element = this._cacheArray[index];
        if (element.deviceId === deviceId) {
          result = element
          break
        }
      }
      return result
    }
    /**
     * 保存广播包
     */
    public saveCacheAdvertisePacket(scanDevice: ScanDevice) {
      const deviceId: string = scanDevice.deviceId
      const cachePacket = this.getCacheAdvertisePacket(deviceId)
      if (cachePacket) {//有缓存
        cachePacket.device = scanDevice.device
        cachePacket.deviceId = scanDevice.deviceId
        cachePacket.isSystem = scanDevice.isSystem
      } else {//无缓存
        if (this._cacheArray.length > 9) {//缓存超出最大值：10                
          this._cacheArray.splice(0, this._cacheArray.length - 9)
        }
        this._cacheArray.push(scanDevice)
      }
      Cache.setCacheAdvertisePacketArray(this._cacheArray)
    }
  }

  export class HistoryRecordManager {
    private _eventCallback: Array<(res: HistoryDev.HistoryDevEvent) => void> = new Array()

    private _historyRecordArray: Array<HistoryDev.HistoryRecord> | undefined = new Array<HistoryDev.HistoryRecord>()
    constructor() {
      // 从缓存中读取记录
      this._historyRecordArray = Cache.getCacheHistoryDeviceList()
    }
    public release() {
      if (this._historyRecordArray) {
        this._historyRecordArray.length = 0
        this._historyRecordArray = undefined
      }
      this._eventCallback = new Array()
    }
    observe(onEvent: (res: HistoryDev.HistoryDevEvent) => void) {
      if (!this._eventCallback.includes(onEvent)) {
        this._eventCallback.push(onEvent)
      }
      return this
    }
    removeObserve(onEvent: (res: HistoryDev.HistoryDevEvent) => void) {
      const index = this._eventCallback.indexOf(onEvent)
      if (index != -1) {
        this._eventCallback.splice(index, 1)
      }
      return this
    }
    /**
     * 获取指定的连接历史记录
     * @param mac 蓝牙地址(可以是ble地址，edr地址，ota变地址)
     */
    public getHistoryRecordByMac(mac: string) {
      let result: HistoryDev.HistoryRecord | undefined = undefined
      if (this._historyRecordArray) {
        for (let index = 0; index < this._historyRecordArray.length; index++) {
          const element = this._historyRecordArray[index];
          const macLowerCase = mac.toLowerCase()
          if (element.address.toLowerCase() === macLowerCase || (element.mappedAddress?.toLowerCase() === macLowerCase || element.updateAddress?.toLowerCase() === macLowerCase)) {
            //只要有一个地址对应就认为是该设备
            result = element
            break
          }
        }
      }
      return result
    }
    /**
     * 获取连接历史记录
     */
    public getHistoryRecordList() {
      return JSON.parse(JSON.stringify(this._historyRecordArray))
    }
    /**
     * 删除连接历史
     *
     * @param historyRecord 连接历史
     */
    public deleteHistoryRecord(historyRecord: HistoryDev.HistoryRecord) {
      if (this._historyRecordArray) {
        let position = -1//this._historyRecordArray.indexOf(historyRecord)
        for (let index = 0; index < this._historyRecordArray.length; index++) {
          const element = this._historyRecordArray[index];
          const macLowerCase = historyRecord.address.toLowerCase()
          if (element.address.toLowerCase() === macLowerCase || (element.mappedAddress?.toLowerCase() === macLowerCase || element.updateAddress?.toLowerCase() === macLowerCase)) {
            //只要有一个地址对应就认为是该设备
            position = index
            break
          }
        }
        if (position > -1) {
          this._historyRecordArray.splice(position, 1)
          this._saveHistoryRecordList(this._historyRecordArray)
          this._onHistoryRecordChangeHandle(1, historyRecord)
        }
      }
    }

    /**
     * 删除连接历史记录
     *
     * @param historyRecords 连接历史列表
     */
    public clearHistoryRecords(historyRecords: Array<HistoryDev.HistoryRecord>) {
      this._historyRecordArray = new Array<HistoryDev.HistoryRecord>()
      this._saveHistoryRecordList(this._historyRecordArray)
      const event = new HistoryDev.HistoryDevEvent()
      event.type = "onHistoryRecordClear"
      this._notifyEvent(event)
    }
    /**
     * 保存历史记录
     *
     * @param historyRecord 历史记录
     */
    public saveHistoryRecord(historyRecord: HistoryDev.HistoryRecord) {
      return this.updateHistoryRecord(historyRecord)
    }
    /**
     * 更新历史记录
     *
     * @param historyRecord 历史记录
     */
    public updateHistoryRecord(historyRecord: HistoryDev.HistoryRecord) {
      if (this._historyRecordArray) {
        const mac = historyRecord.address
        let cacheIndex = -1
        for (let index = 0; index < this._historyRecordArray.length; index++) {
          const element = this._historyRecordArray[index];
          const macLowerCase = mac.toLowerCase()
          if (element.address.toLowerCase() === macLowerCase || (element.mappedAddress?.toLowerCase() === macLowerCase || element.updateAddress?.toLowerCase() === macLowerCase)) {
            //只要有一个地址对应就认为是该设备
            cacheIndex = index
            break
          }
        }
        const isAdded = cacheIndex != -1
        if (isAdded) {
          this._historyRecordArray.splice(cacheIndex, 1)
        }
        this._historyRecordArray.push(historyRecord)
        this._saveHistoryRecordList(this._historyRecordArray)
        if (isAdded) {
          this._onHistoryRecordChangeHandle(2, historyRecord)
        } else {
          this._onHistoryRecordChangeHandle(0, historyRecord)
        }
        return true
      } else {
        return false
      }
    }
    public isHistoryDevice(mac: string) {
      let result = false
      if (this._historyRecordArray) {
        let cacheIndex = -1
        for (let index = 0; index < this._historyRecordArray.length; index++) {
          const element = this._historyRecordArray[index];
          const macLowerCase = mac.toLowerCase()
          if (element.address.toLowerCase() === macLowerCase || (element.mappedAddress?.toLowerCase() === macLowerCase || element.updateAddress?.toLowerCase() === macLowerCase)) {
            //只要有一个地址对应就认为是该设备
            cacheIndex = index
            break
          }
        }
        result = cacheIndex != -1
      }
      return result
    }
    private _saveHistoryRecordList(historyRecords: Array<HistoryDev.HistoryRecord>) {
      Cache.setCacheHistoryDeviceList(historyRecords)
    }
    private _onHistoryRecordChangeHandle(op: number, record: HistoryDev.HistoryRecord) {
      const event = new HistoryDev.HistoryDevEvent()
      event.type = 'onHistoryRecordChange'
      event.onHistoryRecordChangeEvent = { op, record }
      this._notifyEvent(event)
    }
    private _notifyEvent(event: HistoryDev.HistoryDevEvent) {
      this._eventCallback.forEach(element => {
        element(event)
      });
    }
  }
}

namespace Cache {
  var openId = "test"
  //iOS要缓存广播包内容和deviceId的map,如果是系统已连接的就不要再存进来
  export function setCacheAdvertisePacketArray(array: Array<ScanDevice>) {
    wx.setStorageSync('AdvertisePacketArray_' + openId, array);
  }
  export function getCacheAdvertisePacketArray(): Array<ScanDevice> {
    const str = wx.getStorageSync('AdvertisePacketArray_' + openId);
    let result: Array<ScanDevice>
    if (str == "") {
      result = new Array<ScanDevice>()
    } else {
      result = str
    }
    return result
  }

  //历史记录缓存
  export function setCacheHistoryDeviceList(list: Array<HistoryDev.HistoryRecord>) {
    wx.setStorageSync('HistoryDeviceList_' + openId, list);
  }
  export function getCacheHistoryDeviceList(): Array<HistoryDev.HistoryRecord> {
    const str = wx.getStorageSync('HistoryDeviceList_' + openId);
    console.log("getCacheHistoryDeviceList : " + JSON.stringify(str));

    let result: Array<HistoryDev.HistoryRecord>
    if (str == "") {
      result = new Array<HistoryDev.HistoryRecord>()
    } else {
      result = str
    }
    return result
  }
}
namespace DevReconnect {
  export interface DeviceReconnectOp {
    /** 开始扫描设备*/
    startScan: () => void
    /** 是不是历史记录设备*/
    isHistoryDevMac: (mac: string) => boolean
    /** 进行蓝牙连接*/
    startBluetoothConnect: (blueToothDevice: BluetoothDevice, isOTADevice: boolean, isNow: boolean) => void
  }
  export class ReconnectImpl {
    private _reconnect: Reconnect | null = null
    private _isInit = false
    private _ReconnectDevOp?: DeviceReconnectOp
    private _bluetoothOption?: DeviceBluetooth.BluetoothOption
    private _blackList = new Array()
    init(reconnectDevJudgeOp: DeviceReconnectOp, bluetoothOption: DeviceBluetooth.BluetoothOption) {
      this._ReconnectDevOp = reconnectDevJudgeOp
      this._bluetoothOption = bluetoothOption
      this._isInit = true
    }
    release() {
      this._isInit = false
      this._ReconnectDevOp = undefined
      this._bluetoothOption = undefined
    }
    /**
     * 正在回连
     */
    public isReconnecting(): boolean {
      return this._reconnect != null
    }
    //上层扫描暂停通知
    public onScanStop() {
      if (this._reconnect != null) {
        this._reconnect.onScanStop()
      }
    }
    //上层扫描发现设备
    public onDiscoveryDevices(devices: BluetoothDevice[]) {
      if (this._isInit && this._reconnect != null) {
        this._reconnect.onDiscoveryDevices(devices)
      }
    }
    //上层扫描发现设备
    public onDiscoveryDevice(device: BluetoothDevice) {
      if (this._isInit && this._reconnect != null) {
        this._reconnect.onDiscoveryDevice(device)
      }
    }
    //上层连接设备成功-
    public onDeviceConnected(device: BluetoothDevice) {
      if (this._isInit && this._reconnect != null && (this._bluetoothOption?.isUseMultiDevice)) {
        this._reconnect.onDeviceConnected(device.deviceId)
      }
    }
    /**
     * 开始优先回连某一个设备-MAC
     */
    public startReconnectDevByHistoryRecrod(historyRecord: HistoryDev.HistoryRecord, reconnectCallback?: ReconnectCallback) {
      if (this._isInit && this._bluetoothOption) {
        this.stopReconnect()
        let isOTA = false;
        // const macLowerCase = mac.toLowerCase()
        // let devMac = '';
        const op: ReconnectOp = {
          startScanDevice: () => { //开始扫描设备
            this._ReconnectDevOp?.startScan()
          },
          isReconnectDevice: (scanDevice: BluetoothDevice) => { //判断是不是回连设备
            let result = false;
            if (this._bluetoothOption) {
              const bleScanMassage = ParseDataUtil.parseBluetoothDeviceFound(this._bluetoothOption, scanDevice)
              let mac: string | undefined = bleScanMassage?.edrAddr
              if (!mac) {
                mac = bleScanMassage?.otaBleAddress
                if (mac) {
                  isOTA = true
                }
              }
              if (bleScanMassage && mac) {
                const macLowerCase = mac.toLowerCase()
                // result = macLowerCase ==mac.toLowerCase()
                if (historyRecord.address.toLowerCase() === macLowerCase || (historyRecord.mappedAddress?.toLowerCase() === macLowerCase || historyRecord.updateAddress?.toLowerCase() === macLowerCase)) {
                  this.removeBlackList(mac)
                  result = true
                }
              }
            }
            return result
          },
          connectDevice: (device: BluetoothDevice) => { //连接设备
            this._ReconnectDevOp?.startBluetoothConnect(device, isOTA, true)
          }
        }
        const callback = {
          onReconnectSuccess: (deviceId: string) => {
            this._reconnect = null;
            if (reconnectCallback && reconnectCallback.onReconnectSuccess) {
              reconnectCallback.onReconnectSuccess(deviceId)
            }
            this.startReconnectAnyBindedDevs()
          },
          onReconnectFailed: () => {
            this._reconnect = null;
            if (reconnectCallback && reconnectCallback.onReconnectFailed) {
              reconnectCallback.onReconnectFailed()
            }


            //连接失败后启动任意设备回连
            this.startReconnectAnyBindedDevs()
          }
        }
        this._reconnect = new Reconnect(op, callback)
        this._reconnect.startReconnect(10 * 1000);
      }

    }
    /**
     * 开始回连任意已绑定设备
     */
    public startReconnectAnyBindedDevs() {
      if (!this._isInit) {
        return
      }
      logi("startReconnectAnyBindedDevs")
      console.log("startReconnectAnyBindedDevs");

      this.stopReconnect()
      const that = this;
      let isOTA = false;
      // let devMac = '';
      const op: ReconnectOp = {
        startScanDevice: () => { //开始扫描设备
          that._ReconnectDevOp?.startScan()
        },
        isReconnectDevice: (scanDevice: BluetoothDevice) => { //判断是不是回连设备
          let result = false;
          if (this._bluetoothOption && that._ReconnectDevOp) {
            const bleScanMassage = ParseDataUtil.parseBluetoothDeviceFound(this._bluetoothOption, scanDevice)
            let mac: string | undefined = bleScanMassage?.edrAddr
            if (!mac) {
              mac = bleScanMassage?.otaBleAddress
              if (mac) {
                isOTA = true
              }
            }
            if (bleScanMassage && mac) {
              if (!that.isBlackList(mac)) {//不是黑名单
                result = that._ReconnectDevOp.isHistoryDevMac(mac)
                if (result) {
                  // console.log("不是黑名单"+mac);
                }
              }
            }
          }
          return result
        },
        connectDevice: (device: BluetoothDevice) => { //连接设备
          this._ReconnectDevOp?.startBluetoothConnect(device, isOTA, true)
        }
      }
      //todo 连接过程中，回连任务没有暂停，导致回连任务开启多个
      const callback = {
        onReconnectSuccess: () => {
          console.log("onReconnectSuccess");
          this._reconnect = null;
          that.startReconnectAnyBindedDevs()
        },
        onReconnectFailed: () => {
          console.log("onReconnectFailed");
          this._reconnect = null;
          //连接失败后继续启动任意设备回连
          that.startReconnectAnyBindedDevs()
        }
      }
      this._reconnect = new Reconnect(op, callback)
      this._reconnect.startReconnect(30 * 1000);
    }
    /** 停止回连设备*/
    public stopReconnect() {
      if (this._reconnect != null && this._reconnect != undefined) {
        console.log("停止回连设备 stopReconnect");
        this._reconnect.stopReconnect()
      }
    }
    /**
     * 是不是黑名单（任意回连）
     */
    public isBlackList(mac: string) {
      var index = this._blackList.indexOf(mac);
      if (index != -1) {
        return true
      }
      return false
    }
    /**
     * 加入黑名单（任意回连）
     */
    public addBlackList(mac: string) {
      if (this._blackList.indexOf(mac) == -1) {
        this._blackList.push(mac);
      }
    }
    /**
     * 移除黑名单（任意回连）
     */
    public removeBlackList(mac: string) {
      var index = this._blackList.indexOf(mac);
      if (index != -1) {
        this._blackList.splice(index, 1);
      }
    }
  }
}

//设备记录-包含历史记录，连接状态，和设备信息，广播信息
export namespace DevRecord {
  export class DeviceRecordEvent {
    type: 'onDeviceRecordChange' | undefined
    /**
    * 设备记录发生变化,排列顺序按：正在使用，已连接，未连接
   */
    onDeviceRecordChangeEvent?: { records: Array<DeviceRecordInfo> }
  }
  export class DeviceRecordInfo extends Object {
    constructor(record?: HistoryDev.HistoryRecord) {
      super()
      if (record) {
        this.record = record
      }
    }
    record?: HistoryDev.HistoryRecord;
    /**
     * 0:已断开
     * 1：连接中
     * 2：已连接
     * 3：需要OTA
    */
    connectStatus: number = 0;
    deviceInfo?: RCSPProtocol.DeviceInfo;
    advInfo?: RCSPProtocol.ResponseGetADVInfo;
    isUsing: boolean = false; //设备是否正在使用
  }
  export class DevRecordManager {
    private _eventCallback: Array<(res: DeviceRecordEvent) => void> = new Array()
    private _deviceRecordInfos = new Array<DeviceRecordInfo>()
    /**
     * 初始化
     */
    constructor() {
      DeviceManager.observe((event) => {
        if (event.type === 'onConnection') {
          if (event.onConnectionEvent?.status != 2) {//非已连接，都同步状态
            this._syncHistoryRecord()
          }
        }
      })
      RCSPManager.observe({
        onEvent: (event) => {
          switch (event.type) {
            case 'onRcspInit':
              const device = event.onRcspInitEvent?.device
              if (event.onRcspInitEvent?.isInit == true && device) {
                const deviceInfo = RCSPManager.getDeviceInfo(device)
                if (deviceInfo) {
                  const historyDev = new HistoryDev.HistoryRecord()
                  historyDev.name = device.name
                  historyDev.address = deviceInfo.bleAddr!
                  historyDev.mappedAddress = deviceInfo.edrAddr
                  historyDev.sdkFlag = deviceInfo.sdkType
                  historyDev.vid = deviceInfo.vid
                  historyDev.uid = deviceInfo.uid
                  historyDev.pid = deviceInfo.pid
                  historyDev.isSupportSearchDevice = deviceInfo.isSupportSearchDevice
                  historyDev.onlineTime = new Date().getTime()
                  // DeviceHistory.saveHistoryRecord(historyDev)
                }
                this._syncHistoryRecord()//多个设备的时候需要，但是一个设备ide时候会频繁更新
              }
              break;
            case 'onSwitchUseDevice':
              this._syncHistoryRecord()
              break;
            case 'onMandatoryUpgrade':
              {
                const device = event.onMandatoryUpgradeEvent?.device
                if (device) {
                  const deviceInfo = RCSPManager.getDeviceInfo(device)
                  if (deviceInfo) {
                    //todo 是不是需要更新地址
                  }
                }
              }
              break;
            case 'onADVInfo':
              {
                const device = event.onADVInfo?.device
                const advInfo = event.onADVInfo?.advInfo
                if (device && advInfo) {
                  const deviceInfo = RCSPManager.getDeviceInfo(device)
                  for (let index = 0; index < this._deviceRecordInfos.length; index++) {
                    const element = this._deviceRecordInfos[index];
                    if (element.record?.address === deviceInfo?.bleAddr) {
                      const tempAdvInfo = OPHeadSet.HeadSetInfoUtil.convertAdvInfoFromBleScanMessage(advInfo)
                      if ((JSON.stringify(element.advInfo) !== JSON.stringify(tempAdvInfo))) {//广播包发生变化
                        // element.advInfo = tempAdvInfo
                        //todo 这里没有频繁去 同步_syncHistoryRecord。。还是需要不断同步的
                        this._syncHistoryRecord()
                      }
                      break;
                    }
                  }
                }
              }
              break;
          }
        },
      })
      //历史记录更改
      DeviceHistory.observe((event) => {
        if (event.type === 'onHistoryRecordChange' || event.type === 'onHistoryRecordClear') {
          this._syncHistoryRecord()
        }
      })
      this._syncHistoryRecord()
    }
    public release() {
      this._eventCallback = new Array()
    }
    public observe(onEvent: (res: DeviceRecordEvent) => void) {
      if (!this._eventCallback.includes(onEvent)) {
        this._eventCallback.push(onEvent)
      }
      return this
    }
    public removeObserve(onEvent: (res: DeviceRecordEvent) => void) {
      const index = this._eventCallback.indexOf(onEvent)
      if (index != -1) {
        this._eventCallback.splice(index, 1)
      }
      return this
    }
    public getHistoryRecord() {
      return this._deviceRecordInfos
    }
    private _isUseDevice(deviceId: string | undefined): boolean {//判断是不是当前是用的设备 
      const result = RCSPManager.getCurrentRcspOperateWrapper()?.deviceId === deviceId
      return result
    }
    private _syncHistoryRecord() {
      const records = DeviceHistory.getHistoryRecordList()
      console.log("_syncHistoryRecord " + records?.length);
      let result = new Array()
      if (records != undefined) {
        const deviceRecordList = new Array<DeviceRecordInfo>();
        for (const record of records) {
          const deviceRecord = new DeviceRecordInfo(record);
          const blueToothDevice: BluetoothDevice | undefined = DeviceManager.getBluetoothDeviceByMac(record.address)
          let isConnectingDev = false;
          let isConnectedDev = false
          let deviceInfo: RCSPProtocol.DeviceInfo | undefined = undefined
          let advInfo: RCSPProtocol.ResponseGetADVInfo | undefined
          if (blueToothDevice) {
            isConnectingDev = DeviceManager.isConnecting(blueToothDevice)
            isConnectedDev = DeviceManager.isConnected(blueToothDevice)
            deviceInfo = RCSPManager.getDeviceInfo(blueToothDevice)
            advInfo = RCSPManager.getADVInfo(blueToothDevice)
          }
          console.error("-syncHistoryRecord- isConnectingDev = " + isConnectingDev + ", isConnectedDev = " + isConnectedDev + ", " + deviceInfo);
          if (isConnectingDev) { //是否连接中设备
            deviceRecord.connectStatus = 1
          } else if (isConnectedDev && deviceInfo) { //是否已连接设备
            deviceRecord.connectStatus = 2
            deviceRecord.isUsing = this._isUseDevice(blueToothDevice?.deviceId)
            deviceRecord.deviceInfo = deviceInfo
            deviceRecord.advInfo = advInfo
            // if (UIHelper.isCanUseTwsCmd(deviceInfo!.sdkType)) {
            //     // mSoundBoxManager.controlAdvBroadcast(cacheDev, false, null);
            //     // 是用twsop关闭adv推送
            //     // RCSPOpHeadSet?.setADVBroadcast(false)
            // }
            if (deviceInfo!.mandatoryUpgradeFlag == 1) {
              deviceRecord.connectStatus = 3;
            } else {
            }
          }
          deviceRecordList.push(deviceRecord);
        }
        result = this._sortDeviceRecordList(deviceRecordList)
        console.log("sortList : ", result);
      }
      //回调
      this._deviceRecordInfos = result
      this._onDeviceRecordChangeHandle(result)
    }
    /**
     * 
    */
    private _sortDeviceRecordList(list: Array<DeviceRecordInfo>): DeviceRecordInfo[] {
      if (list == null || list.length <= 1) return list;
      const result = new Array();
      let usingDev: DeviceRecordInfo | undefined;
      let connectingDev: DeviceRecordInfo | undefined;
      const upgradeDevList = new Array();
      const connectedDevList = new Array();
      const disconnectedDevList = new Array();
      //排序
      for (const record of list) {
        if (record.connectStatus >= 2) {
          if (record.isUsing) {
            usingDev = record;
          } else if (record.connectStatus == 3) {
            upgradeDevList.push(record);
          } else {
            connectedDevList.push(record);
          }
        } else if (record.connectStatus == 1) {
          connectingDev = record;
        } else {
          disconnectedDevList.push(record);
        }
      }
      //排序
      if (null != usingDev) {
        result.push(usingDev);
      }
      if (upgradeDevList.length != 0) {
        result.push(...upgradeDevList);
      }
      if (connectedDevList.length != 0) {
        result.push(...connectedDevList);
      }
      if (null != connectingDev) {
        result.push(connectingDev);
      }
      if (disconnectedDevList.length != 0) {
        result.push(...disconnectedDevList);
      }
      return result
    }
    private _onDeviceRecordChangeHandle(records: Array<DeviceRecordInfo>) {
      const event = new DeviceRecordEvent()
      event.type = 'onDeviceRecordChange'
      event.onDeviceRecordChangeEvent = { records }
      this._notifyEvent(event)
    }
    private _notifyEvent(event: DeviceRecordEvent) {
      this._eventCallback.forEach(element => {
        element(event)
      });
    }
  }
}
//设备管理-蓝牙连接，扫描
export var DeviceManager = new DeviceBluetoothInner.DeviceManager()
//设备回连
export var DeviceReconnect = DeviceManager.reconnectImpl
//设备历史记录-不包含连接状态，和设备信息，广播信息
export var DeviceHistory = DeviceManager.historyRecordManager
//设备记录-包含历史记录，连接状态，和设备信息，广播信息
export var DeviceRecord = new DevRecord.DevRecordManager()