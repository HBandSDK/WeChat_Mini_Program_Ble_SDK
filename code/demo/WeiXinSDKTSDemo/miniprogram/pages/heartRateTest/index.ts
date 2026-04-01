// pages/heartRateTest/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    heartRate: '--' as string | number,    // 心率值，初始显示为 --
    isMeasuring: false,
    statusMsg: '',      // 状态信息
    errorMsg: ''        // 错误信息
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

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时可以停止监听
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载时停止测量
    if (this.data.isMeasuring) {
      this.heartRateStop();
    }
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("[心率测量] 蓝牙回调=>", e);

      // type 51 为心率测量数据类型
      if (e.type == 51) {
        self.handleHeartRateCallback(e);
      }
    })
  },

  // 处理心率测量回调
  handleHeartRateCallback(e: any) {
    let self = this;
    const content = e.content || {};

    // 1. 优先判断设备是否正忙
    if (content.deviceBusy === true) {
      self.setData({
        isMeasuring: false,
        errorMsg: '设备正忙，请稍后再试',
        statusMsg: ''
      });
      console.log("[心率测量] 设备正忙");
      return;
    }

    // 2. 判断佩戴检测是否通过
    if (content.notWear === true) {
      self.setData({
        isMeasuring: false,
        errorMsg: '佩戴检测未通过，请正确佩戴设备',
        statusMsg: ''
      });
      console.log("[心率测量] 佩戴检测未通过");
      return;
    }

    // 3. 获取心率值并校验有效范围 [30, 250]
    const heartRate = content.heartRate;
    if (typeof heartRate !== 'number' || heartRate < 30 || heartRate > 250) {
      console.log("[心率测量] 心率值无效:", heartRate);
      // 不在有效范围内，过滤该结果
      return;
    }

    // 心率值有效，更新显示
    self.setData({
      heartRate: heartRate,
      isMeasuring: false,
      errorMsg: '',
      statusMsg: '正在测量...'
    });
    console.log("[心率测量] 正在测量...，心率值:", heartRate);
  },

  // 开始心率测量
  heartRateStart() {
    let self = this;

    // 重置状态
    self.setData({
      isMeasuring: true,
      heartRate: '--',
      statusMsg: '正在测量...',
      errorMsg: ''
    });

    // 发送开始心率测量指令
    veepooFeature.veepooSendHeartRateTestSwitchManager({ switch: true });
    console.log("[心率测量] 开始测量");
  },

  // 停止心率测量
  heartRateStop() {
    let self = this;

    self.setData({
      isMeasuring: false,
      statusMsg: ''
    });

    // 发送停止心率测量指令
    veepooFeature.veepooSendHeartRateTestSwitchManager({ switch: false });
    console.log("[心率测量] 停止测量");
  }
})
