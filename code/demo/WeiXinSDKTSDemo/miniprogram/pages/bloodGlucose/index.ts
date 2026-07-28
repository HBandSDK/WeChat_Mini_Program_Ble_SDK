// pages/universalBlood/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bloodGlucoseData: '',
    value1: 3,
    verifySwitch:false
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


  bindVerifySwitch(e:any){
    console.log('e==>',e);
    let val = e.detail.value
    let self = this;
    self.setData({
      verifySwitch:val
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.notifyMonitorValueChange()
  },
  // veepooSendBloodGlucoseMeasurementDataManager
  startTest() {
    let data = {
      switch: 'start',
      calibration: true,// true 开启校准模式  false 关闭校准模式
    }
    veepooFeature.veepooSendBloodGlucoseMeasurementDataManager(data);
  },

  inputValue1(e: any) {
    this.setData({
      value1: e.detail.value
    })
  },
  noCalibrationStartTest() {
    let data = {
      switch: 'start',
      calibration: false,// true 开启校准模式  false 关闭校准模式
    }
    veepooFeature.veepooSendBloodGlucoseMeasurementDataManager(data);
  },
  stopTest() {
    let data = {
      switch: 'stop',
      calibration: true,// true 开启校准模式  false 关闭校准模式
    }
    veepooFeature.veepooSendBloodGlucoseMeasurementDataManager(data);
  },

  // 设置
  startBloodVerify() {
    // 注意：每次发送都需要将血糖转换为 mmol/L   
    // mg/dl  转mmol/L 公式：血糖水平（mg/dl）= 血糖水平（mmol/L）× 18   血糖水平（mmol/L）= 血糖水平（mg/dl）/ 18
    let verifySwitch = this.data.verifySwitch;
    let data = {
      deviceControl: 'setup',// setup 设置  read 读取
      switch: verifySwitch ? 'start' : 'stop', // start 开启  stop 关闭
      bloodGlucoseValue: this.data.value1
    }
    console.log("data=>", data)
    veepooFeature.veepooSendBloodGlucoseCalibrateModuleDataManager(data);
  },
  // 读取
  stopBloodVerify() {
    let verifySwitch = this.data.verifySwitch;
    let data = {
      deviceControl: 'read', // setup 设置  read 读取
      switch: verifySwitch ? 'start' : 'stop', // start 开启  stop 关闭
      bloodGlucoseValue: this.data.value1
    }
    console.log("data=>", data)
    veepooFeature.veepooSendBloodGlucoseCalibrateModuleDataManager(data);
  },
  stopBloodSixVerify() {
    /* 
    beforeBreakfast
    afterBreakfast
    beforeLunch
    afterLunch
    beforeDinner
    afterDinner
    */
    let data = {
      conSwitch: 'start',
      switch: 'read', // setup 开启 read 关闭
    }
    veepooFeature.veepooSendSixBloodGlucoseCalibrateValueDataManager(data);
  },


  startBloodSixVerify() {
    let data = {
      conSwitch: 'start', // start 开启  stop 关闭
      switch: 'setup', // setup 设置 read 读取
      beforeBreakfast: {
        hour: '07',
        minute: '05',
        bloodGlucoseValue: 8.2 
      },
      afterBreakfast: {
        hour: '10',
        minute: '55',
        bloodGlucoseValue: 8.2  
      },
      beforeLunch: {
        hour: '14',
        minute: '00',
        bloodGlucoseValue: 8.2 
      },
      afterLunch: {
        hour: '15',
        minute: '13',
        bloodGlucoseValue: 9.2 
      },
      beforeDinner: {
        hour: '21',
        minute: '50',
        bloodGlucoseValue: 8.2  
      },
      afterDinner: {
        hour: '21',
        minute: '46',
        bloodGlucoseValue: 8.2 
      }
    }
    // wx.navigateBack()
    veepooFeature.veepooSendSixBloodGlucoseCalibrateValueDataManager(data);
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
      if (e.type) {
        self.setData({
          bloodGlucoseData: e
        })
      }
    })
  },
})