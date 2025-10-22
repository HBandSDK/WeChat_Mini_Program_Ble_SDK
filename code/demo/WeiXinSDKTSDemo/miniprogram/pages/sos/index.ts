// pages/step/step.js

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    times: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  getSos(e: any) {
    this.setData({
      times: e.detail.value
    })
  },

  readSos() {
    veepooFeature.veepooSendReadSOSDataManager();
  },

  setupSos() {

    let data = {
      times: this.data.times,
    }
    console.log('data=>', data);
    veepooFeature.veepooSendSettingSOSDataManager(data)
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" sos 监听蓝牙回调=>", e);
      if (e.type === 12) {
        self.setData({
          times: e.content.times
        })
      }

    })
  },
})