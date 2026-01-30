// pages/heartRateTest/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'


Page({

  /**
   * 页面的初始数据
   */
  data: {
    pressure:0
  },

  // 

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
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyECGValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
      if(e.type == 58){
        self.setData({
          pressure:e.content.pressure
        })
      }
    })
  },

  pressureTestStart() {
    veepooFeature.veepooSendPressureTestManager({switch:true})
  },

  pressureTestStop() {
    veepooFeature.veepooSendPressureTestManager({switch:false})
  }
})