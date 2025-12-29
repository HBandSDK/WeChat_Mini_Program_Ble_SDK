// pages/switchSetup/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checkStatus1: false,
    checkStatus2: false,
    checkStatus3: false,
    checkStatus4: false,
    checkStatus5: false,
    checkStatus6: false,
    checkStatus7: false,
    checkStatus8: false,
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
  clickValue1(e: any) {
    console.log("e=>", e)
    this.setData({
      checkStatus1: e.detail.value
    })
    let data = {
      heartRate: e.detail.value ? 'start' : 'stop'
    };
    veepooFeature.veepooSendAutoTestSwitchDataManager(data);
  },
  clickValue2(e: any) {
    this.setData({
      checkStatus2: e.detail.value
    })
    let data = {
      bloodPressure: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  clickValue3(e: any) {
    this.setData({
      checkStatus3: e.detail.value
    })
    let data = {
      scientificSleep: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  clickValue4(e: any) {
    this.setData({
      checkStatus4: e.detail.value
    })
    let data = {
      bodyTemperature: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  clickValue5(e: any) {
    this.setData({
      checkStatus5: e.detail.value
    })
    let data = {
      bloodGlucose: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  clickValue6(e: any) {
    this.setData({
      checkStatus6: e.detail.value
    })
    let data = {
      bloodComponents: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data);
  },
  clickValue7(e: any) {
    this.setData({
      checkStatus7: e.detail.value
    })
    let data = {
      fallWarning: e.detail.value ? 'start' : 'stop'
    }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  clickValue8(e: any) {
    this.setData({
      checkStatus8: e.detail.value
    })
    let data = {
      lowOxygen: e.detail.value ? 'start' : 'stop'
    }
    // let data = {
    //   lowOxygen:'start'
    // }
    veepooFeature.veepooSendAutoTestSwitchDataManager(data)
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("  监听蓝牙回调=>", e);
    })
  },

})