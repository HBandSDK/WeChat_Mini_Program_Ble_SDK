// pages/heartRateAlarm/index.ts

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    value1: 100,
    value2: 40
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
  value1(e: any) {
    this.setData({
      value1: e.detail.value
    })
  },
  value2(e: any) {
    this.setData({
      value2: e.detail.value
    })
  },
  setHeartRateAlarm(e: any) {
    let data = {
      maxHeartRate: this.data.value1,
      minHeartRate: this.data.value2,
      switch: 'start',

    }
    veepooFeature.veepooSendHeartRateAlarmIntervalDataManager(data);
  },
  stopHeartRateAlarm(e: any) {
    let data = {
      maxHeartRate: '',
      minHeartRate: '',
      switch: 'stop',

    }
    veepooFeature.veepooSendHeartRateAlarmIntervalDataManager(data)
  },
  readHeartRateAlarm(e: any) {
    let data = {
      maxHeartRate: '',
      minHeartRate: '',
      switch: 'read',  

    }
    veepooFeature.veepooSendHeartRateAlarmIntervalDataManager(data)
  },


  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("  监听蓝牙回调=>", e);
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})