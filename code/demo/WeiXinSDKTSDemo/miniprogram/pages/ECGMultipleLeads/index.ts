// pages/ecgTest/index.js

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
import { ab2hex } from '../../utils/util'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {}
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
    this.notifyMonitorValueChange();
  },
  // 无参数
  MultipleLeadsStart() {
    let data = {
      switch: 'start'
    }
    veepooFeature.veepooSendMultipleLeadsDataManager(data);
  },
  MultipleLeadsStop() {
    let data = {
      switch: 'stop'
    }
    veepooFeature.veepooSendMultipleLeadsDataManager(data);
  },

  // 监听订阅 veepooWeiXinSDKUpdateECGServiceManager   ecg服务
  notifyMonitorValueChange() {
    // ecg多导服务
    veepooBle.veepooWeiXinSDKUpdateECGServiceManager(function (e: any) {
      console.log(" ECG 监听蓝牙回调=>", e);
    })
  },
})