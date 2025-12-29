import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'


// pages/ZT163ScreenKillFunction/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {

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
    this.notifyMonitorValueChange();
  },

  start() {
    veepooFeature.veepooSetupZT163ScreenKillFunctionManager({
      control: 1
    })
  },

  stop() {
    veepooFeature.veepooSetupZT163ScreenKillFunctionManager({
      control: 2
    })
  },

  read() {
    veepooFeature.veepooSetupZT163ScreenKillFunctionManager({
      control: 3
    })
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" step 监听蓝牙回调=>", e);
    })
  },
})