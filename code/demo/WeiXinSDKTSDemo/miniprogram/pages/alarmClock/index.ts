
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 1,
    startTime: '00:00',
    alarmSwitch: false,
    alarmId: '',
    deleteAlarmId: '',
    UPstartTime: '00:00',
    UPalarmSwitch: false,
    UPalarmId: '',
    alarmList: []
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let check = [0xB9, 0x02, 0x01, 0x01, 0xA0, 0x02, 0x60, 0x55, 0xA1, 0x12, 0xB1, 0x08, 0x02, 0x01, 0x21, 0x09, 0x2E, 0x00, 0x00, 0x00, 0xB2, 0x06, 0xE5, 0x93, 0x88, 0xE5, 0x93, 0x88]


    let arr = [160, 33, 0, 161, 1, 1, 162, 9, 233, 153, 136, 230, 152, 190, 230, 150, 135, 163, 11, 49, 53, 50, 56, 57, 53, 57, 54, 50, 52, 50, 164, 1, 1];
    // ["b9", "02", "01", "01", "a0", "02", "07", "bc", "a1", "24", "b1", "08", "03", "01", "1f", "15", "00", "00", "00", "00", "b2", "18", "e6", "96", "87", "e5", "ad", "97", "e9", "97", "b9", "e9", "92", "9f", "e6", "b5", "8b", "e8", "af", "95", "e6", "a0", "87", "e7", "ad", "be"];

    let hex = [];
    for (let i = 0; i < arr.length; i++) {
      let item = arr[i];
      hex.push(item.toString(16).padStart(2, '0'))
    }
    console.log("hex====>", hex);
    this.notifyMonitorValueChange();
  },
  // 读取
  ReadAlarmClockDataManager() {
    veepooFeature.veepooSendReadAlarmClockDataManager();
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" ss 监听蓝牙回调=>", e);
      self.setData({
        alarmList: e.content
      })
    })
  },

  bindStartTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      startTime: e.detail.value
    })
  },

  getId(e: any) {
    let alarmId = e.detail.value;
    this.setData({
      alarmId
    })
  },
  getalarmSwitch(e: any) {
    let alarmSwitch = e.detail.value;
    this.setData({
      alarmSwitch
    })
  },

  UPbindStartTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      UPstartTime: e.detail.value
    })
  },

  UPgetId(e: any) {
    let UPalarmId = e.detail.value;
    this.setData({
      UPalarmId
    })
  },
  UPgetalarmSwitch(e: any) {
    let UPalarmSwitch = e.detail.value;
    this.setData({
      UPalarmSwitch
    })
  },

  deleteAlId(e: any) {
    let deleteAlarmId = e.detail.value;
    this.setData({
      deleteAlarmId
    })
  },

  deleteAlarmClockDataManager() {
    let data = {
      alarmId: this.data.deleteAlarmId,
      switch: true,
      time: '08:00',
      alarmRepeat: {
        "Monday": true,
        "Tuesday": true,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true,
        "Saturday": false,
        "Sunday": false
      }
    }
    veepooFeature.veepooSendDeleteAlarmClockDataManager(data);
  },
  SetAlarmClockDataManager() {

    let data = {
      alarmId: this.data.alarmId,
      switch: this.data.alarmSwitch,
      time: this.data.startTime,
      alarmRepeat: {
        "Monday": true,
        "Tuesday": true,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true,
        "Saturday": false,
        "Sunday": false
      },
      name: "猪猪小猪猪"
    }
    console.log("data=>", data)
    veepooFeature.veepooSendSetAlarmClockDataManager(data);
  },

  updateAlarmClockDataManager() {

    let data = {
      alarmId: this.data.UPalarmId,
      switch: this.data.UPalarmSwitch,
      time: this.data.UPstartTime,
      alarmRepeat: {
        "Monday": true,
        "Tuesday": false,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true,
        "Saturday": false,
        "Sunday": false
      },
      name: "猪猪小猪猪"
    }
    console.log("data=>", data)
    veepooFeature.veepooSendSetAlarmClockDataManager(data);
    this.setData({
      index: this.data.index + 1
    })
  },
})