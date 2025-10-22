// pages/heartRateTest/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    progress: 0,
    heartRate: 0,
    bloodOxygen: 0,
    pressure: 0,
    emotion: 0,
    fatigueLevel: 0,
    bloodSugar: 0,
    bodyTemperature: 0,
    highPressure: 0,
    lowPressure: 0
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
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    // veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
    //   console.log("  监听蓝牙回调=>", e);

    //   if (e && e.type != 53) {
    //     return
    //   }
    //   if ( e && e.dataType === 0) {
    //     self.setData({
    //       progress: e.progress
    //     })
    //   } else if ( e && e.dataType === 1) {
    //     self.setData({
    //       heartRate: e.content.heartRate,
    //       bloodOxygen: e.content.bloodOxygen,
    //       pressure: e.content.pressure,
    //       emotion: e.content.emotion,
    //       fatigueLevel: e.content.fatigueLevel,
    //       bloodSugar: e.content.bloodSugar,
    //       bodyTemperature: e.content.bodyTemperature,
    //       highPressure: e.content.highPressure,
    //       lowPressure: e.content.lowPressure,
    //     })
    //   }
    // });

    // 订阅ad数据
    // veepooWeiXinSDKNotifyECGValueChange
    // veepooWeiXinSDKNotifyADCValueChange
    veepooBle.veepooWeiXinSDKNotifyADCValueChange(function (e: any) {
      console.log("数据返回=》", e)

      if (e && e.type != 53) {
        return
      }

      if ( e && e.dataType === 0) {

        self.setData({
          progress: e.progress
        })

      } else if ( e && e.dataType === 1) {

        self.setData({
          heartRate: e.content.heartRate,
          bloodOxygen: e.content.bloodOxygen,
          pressure: e.content.pressure,
          emotion: e.content.emotion,
          fatigueLevel: e.content.fatigueLevel,
          bloodSugar: e.content.bloodSugar,
          bodyTemperature: e.content.bodyTemperature,
          highPressure: e.content.highPressure,
          lowPressure: e.content.lowPressure,
        })
      }
    })
  },

  microCheckStart() {
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'start' })
  },

  microCheckStop() {
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'stop' })
  }
})