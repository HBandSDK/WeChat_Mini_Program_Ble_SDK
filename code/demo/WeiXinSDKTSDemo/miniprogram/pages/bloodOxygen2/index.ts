// pages/bloodOxygen2/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bloodOxygen: '--' as string | number,  // 血氧值，初始显示为 --
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
      this.stopTest();
    }
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("[血氧手动] 蓝牙回调=>", e);

      // type 31 为血氧手动测量数据类型
      if (e.type == 31) {
        self.handleBloodOxygenCallback(e);
      }
    })
  },

  // 处理血氧测量回调
  handleBloodOxygenCallback(e: any) {
    let self = this;
    const content = e.content || {};

    // 1. 优先判断设备是否正忙
    if (content.deviceBusy === true) {
      self.setData({
        isMeasuring: false,
        errorMsg: '设备正忙，请稍后再试',
        statusMsg: ''
      });
      console.log("[血氧手动] 设备正忙");
      return;
    }

    // 2. 判断佩戴检测是否通过
    if (content.notWear === true) {
      self.setData({
        isMeasuring: false,
        errorMsg: '佩戴检测未通过，请正确佩戴设备',
        statusMsg: ''
      });
      console.log("[血氧手动] 佩戴检测未通过");
      return;
    }

    // 3. 获取血氧值并校验有效范围 [70, 100]
    const bloodOxygen = content.bloodOxygen;
    if (typeof bloodOxygen !== 'number' || bloodOxygen < 70 || bloodOxygen > 100) {
      console.log("[血氧手动] 血氧值无效:", bloodOxygen);
      // 不在有效范围内，显示 --
      self.setData({
        bloodOxygen: '--',
        isMeasuring: true,
        errorMsg: '测量值无效',
        statusMsg: ''
      });
      return;
    }

    // 血氧值有效，更新显示
    self.setData({
      bloodOxygen: bloodOxygen,
      isMeasuring: true,
      errorMsg: '',
      statusMsg: '测量中...'
    });
    console.log("[血氧手动] 测量中...，血氧值:", bloodOxygen);
  },

  // 开始血氧测量
  startTest() {
    let self = this;

    // 重置状态
    self.setData({
      isMeasuring: true,
      bloodOxygen: '--',
      statusMsg: '正在测量...',
      errorMsg: ''
    });

    // 发送开始血氧测量指令
    veepooFeature.veepooSendBloodOxygenControlDataManager({ switch: 'start' });
    console.log("[血氧手动] 开始测量");
  },

  // 停止血氧测量
  stopTest() {
    let self = this;

    self.setData({
      isMeasuring: false,
      statusMsg: '',
      errorMsg: ''
    });

    // 发送停止血氧测量指令
    veepooFeature.veepooSendBloodOxygenControlDataManager({ switch: 'stop' });
    console.log("[血氧手动] 停止测量");
  }
})
