import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    index: 1
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
    wx.getSystemInfo({
      success: function(res) {
        console.log('系统默认语言:', res.language);
      },
      fail: function(err) {
        console.error('获取系统信息失败:', err);
      }
    });
  },



  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;

    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("  监听蓝牙回调=>", e);
    });

  },


  inputChange(e: any) {
    console.log('e=>', e)
    this.setData({
      index: e.detail.value
    })
  },


  bindLanguage() {
    let val = {
      language: this.data.index
    }
    console.log('val==>', val)
    veepooFeature.veepooSendLanguageSetupManager(val)
  }

})