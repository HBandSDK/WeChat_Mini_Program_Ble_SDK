// pages/universalBlood/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: null,
    progress: 0
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

  stopTest() {
    let self = this;
    let data = {
      switch: 'stop',
    }
    veepooFeature.veepooSendBloodOxygenControlDataManager(data);
  },

  // 读取测量模式开关状态
  readTestModeSwitchState() {

    veepooFeature.veepooReadTestModeSwitchStateDataManager();
  },

  // 设置测量模式开关状态
  setupTestModeSwitchState() {
    let data = {
      state: 2,
    }
    veepooFeature.veepooSetupTestModeOneSwitchStateDataManager(data);
  },

  // 读取原始数据
  readOrigData() {
    let self = this;

    // 获取当前时间
    const now = new Date();
    // 创建一个新的日期对象，时间设为今天的 1 点整
    const oneAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // 秒级时间戳
    const timestampInSeconds = Math.floor(oneAM.getTime() / 1000);

    let data = {
      mode: 1,
      timeStamp: timestampInSeconds
    }

    console.log("data===>", data);

    veepooFeature.veepooReadTestModeOrigDataManager(data);
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {

    let self = this;

    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);

      if (!e) {

        return
      }

      self.setData({
        device: e,
        progress: e.progress
      })
    });

  },
})