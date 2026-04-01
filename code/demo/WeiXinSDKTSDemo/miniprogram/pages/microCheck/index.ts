// pages/microCheck/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isMeasuring: false,
    progress: 0,
    // 微体检数据
    microCheckData: {
      heartRate: 0,        // 心率
      bloodOxygen: 0,      // 血氧
      pressure: 0,         // 压力
      emotion: 0,          // 情绪
      fatigueLevel: 0,     // 疲劳度
      bloodSugar: 0,       // 血糖
      bodyTemperature: 0,  // 体温
      highPressure: 0,     // 高压
      lowPressure: 0,      // 低压
      hrv: 0               // HRV
    },
    hasResult: false,      // 是否有测量结果
    errorMsg: ''           // 错误信息
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
    // 【排查日志】打印系统信息，区分平台
    const systemInfo = wx.getSystemInfoSync();
    console.log("[微体检] ========== 页面显示 ==========");
    console.log("[微体检] 系统信息:", JSON.stringify({
      platform: systemInfo.platform,
      system: systemInfo.system,
      brand: systemInfo.brand,
      model: systemInfo.model,
      SDKVersion: systemInfo.SDKVersion
    }));

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
      this.microCheckStop();
    }
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    console.log("[微体检] 开始注册蓝牙监听回调");

    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("[微体检] 蓝牙回调触发，原始数据:", JSON.stringify(e));
      console.log("[微体检] e.type:", e?.type, "e.dataType:", e?.dataType);

      // 检查数据是否有效
      if (!e || e.type === undefined) {
        console.warn("[微体检] 数据无效: e不存在或type未定义");
        return;
      }
      // type 53 为微体检测量数据类型
      if (e.type == 53) {
        console.log("[微体检] type=53，进入微体检处理");
        self.handleMicroCheckCallback(e);
      }
      // 其他类型数据忽略（由其他页面处理）
    })
  },

  // 处理微体检测量回调
  handleMicroCheckCallback(e: any) {
    let self = this;

    // 检查数据有效性
    if (!e) {
      console.warn("[微体检] 收到空数据");
      return;
    }

    // 【排查日志】打印完整回调数据
    console.log("[微体检] 完整回调数据:", JSON.stringify(e));
    console.log("[微体检] dataType:", e.dataType, "progress:", e.progress, "type:", e.type);

    // control: 1 开启 2 关闭
    // dataType: 0 进度包 1 测量成功报告数据 2 测量失败无结果数据 3 设备正忙 4 设备低电
    const dataType = e.dataType;
    const progress = e.progress || 0;

    switch (dataType) {
      case 0:
        // 进度包
        self.setData({
          progress: progress
        });
        console.log("微体检测量进度:", progress);
        break;

      case 1:
        // 测量成功报告数据
        const content = e.content || {};
        self.setData({
          isMeasuring: false,
          hasResult: true,
          progress: 100,
          microCheckData: {
            heartRate: content.heartRate || 0,
            bloodOxygen: content.bloodOxygen || 0,
            pressure: content.pressure || 0,
            emotion: content.emotion || 0,
            fatigueLevel: content.fatigueLevel || 0,
            bloodSugar: content.bloodSugar || 0,
            bodyTemperature: content.bodyTemperature || 0,
            highPressure: content.highPressure || 0,
            lowPressure: content.lowPressure || 0,
            hrv: content.hrv || 0
          }
        });
        console.log("微体检测量完成:", content);
        break;

      case 2:
        // 测量失败无结果数据
        self.setData({
          isMeasuring: false,
          hasResult: false,
          errorMsg: '测量失败，无结果数据'
        });
        console.log("微体检测量失败");
        break;

      case 3:
        // 设备正忙
        self.setData({
          isMeasuring: false,
          hasResult: false,
          errorMsg: '设备正忙，请稍后再试'
        });
        console.log("设备正忙");
        break;

      case 4:
        // 设备低电
        self.setData({
          isMeasuring: false,
          hasResult: false,
          errorMsg: '设备电量低，请充电后再试'
        });
        console.log("设备低电");
        break;

      default:
        break;
    }
  },

  // 获取情绪描述
  getEmotionText(emotion: number): string {
    if (emotion >= -10 && emotion <= -5) {
      return '情绪低落';
    } else if (emotion > -5 && emotion <= -2) {
      return '有些低落';
    } else if (emotion > -2 && emotion <= 2) {
      return '情绪平稳';
    } else if (emotion > 2 && emotion <= 5) {
      return '情绪较好';
    } else if (emotion > 5 && emotion <= 10) {
      return '情绪很好';
    }
    return '未知';
  },

  // 获取疲劳度描述
  getFatigueText(fatigue: number): string {
    if (fatigue >= 0 && fatigue <= 2) {
      return '精力充沛';
    } else if (fatigue > 2 && fatigue <= 4) {
      return '轻度疲劳';
    } else if (fatigue > 4 && fatigue <= 6) {
      return '中度疲劳';
    } else if (fatigue > 6 && fatigue <= 8) {
      return '重度疲劳';
    } else if (fatigue > 8) {
      return '极度疲劳';
    }
    return '未知';
  },

  // 开始微体检测量
  microCheckStart() {
    let self = this;

    // 【排查日志】打印设备信息
    const bleInfo = wx.getStorageSync('bleInfo');
    console.log("[微体检] 当前蓝牙设备信息:", JSON.stringify(bleInfo));
    console.log("[微体检] 设备芯片类型 deviceChip:", bleInfo?.deviceChip);

    // 重置数据
    self.setData({
      isMeasuring: true,
      hasResult: false,
      progress: 0,
      errorMsg: '',
      microCheckData: {
        heartRate: 0,
        bloodOxygen: 0,
        pressure: 0,
        emotion: 0,
        fatigueLevel: 0,
        bloodSugar: 0,
        bodyTemperature: 0,
        highPressure: 0,
        lowPressure: 0,
        hrv: 0
      }
    });

    // 发送开始微体检测量指令
    console.log("[微体检] 发送开始测量指令...");
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'start' });
    console.log("[微体检] 开始测量指令已发送，等待蓝牙回调...");
  },

  // 停止微体检测量
  microCheckStop() {
    let self = this;
    self.setData({
      isMeasuring: false
    });

    // 发送停止微体检测量指令
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'stop' });
    console.log("停止微体检测量");
  }
})
