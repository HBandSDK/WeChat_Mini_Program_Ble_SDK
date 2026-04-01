// pages/universalBlood/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    startTime: '00:00',
    endTime: '00:00',
    deviceSwitch: false,
    intervalTime: '30',
    index: 0,
    deviceType: '',
    device: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },
  // startTime
  // endTime
  // intervalTime
  // valSwitch
  // deviceControl
  // deviceType
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.notifyMonitorValueChange()
  },
  bindStartTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      startTime: e.detail.value
    })
  },
  bindStopTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      endTime: e.detail.value
    })
  },
  changeIntervalTime(e: any) {
    let self = this;
    self.setData({
      intervalTime: e.detail.value
    })
  },

  bindSwitchChange(e: any) {
    let self = this;
    self.setData({
      deviceSwitch: e.detail.value
    })
  },

  startTest() {

    let self = this;
    let data = {
      switch: self.data.deviceSwitch ? 'start' : 'stop',// 开关  start  开启  stop 关闭
      startTime: self.data.startTime,// 开始时间
      endTime: self.data.endTime,// 结束时间
      deviceControl: 'setup',// setup 设置 read 读取
    }

    console.log("data=>", data)
    veepooFeature.veepooSendBloodOxygenAutoTestDataManager(data);
    
  },
  readAllDayTest(e: any) {
    let index = e.currentTarget.dataset.index
    let data = {
      day: index, // 0 今天  1 昨天 2 前天
      package: '1'
    }
    console.log("data==>",data)
    veepooFeature.veepooSendReadAllDayBloodOxygenDataManager(data);
  },
  readTest() {
    let self = this;
    let data = {
      switch: self.data.deviceSwitch ? 'start' : 'stop',
      startTime: self.data.startTime,// 开始时间
      endTime: self.data.endTime,// 结束时间
      deviceControl: 'read'
    }
    console.log("data=>", data)
    veepooFeature.veepooSendBloodOxygenAutoTestDataManager(data);
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
      if (e.type == 29) {
        self.setData({
          startTime:e.content.startTime,
          endTime:e.content.endTime,
          deviceSwitch:e.content.switch
        })
      }

      if (e.type == 30) {
        self.setData({
          device: e
        })
      }
    })
  },
})