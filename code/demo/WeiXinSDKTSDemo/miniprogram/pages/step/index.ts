// pages/step/step.js

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: 1,
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


    setTimeout(() => {
      this.readData(0);
      
    }, 500);

  },
  // 读取步数，卡路里，距离
  readData(e: any) {
    let day = e
    if (e.currentTarget) {
      day = e.currentTarget.dataset.index;
    }

    let data = {
      day: day
    }
    veepooFeature.veepooReadStepCalorieDistanceManager(data);
  },

  // veepooWeiXinSDKNotifyMonitorValueChange
  // veepooBle
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e:any) {
      console.log(" step 监听蓝牙回调=>", e);
      if (e.type == 9) {
        self.setData({
          device: e.content
        })
      }
    })
  },
})