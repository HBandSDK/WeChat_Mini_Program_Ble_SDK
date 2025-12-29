// pages/universalBlood/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

const fs = wx.getFileSystemManager()

const date = new Date().toISOString().slice(0, 10)
// const logPath = `${wx.env.USER_DATA_PATH}/log.txt`
const logPath = `${wx.env.USER_DATA_PATH}/${date}log.txt`
const endDate = new Date().toISOString().slice(0, 10)

console.log('endDate=>', endDate);

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: null,
    progress: 0,
    modeType: 0,
    date: endDate,
    time: "00:00",
    endDate: endDate
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

    fs.readFile({
      filePath: logPath,
      encoding: 'utf8',
      success(res) {
        console.log("读取的日志内容res.data=》", res.data)
      }
    })

    this.notifyMonitorValueChange()
  },

  openLog() {
    wx.openDocument({
      filePath: logPath,
      // fileType: 'txt',
      showMenu: true
    })
  },

  deleteLog() {
    fs.writeFile({
      filePath: logPath,
      data: '',
      encoding: 'utf8'
    })

  },

  writeLog(content: string) {
    const date = new Date().toISOString().slice(0, 10)
    const time = new Date().toISOString().slice(11, 23)
    const log = `[${date} ${time}] ${content}\n`

    return new Promise((resolve, reject) => {

      setTimeout(() => {
        fs.appendFile({
          filePath: logPath,
          data: log,
          encoding: 'utf8',
          success() {
            console.log('日志写入成功')
            resolve(true)
          },
          fail(err) {
            console.error('日志写入失败', err)
            resolve(false)
          }
        })
      }, 3);

    })
  },

  bindDateChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      date: e.detail.value
    })
  },
  bindTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      time: e.detail.value
    })
  },

  stopTest() {
    let self = this;
    let data = {
      switch: 'stop',
    }
    veepooFeature.veepooSendBloodOxygenControlDataManager(data);
  },

  // 读取测量模式开关状态
  readTestModeSwitchState() {

    veepooFeature.veepooReadTestModeSwitchStateDataManager();
  },

  // 设置模式全关
  setupModeSwitchStop() {
    let data = {
      state: 1,
    }
    veepooFeature.veepooSetupTestModeOneSwitchStateDataManager(data);
  },

  // 设置测量模式开关状态1
  setupTestModeSwitchState1() {
    let data = {
      state: 2,
    }
    veepooFeature.veepooSetupTestModeOneSwitchStateDataManager(data);
  },

  // 设置测量模式开关状态2
  setupTestModeSwitchState2() {
    let data = {
      state: 3,
    }
    veepooFeature.veepooSetupTestModeOneSwitchStateDataManager(data);
  },

  // 读取原始数据
  readOrigData1() {
    let self = this;
    this.deleteLog();

    // 获取当前时间
    const now = new Date();
    // 创建一个新的日期对象，时间设为今天的 1 点整
    const oneAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // 秒级时间戳
    const timestampInSeconds = Math.floor(oneAM.getTime() / 1000);

    let txt = `${self.data.endDate} ${self.data.time}`
    let times = self.toTimestampSec(txt);

    console.log('times==》', times);

    console.log('timestampInSeconds=>', timestampInSeconds);

    let data = {
      mode: 1,
      timeStamp: times
    }
    console.log("data===>", data);

    veepooFeature.veepooReadTestModeOrigDataManager(data);
  },

  // 读取原始数据
  readOrigData2() {
    let self = this;
    this.deleteLog();

    // 获取当前时间
    const now = new Date();
    // 创建一个新的日期对象，时间设为今天的 1 点整
    const oneAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // 秒级时间戳
    const timestampInSeconds = Math.floor(oneAM.getTime() / 1000);

    let txt = `${self.data.endDate} ${self.data.time}`
    let times = self.toTimestampSec(txt);

    let data = {
      mode: 2,
      timeStamp: times
    }
    console.log("data===>", data);

    veepooFeature.veepooReadTestModeOrigDataManager(data);
  },

  // 时间戳转日期
  formatTime(sec: number): string {
    const d = new Date(sec * 1000);

    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');

    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
  },

  // 日期转时间戳
  toTimestampSec(dateStr: string): number {
    // 把 "YYYY-MM-DD HH:mm" 转成 "YYYY-MM-DDTHH:mm"
    const safeStr = dateStr.replace(' ', 'T');
    return Math.floor(new Date(safeStr).getTime() / 1000);
  },

  // 日志处理 
  handleLog(list: any) {

    let self = this;
    // writeLog


    let totalLength = `总组数：${list.length}`
    self.writeLog(totalLength)


    setTimeout(async () => {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        for (let j = 0; j < item.array.length; j++) {
          const child = item.array[j];
          const ppgText = `PPG数据：${JSON.stringify(child.ppgData)}`
          const xText = `加速度X：${JSON.stringify(child.acceleration.x)}`
          const yText = `加速度Y：${JSON.stringify(child.acceleration.y)}`
          const zText = `加速度Z：${JSON.stringify(child.acceleration.z)}`
          const time = `数据时间：${self.formatTime(item.timeStamp)}`;
          const eachGroupText = `第${i + 1}组`
          const count = `第${j + 1}条`;
          const text = `\n${ppgText}\n${xText}\n${yText}\n${zText}\n${time}\n${eachGroupText} ${count}`
          await self.writeLog(text)
        }
      }

    }, 200);

  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {

    let self = this;

    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);

      if (!e) {

        return
      }

      if (e.type == 54) {

        self.setData({
          modeType: e.content.state
        })

      }

      if (e.type == 55 && e.progress == 100 && e.content.length != 0) {

        console.log('数据读取完成');

        self.handleLog(e.content)

      }

      self.setData({
        device: e,
        progress: e.progress
      })
    });

  },
})


