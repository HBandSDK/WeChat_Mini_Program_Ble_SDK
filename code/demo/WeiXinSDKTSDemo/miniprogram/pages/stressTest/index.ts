// pages/stressTest/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    stress: 0,
    stressLevel: '',
    isMeasuring: false
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
      this.stressStop();
    }
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("压力测量监听蓝牙回调=>", e);
      // type 52 为压力测量数据类型（根据实际SDK文档调整）
      if (e.type == 52) {
        let stressValue = e.content.stress || 0;
        let stressLevelText = self.getStressLevelText(stressValue);

        self.setData({
          stress: stressValue,
          stressLevel: stressLevelText
        })
      } else if (e.type == 53) {
        // 压力测量进度回调
        console.log("压力测量进度:", e.content);
      } else if (e.type == 54) {
        // 压力测量完成回调
        self.setData({
          isMeasuring: false
        })
        console.log("压力测量完成");
      }
    })
  },

  // 根据压力值获取压力等级描述
  getStressLevelText(stress: number): string {
    if (stress >= 0 && stress <= 20) {
      return '放松';
    } else if (stress > 20 && stress <= 40) {
      return '正常';
    } else if (stress > 40 && stress <= 60) {
      return '中等';
    } else if (stress > 60 && stress <= 80) {
      return '偏高';
    } else if (stress > 80 && stress <= 100) {
      return '很高';
    }
    return '未知';
  },

  // 开始压力测量
  stressStart() {
    let self = this;
    self.setData({
      isMeasuring: true,
      stress: 0,
      stressLevel: ''
    })

    // 发送开始压力测量指令
    // API: veepooSendPressureTestManager (根据SDK文档)
    veepooFeature.veepooSendPressureTestManager({ switch: true })
    console.log("开始压力测量");
  },

  // 停止压力测量
  stressStop() {
    let self = this;
    self.setData({
      isMeasuring: false
    })

    // 发送停止压力测量指令
    veepooFeature.veepooSendPressureTestManager({ switch: false })
    console.log("停止压力测量");
  },

  // 读取历史压力数据
  readStressHistory() {
    // 读取历史压力数据
    veepooFeature.veepooSendReadStressDataManager()
    console.log("读取历史压力数据");
  }
})
