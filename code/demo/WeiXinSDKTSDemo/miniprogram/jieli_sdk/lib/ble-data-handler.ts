import { veepooBle } from "../../miniprogram_dist/index";
import { logd, loge } from "../utils/log";
import { UUID_NOTIFY } from "./rcsp-impl/bluetooth";

// OTA发送逐包日志开关：排查传输问题时改true，平时保持false——否则3MB固件会打出数万条日志撑爆鸿蒙console导致崩溃
const OTA_SEND_DEBUG = false

// 单包发送payload上限(字节)。部分iPhone(如iPhone SE2)与设备协商出的MTU偏大(实测可达512)，按真实值分包传输会失败；
// 经验上限为244(对应协商MTU 247 - ATT头3字节)。OTA固件、表盘图等大数据传输的单包大小统一以此封顶，
// 协商值本身不改(保留真实协商结果用于调试)，仅在发送分包时封顶。
const MAX_PACKET_PAYLOAD = 244



/** 处理收到数据 */
export var BleDataHandler = {
  callbacks: Array<BleDataCallback>(),
  _initialized: false,
  init() {
    if (this._initialized) return
    this._initialized = true
    // 修改注册方式，UUID_NOTIFY
    veepooBle.addBleNotificationListener(UUID_NOTIFY, (_: string[], res: WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult) => {
      this._handlerData(res);
    })
  },
  addCallbacks(callback: BleDataCallback) {
    if (this.callbacks.indexOf(callback) == -1) {
      this.callbacks.push(callback);
    }
  },
  removeCallbacks(callback: BleDataCallback) {
    var index = this.callbacks.indexOf(callback);
    if (index != -1) {
      this.callbacks.splice(index, 1);
    }
  },
  _handlerData(res: WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult) {
    this._doAction({
      action: function (c) {
        if (c.onReceiveData) {
          c.onReceiveData(res);
        }
      }
    });
  },
  _doAction(obj: { action: (c: BleDataCallback) => void }) {
    this.callbacks.forEach(c => {
      obj.action(c)
    });
  },
}
export interface BleDataCallback {
  onReceiveData?: (res: WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult) => void
}

/todo 后续优化，1.阻塞式发送数据，2.区分设备/
/** 队列式-分包发送数据 */
export var BleSendDataHandler = {
  mtuMap: new Map<string, number>(),
  sendInfoArray: new Array<SendDataTask>(),
  retryNum: 0,
  _isSending: false,
  setMtu(deviceId: string, mtu: number) {
    this.mtuMap.set(deviceId, mtu)
  },
  sendData(deviceId: string, serviceId: string, characteristicId: string, data: Uint8Array): boolean {
    const mtu = this.mtuMap.get(deviceId)
    let realMTU = 20;
    if (mtu != undefined) realMTU = mtu - 3
    // 单包封顶：协商出大MTU时(如iPhone SE2的512 -> realMTU 509)按真实值分包会传输出错，
    // 统一限制单包payload不超过244(协商MTU 247)。协商值<247的设备不受影响。
    if (realMTU > MAX_PACKET_PAYLOAD) realMTU = MAX_PACKET_PAYLOAD
    const dataLen = data.byteLength;
    const blockCount = Math.floor(dataLen / realMTU);
    if (OTA_SEND_DEBUG) console.log('[OTA发送] char=' + characteristicId.slice(0, 8) + ' len=' + dataLen + ' realMTU=' + realMTU + ' 包数=' + (blockCount + (dataLen % realMTU ? 1 : 0)))
    let ret = false;
    for (let i = 0; i < blockCount; i++) {
      const mBlockData = new Uint8Array(realMTU);
      mBlockData.set(data.slice(i * realMTU, i * realMTU + mBlockData.length))
      ret = this._addSendData(deviceId, serviceId, characteristicId, mBlockData);
    }
    if (0 != dataLen % realMTU) {
      const noBlockData = new Uint8Array(dataLen % realMTU);
      noBlockData.set(data.slice(dataLen - dataLen % realMTU, dataLen))
      ret = this._addSendData(deviceId, serviceId, characteristicId, noBlockData);
    }
    return ret
  },
  _addSendData(deviceId: string, serviceId: string, characteristicId: string, data: Uint8Array): boolean {
    const sendDataTask = new SendDataTask(deviceId, serviceId.toUpperCase(), characteristicId.toUpperCase(), data)
    this.sendInfoArray.push(sendDataTask)
    // 用标志位确保只有一个发送流程在跑。之前用 length>1 判断，但 _writeDataToDevice 会立即 shift 清空队列，
    // 导致一帧多包同步连续入队时每次都误判为"无发送流程"而重复启动，实际变成并发写入。
    // 鸿蒙 BLE 不容忍并发写 -> 丢包 -> 设备收不全文件帧 -> 反复请求 -> OTA -111。
    if (this._isSending) {
      return true // 已有发送流程，入队即可，由它顺序取出
    }
    this._isSending = true
    this._writeDataToDevice()
    return true
  },
  _writeDataToDevice() {
    if (this.sendInfoArray.length === 0) {
      this._isSending = false
      return // 队列发送完毕
    }
    const dataInfo = this.sendInfoArray.shift()
    if (!dataInfo) {
      this._isSending = false
      return
    }
    if (OTA_SEND_DEBUG) console.log('[OTA发送] 发包 len=' + dataInfo.data.length + ' 剩余=' + this.sendInfoArray.length)
    // 关键：上一包写入完成(成功或放弃)后再发下一包，避免鸿蒙并发写入丢包导致 OTA -111 超时
    this._sendData(dataInfo, () => {
      this._writeDataToDevice()
    })
  },
  _sendData(sendDataTask: SendDataTask, onComplete?: () => void) {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onComplete?.()
    }
    // 超时保护：鸿蒙上 writeBLECharacteristicValue 的 success/fail 偶发不回调，
    // 顺序发送会卡死整条队列(设备收不完整帧 -> OTA -111)。3秒无回调强制继续下一包。
    const timer = setTimeout(() => {
      if (!done) {
        loge('[OTA发送] 写包超时强制继续 len=' + sendDataTask.data.length)
        finish()
      }
    }, 3000)
    wx.writeBLECharacteristicValue({
      deviceId: sendDataTask.deviceId,
      serviceId: sendDataTask.serviceId,
      characteristicId: sendDataTask.characteristicId,
      value: sendDataTask.data.buffer as ArrayBuffer,
      writeType: 'writeNoResponse', // 鸿蒙上 write(有应答写)对AE01数据设备不响应，统一用 writeNoResponse(杰理默认) + 顺序发送保证可靠
      success: () => {
        clearTimeout(timer)
        this.retryNum = 0
        if (OTA_SEND_DEBUG) console.log('[OTA发送] 包success len=' + sendDataTask.data.length)
        finish()
      },
      fail: (err) => {
        clearTimeout(timer)
        loge("发送数据失败：->" + "\terr=" + JSON.stringify(err) + " retryNum = " + this.retryNum)
        if (this.retryNum < 3) {
          this.retryNum++
          logd("重发数据 retryNum = " + this.retryNum)
          this._sendData(sendDataTask, onComplete) // 重发当前包
        } else {
          this.retryNum = 0
          finish() // 放弃当前包，继续后续，避免整条队列卡死
        }
      }
    })
  }
}
class SendDataTask {
  public deviceId: string
  public serviceId: string
  public characteristicId: string
  public data: Uint8Array
  constructor(deviceId: string, serviceId: string, characteristicId: string, data: Uint8Array) {
    this.deviceId = deviceId
    this.serviceId = serviceId
    this.characteristicId = characteristicId
    this.data = data
  }
}