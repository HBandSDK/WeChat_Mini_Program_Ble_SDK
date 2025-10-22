import { BluetoothManager, IScan, ScanCallback, BluetoothError, ScanDevice, IConnect, ConnectImplCallback, ScanSettingConfigure, ConnectSettingConfigure, BluetoothService } from "../bluetooth";
import { BluetoothDevice } from "../rcsp-protocol/rcsp-util";
import { RCSPWrapperBluetooth } from "./rcsp";
export const UUID_SERVICE = "0000ae00-0000-1000-8000-00805f9b34fb";
export const UUID_WRITE = "0000ae01-0000-1000-8000-00805f9b34fb";
export const UUID_NOTIFY = "0000ae02-0000-1000-8000-00805f9b34fb";
export class Bluetooth {
    bluetoothManager: BluetoothManager
    bleScan: BleScan
    bleConnect: BleConnect
    constructor() {
        this.bluetoothManager = new BluetoothManager()
        this.bleScan = new BleScan(this.bluetoothManager.getScanImpl())
        this.bleConnect = new BleConnect(this.bluetoothManager.getConnectImpl())
        const scanSettingConfigure = new ScanSettingConfigure()
        scanSettingConfigure.allowDuplicatesKey = true//是否允许重复上报同一个设备
        scanSettingConfigure.filterServic = undefined//过滤发现的服务
        scanSettingConfigure.interval = 0//上报间隔
        scanSettingConfigure.isContainSystemsConnectedDevice = true//是否包含系统设备，系统设备需要在本地缓存广播包信息，才可以发现
        scanSettingConfigure.isOpenScanTimeout = true//是否有扫描超时
        scanSettingConfigure.powerLevel = 'high' //this._bluetoothOption.enterLowPowerMode ? 'low' : 'high'//扫描功耗模式
        scanSettingConfigure.scanTimeOut = 30000//扫描超时（ms）
        this.bluetoothManager.getScanImpl().setScanSettingConfigure(scanSettingConfigure)
        const connectSettingConfigure = new ConnectSettingConfigure()
        const notifyServiceArray = new Array()
        const notifyService = new BluetoothService()
        notifyService.serviceUUID = UUID_SERVICE
        notifyService.notifyCharacteristicsUUID = [UUID_NOTIFY]
        notifyServiceArray.push(notifyService)
        connectSettingConfigure.notifyServiceArray = notifyServiceArray
        this.bluetoothManager.getConnectImpl().setConnectSettingConfigure(connectSettingConfigure)
    }
}
//将IScan转成 RCSPBluetoothManage.IScan
export class BleScan implements RCSPWrapperBluetooth.IBleScan {
    private _iscan: IScan
    private _callbacks = new Array<RCSPWrapperBluetooth.IBleScanCallback>();
    private _iscanCallback: ScanCallback = {
        onBluetoothAdapterAvailable: (available) => {
            this._callbacks.forEach(c => {
                if (c.onBluetoothAdapterAvailable) {
                    c.onBluetoothAdapterAvailable(available);
                }
            });
        },
        /** 开始扫描设备*/
        onScanStart: () => {
            this._callbacks.forEach(c => {
                if (c.onScanStart) {
                    c.onScanStart();
                }
            });
        },
        /** 扫描失败*/
        onScanFailed: (error: BluetoothError) => {
            this._callbacks.forEach(c => {
                if (c.onScanFailed) {
                    c.onScanFailed({ errorCode: error.errCode, msg: error.errMsg });
                }
            });
        },
        /** 扫描结束*/
        onScanFinish: () => {
            this._callbacks.forEach(c => {
                if (c.onScanFinish) {
                    c.onScanFinish();
                }
            });
        },
        /** 发送设备*/
        onFound: (devs: ScanDevice[]) => {
            this._callbacks.forEach(c => {
                if (c.onFound) {
                    c.onFound(devs);
                }
            });
        }
    }
    constructor(iscan: IScan) {
        this._iscan = iscan
        this._iscan.addCallback(this._iscanCallback)
    }
    release() {
        this._iscan.removeCallback(this._iscanCallback)
    }
    isBluetoothAdapterAvailable(): boolean {
        return this._iscan.isBluetoothAdapterAvailable()
    }
    /*是否正在扫描*/
    isScanning(): boolean {
        return this._iscan.isScanning()
    }
    /*添加回调*/
    addCallback(callback: RCSPWrapperBluetooth.IBleScanCallback): void {
        if (this._callbacks.indexOf(callback) == -1) {
            this._callbacks.push(callback);
        }
    }
    /*移除回调*/
    removeCallback(callback: RCSPWrapperBluetooth.IBleScanCallback): void {
        var index = this._callbacks.indexOf(callback);
        if (index != -1) {
            this._callbacks.splice(index, 1);
        }
    }
    /*开始扫描*/
    startScan(scanTimeOut?: number): boolean {
        return this._iscan.startScan(scanTimeOut)
    }
    /*刷新扫描*/
    refreshScan(): void {
        this._iscan.refreshScan()
    }
    /*停止扫描*/
    stopScan(): void {
        this._iscan.stopScan()
    }
}

