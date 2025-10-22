// pages/manualMeasurement/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
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
    this.notifyMonitorValueChange();
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
    });
  },

  // 读取手动测量
  readManualTestData() {
    // 获取当前时间
    const now = new Date();
    // 创建一个新的日期对象，时间设为今天的 1 点整
    const oneAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 0, 0, 0);
    // 秒级时间戳
    const timestampInSeconds = Math.floor(oneAM.getTime() / 1000);
    console.log('timestampInSeconds==>', timestampInSeconds);
    // dataType 数据类型   0 血压 1 心率 2 血糖 3 压力 4 血氧 5 体温 6 梅拖 7 hrv 8 血液成分 9 微体检 10 情绪 11 疲劳度 12 皮电
    veepooFeature.veepooSendManualMeasurementDataReadManager({
      timestamp: timestampInSeconds,
      dataType: 9
    });

  }
})




