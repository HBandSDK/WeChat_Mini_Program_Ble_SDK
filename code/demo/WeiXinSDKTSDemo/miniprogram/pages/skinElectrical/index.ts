// pages/skinElectrical/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    skinData: {}
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

  // 开始皮肤电活动测试
  startSkinElectricalActivityTest(){
    veepooFeature.veepooSkinElectricalActivityStartManager()
  },

  // 关闭皮肤电活动测试
  closeSkinElectricalActivityTest(){
    veepooFeature.veepooSkinElectricalActivityCloseManager()
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" 皮肤电活动测量 监听蓝牙回调=>", e);
      if (e) {
        if (e.type == 62) {
          self.setData({
            skinData: e
          })
        }
      }
    })
  },
})