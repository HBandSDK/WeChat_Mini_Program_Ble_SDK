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
  ECGmeasureStartDataManager() {
    veepooFeature.veepooSendECGmeasureStartDataManager();
  },
  ECGmeasureStopDataManager() {
    veepooFeature.veepooSendECGmeasureStopDataManager();
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    // veepooWeiXinSDKNotifyMonitorValueChange
    // veepooWeiXinSDKNotifyECGValueChange
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" ECG 主服务蓝牙回调=>", e);
      if (e.type == 2000) {
        veepooBle.veepooWeiXinSDKNotifyECGValueChange(function (eve: any) {
          console.log("PPT 测量返回=》", eve)
        })

        veepooFeature.veepooSendReadPPTTestDataManager()
      }
    })
  },
})