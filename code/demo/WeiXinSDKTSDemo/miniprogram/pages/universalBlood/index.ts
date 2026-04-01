// pages/universalBlood/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    univerData: {},
    high: 0,
    low: 0
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
    this.notifyMonitorValueChange()
  },
  startPrivateTest() {
    let data = {
      switch: 'start'
    }
    veepooFeature.veepooSendPrivateBloodPressureStupDataManager(data);
  },
  stopPrivateTest() {
    let data = {
      switch: 'stop'
    }
    veepooFeature.veepooSendPrivateBloodPressureStupDataManager(data);
  },

  startTest() {
    let data = {
      switch: 'start'
    }
    veepooFeature.veepooSendReadUniversalBloodPressureDataManager(data);
  },
  stopTest() {
    let data = {
      switch: 'stop'
    }
    veepooFeature.veepooSendReadUniversalBloodPressureDataManager(data);
  },
  startBlood() {
    let self = this;
    let data = {
      switch: 'start',
      bloodPressureHigh: self.data.high,
      bloodPressureLow: self.data.low
    }
    console.log('data==>', data)
    veepooFeature.veepooSendBloodPressurePrivateDataManager(data)
  },
  stopBlood() {
    let self = this;
    let data = {
      switch: 'stop',
      bloodPressureHigh: self.data.high,
      bloodPressureLow: self.data.low
    }
    veepooFeature.veepooSendBloodPressurePrivateDataManager(data)
  },


  readBlood() {
    let data = {
      switch: 'read',
      bloodPressureHigh: '0',
      bloodPressureLow: '0'
    }
    veepooFeature.veepooSendBloodPressurePrivateDataManager(data)
  },
  value1(e: any) {

    let self = this;
    self.setData({
      high: e.detail.value
    })
  },
  value2(e: any) {
    let self = this;
    self.setData({
      low: e.detail.value
    })
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
      if (e.type == 18) {
        self.setData({
          univerData: e
        })
      }
      if (e.type == 28) {
        self.setData({

        })
      }
    })
  },
})