export class BleConnect implements RCSPWrapperBluetooth.IBleConnect {
    private _iconnect: IConnect
    private _callbacks = new Array<RCSPWrapperBluetooth.IBleConnectCallback>();
    private _iconnectCallback: ConnectImplCallback = {
        onBluetoothAdapterAvailable: (available) => {
            this._callbacks.forEach(c => {
                if (c.onBluetoothAdapterAvailable) {
                    c.onBluetoothAdapterAvailable(available);
                }
            });
        },
        /** MTU改变*/
        onMTUChange: (device: BluetoothDevice, mtu: number) => {
            this._callbacks.forEach(c => {
                if (c.onMTUChange) {
                    c.onMTUChange(device, mtu);
                }
            });
        },
        /** 连接成功*/
        onConnectSuccess: (device: BluetoothDevice) => {
            console.log(" asdasd " + this._callbacks.length);
            this._callbacks.forEach(c => {
                if (c.onConnectSuccess) {
                    c.onConnectSuccess(device);
                }
            });
        },
        /** 连接失败*/
        onConnectFailed: (device: BluetoothDevice, error: BluetoothError) => {
            this._callbacks.forEach(c => {
                if (c.onConnectFailed) {
                    c.onConnectFailed(device, { errorCode: error.errCode, msg: error.errMsg });
                }
            });
        },
        /** 连接断开*/
        onConnectDisconnect: (device: BluetoothDevice) => {
            this._callbacks.forEach(c => {
                if (c.onConnectDisconnect) {
                    c.onConnectDisconnect(device);
                }
            });
        }
    }
    constructor(iconnect: IConnect) {
        this._iconnect = iconnect
        this._iconnect.addCallback(this._iconnectCallback)
    }
    release() {
        this._iconnect.removeCallback(this._iconnectCallback)
    }
    /*添加回调*/
    addCallback(callback: RCSPWrapperBluetooth.IBleConnectCallback) {
        if (this._callbacks.indexOf(callback) == -1) {
            this._callbacks.push(callback);
        }
    }
    /*移除回调*/
    removeCallback(callback: RCSPWrapperBluetooth.IBleConnectCallback) {
        var index = this._callbacks.indexOf(callback);
        if (index != -1) {
            this._callbacks.splice(index, 1);
        }
    }
    isBluetoothAdapterAvailable(): boolean {
        return this._iconnect.isBluetoothAdapterAvailable()
    }
    /** 连接设备*/
    connectDevice(device: BluetoothDevice): boolean {
        return this._iconnect.connectDevice(device, {})
    }
    /** 断开已连接设备 */
    disconnect(device: BluetoothDevice): void {
        this._iconnect.disconnect(device)
    }
    /** 获取已连接设备列表*/
    getConnectedDeviceIds(): Array<BluetoothDevice> | null {
        return this._iconnect.getConnectedDeviceIds()
    }
    /** 获取设备MTU*/
    getMTU(device: BluetoothDevice): number | undefined {
        return this._iconnect.getMTU(device)
    }
    /** 是否正在连接*/
    isConnecting(device: BluetoothDevice): boolean {
        return this._iconnect.isConnecting(device)
    }
    /** 是否已连接*/
    isConnected(device: BluetoothDevice): boolean {
        return this._iconnect.isConnected(device)
    }
}

export var wxBluetooth = new Bluetooth()