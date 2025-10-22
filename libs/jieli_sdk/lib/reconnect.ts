import { logi } from "../utils/log";
import { incrementMacAddress, getDeviceDataMac } from "../utils/util";
import { BluetoothDevice } from "./bluetooth";

/todo 不可以跟上层扫描冲突，所以要上层的扫描/
export class Reconnect {
  reconnectOp?: ReconnectOp;
  reconnectCallback?: ReconnectCallback;
  isFinished: boolean = false;
  connectingDevice: BluetoothDevice | undefined;
  timeoutNumber: number = -1;
  isFindDevice: boolean = false;
  constructor(op: ReconnectOp, callback: ReconnectCallback) {
    this.reconnectOp = op;
    this.reconnectCallback = callback;
  }
  startReconnect(timeout: number) {
    this.timeoutNumber = setTimeout(() => {
      clearTimeout(this.timeoutNumber)
      this.reconnectCallback?.onReconnectFailed()
      this.reconnectOp = undefined
      this.reconnectCallback = undefined
      this.connectingDevice = undefined
      this.isFinished = true
      this.timeoutNumber = -1
    }, timeout);
    this.reconnectOp?.startScanDevice()
  }
  stopReconnect() {
    this.reconnectOp = undefined
    this.reconnectCallback = undefined
    this.connectingDevice = undefined
    this.isFinished = true
    clearTimeout(this.timeoutNumber)
    this.timeoutNumber = -1
  }
  //上层扫描暂停通知
  onScanStop() {
    console.error("上层扫描暂停通知 : " + this.isFinishedReconnect());
    if (!this.isFinishedReconnect()) {
      this.reconnectOp?.startScanDevice();
    }
  }
  //上层扫描发现设备
  onDiscoveryDevices(devices: BluetoothDevice[]) {
    devices.forEach(device => {
      this.onDiscoveryDevice(device)
    });
  }
  //上层扫描发现设备
  onDiscoveryDevice(device: BluetoothDevice) {
    if (!this.isFinishedReconnect()) {
      if (this.reconnectOp?.isReconnectDevice(device)) {
        this.onScanStop()
        console.log("上层扫描发现设备device=>", device);
        this.connectingDevice = device
        console.log(" this.reconnectOp=>", this.reconnectOp)
        this.reconnectOp?.connectDevice(device)
      }
    }
  }
  //上层连接设备成功-
  onDeviceConnected(deviceId: string) {
    if (!this.isFinishedReconnect()) {
      logi("onDeviceConnected : " + deviceId + " deviceId :" + this.connectingDevice?.deviceId);
      if (this.connectingDevice != null && this.connectingDevice != undefined && deviceId == this.connectingDevice.deviceId) {
        clearTimeout(this.timeoutNumber)
        this.reconnectCallback?.onReconnectSuccess(deviceId)
        this.isFinished = true
        this.isFindDevice = false;
      }
    }
  }

  private isFinishedReconnect(): boolean {
    return this.isFinished;
  }
}


//新回连方式解析器
export function parseReconnectNewWayMsg(rawData: ArrayBuffer) {

}

export interface ReconnectOp {
  startScanDevice(): any;//扫描设备
  isReconnectDevice(scanDevice: BluetoothDevice): boolean//判断是不是回连设备
  connectDevice(device: BluetoothDevice): any;//连接设备
}
export interface ReconnectCallback {
  onReconnectSuccess(deviceId: string): any;
  onReconnectFailed(): any;
}