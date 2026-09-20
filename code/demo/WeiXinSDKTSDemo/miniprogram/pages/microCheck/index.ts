// pages/microCheck/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// 非成功状态提示文案（2失败 3设备忙 4低电 6佩戴未通过 7导联脱落）
const STATE_TIPS: Record<number, string> = {
  2: '测量失败，无结果数据',
  3: '设备正忙，正在测其它数据，请稍后再试',
  4: '设备电量低，请充电后再试',
  6: '佩戴未通过，请调整佩戴姿势',
  7: 'ECG导联脱落，请重新佩戴'
}

// 身体成分字段展示配置（设备返回哪些就展示哪些）
const BODY_COMPOSITION_FIELDS: { key: string; label: string }[] = [
  { key: 'bmi', label: 'BMI' },
  { key: 'bodyFatRate', label: '体脂率(%)' },
  { key: 'fatMass', label: '脂肪量(kg)' },
  { key: 'leanBodyMass', label: '去脂体重(kg)' },
  { key: 'muscleRate', label: '肌肉率(%)' },
  { key: 'muscleMass', label: '肌肉量(kg)' },
  { key: 'subcutaneousFat', label: '皮下脂肪(%)' },
  { key: 'bodyWater', label: '体内水分(%)' },
  { key: 'waterContent', label: '含水量(%)' },
  { key: 'skeletalMuscleRate', label: '骨骼肌率(%)' },
  { key: 'boneMass', label: '骨量(kg)' },
  { key: 'proteinRate', label: '蛋白质占比(%)' },
  { key: 'proteinMass', label: '蛋白质量(kg)' },
  { key: 'basalMetabolicRate', label: '基础代谢率(kcal)' }
]

// 空报告：字段为空时页面显示 --
const createEmptyReport = () => ({
  heartRate: undefined as any,       // 心率
  bloodOxygen: undefined as any,     // 血氧
  pressure: undefined as any,        // 压力
  hrv: undefined as any,             // HRV
  bloodPressure: undefined as any,   // 血压 120/80
  bodyTemperature: undefined as any, // 体温
  bloodSugar: undefined as any,      // 血糖
  emotion: undefined as any,         // 情绪
  fatigueLevel: undefined as any,    // 疲劳度
  basicInfoList: [] as any[],        // 个人基本信息
  skinList: [] as any[],             // 皮电
  bloodComponentList: [] as any[],   // 血液成分
  bodyCompositionList: [] as any[]   // 身体成分
})

// dataType=5 报告可能分包上报（current/total），缓存已收到的 content，收齐后合并展示
let pendingReportContent: any = null

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isMeasuring: false,
    progress: 0,
    liveHeartRate: 0,   // 测量中每秒心率（type 51）
    hasResult: false,   // 是否已出报告
    errorMsg: '',       // 失败/忙/低电提示
    measuringTip: '',   // 测量中状态提示（佩戴未通过/导联脱落）
    report: createEmptyReport()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.notifyMonitorValueChange();
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

    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      if (!e || e.type === undefined) {
        return;
      }
      // type 53 微体检测量（进度/报告/各种状态）
      if (e.type == 53) {
        console.log("[微体检] 回调:", e);
        self.handleMicroCheckCallback(e);
      }
      // type 51 每秒心率，测量中实时显示
      else if (e.type == 51 && self.data.isMeasuring && e.content) {
        self.setData({ liveHeartRate: e.content.heartRate || 0 });
      }
      // type 54 ppg 原始数据，本页不绘制波形，忽略
    })
  },

  // 处理微体检测量回调（type 53）
  // dataType: 0进度 1成功报告(平铺) 2失败 3设备忙 4低电 5成功报告 6佩戴未通过 7导联脱落
  handleMicroCheckCallback(e: any) {
    const dataType = e.dataType;

    // 0 进度 / 6 佩戴未通过 / 7 导联脱落：测量仍在进行
    if (dataType === 0 || dataType === 6 || dataType === 7) {
      this.setData({
        isMeasuring: true,
        progress: e.progress || 0,
        measuringTip: STATE_TIPS[dataType] || ''
      });
      return;
    }

    // 2 失败 / 3 设备忙 / 4 低电：结束测量
    if (dataType === 2 || dataType === 3 || dataType === 4) {
      pendingReportContent = null;
      this.setData({
        isMeasuring: false,
        hasResult: false,
        progress: 0,
        measuringTip: '',
        errorMsg: STATE_TIPS[dataType] || ''
      });
      return;
    }

    // 1 成功报告
    if (dataType === 1) {
      this.showReport(e.content || {});
      return;
    }

    // 5 成功报告
    if (dataType === 5) {
      pendingReportContent = Object.assign({}, pendingReportContent, e.content || {});
      const total = Number(e.total) || 1;
      const current = Number(e.current) || 1;
      if (current >= total) {
        const content = pendingReportContent;
        pendingReportContent = null;
        this.showReport(content);
      }
    }
  },

  // 测量成功，归一化并展示报告
  showReport(content: any) {
    this.setData({
      isMeasuring: false,
      hasResult: true,
      progress: 100,
      errorMsg: '',
      measuringTip: '',
      liveHeartRate: 0,
      report: this.buildReport(content)
    });
  },


  buildReport(content: any) {
    const c = content || {};

    // 血压：05 光电优先、其次气泵；01 为平铺字段
    const optical = c.opticalBloodPressure;
    const pump = c.pumpBloodPressure;
    const bp = optical || pump;
    let bloodPressure;
    if (bp) {
      bloodPressure = bp.highPressure + '/' + bp.lowPressure;
    } else if (c.highPressure !== undefined || c.lowPressure !== undefined) {
      bloodPressure = c.highPressure + '/' + c.lowPressure;
    }

    // 体温：05 为 {rawTemperature, bodyTemperature}，01 为数值
    let bodyTemperature;
    if (c.bodyTemperature !== undefined) {
      bodyTemperature = typeof c.bodyTemperature === 'object' ? c.bodyTemperature.bodyTemperature : c.bodyTemperature;
    }

    // 血糖：05 为 {displayType, value}，01 为数值(mmol/L)
    let bloodSugar;
    if (c.bloodSugar !== undefined) {
      if (typeof c.bloodSugar === 'object') {
        bloodSugar = c.bloodSugar.displayType === 'level' ? ('等级 ' + c.bloodSugar.value) : c.bloodSugar.value;
      } else {
        bloodSugar = c.bloodSugar;
      }
    }

    // 情绪/疲劳度：描述 + 数值
    const emotion = c.emotion !== undefined ? (this.getEmotionText(c.emotion) + '(' + c.emotion + ')') : undefined;
    const fatigueLevel = c.fatigueLevel !== undefined ? (this.getFatigueText(c.fatigueLevel) + '(' + c.fatigueLevel + ')') : undefined;

    // 个人基本信息（仅 05 报告有）
    const basicInfoList: any[] = [];
    if (c.basicInfo) {
      basicInfoList.push({ label: '性别', value: c.basicInfo.gender === 'male' ? '男' : '女' });
      basicInfoList.push({ label: '年龄(岁)', value: c.basicInfo.age });
      basicInfoList.push({ label: '身高(cm)', value: c.basicInfo.height });
      basicInfoList.push({ label: '体重(kg)', value: c.basicInfo.weight });
    }

    // 皮电（仅 05 报告有）
    const skinList: any[] = [];
    if (c.skinElectrical) {
      const s = c.skinElectrical;
      const riskText = ['低', '中', '高'];
      skinList.push({ label: '情绪', value: this.getEmotionText(s.emotion) + '(' + s.emotion + ')' });
      skinList.push({ label: '皮肤含水量(%)', value: s.skinMoisture });
      skinList.push({ label: '抑郁症风险', value: riskText[s.depressionRisk] !== undefined ? riskText[s.depressionRisk] : s.depressionRisk });
      skinList.push({ label: '交感神经活跃度', value: s.snsActivation });
      skinList.push({ label: '皮质醇(ug/L)', value: s.cortisol });
    }

    // 血液成分（仅 05 报告有）
    const bloodComponentList: any[] = [];
    if (c.bloodComponent) {
      const b = c.bloodComponent;
      bloodComponentList.push({ label: '尿酸(μmol/L)', value: b.uricAcid });
      bloodComponentList.push({ label: '总胆固醇(mmol/L)', value: b.cholesterol });
      bloodComponentList.push({ label: '甘油三酯(mmol/L)', value: b.triglyceride });
      bloodComponentList.push({ label: '高密度脂蛋白(mmol/L)', value: b.highDensityLipoprotein });
      bloodComponentList.push({ label: '低密度脂蛋白(mmol/L)', value: b.lowDensityLipoprotein });
    }

    // 身体成分（仅 05 报告有，字段按设备支持情况返回）
    const bodyCompositionList: any[] = [];
    if (c.bodyComposition) {
      for (let i = 0; i < BODY_COMPOSITION_FIELDS.length; i++) {
        const f = BODY_COMPOSITION_FIELDS[i];
        const v = c.bodyComposition[f.key];
        if (v !== undefined) {
          bodyCompositionList.push({ label: f.label, value: v });
        }
      }
    }

    return {
      heartRate: c.heartRate,
      bloodOxygen: c.bloodOxygen,
      pressure: c.pressure,
      hrv: c.hrv,
      bloodPressure: bloodPressure,
      bodyTemperature: bodyTemperature,
      bloodSugar: bloodSugar,
      emotion: emotion,
      fatigueLevel: fatigueLevel,
      basicInfoList: basicInfoList,
      skinList: skinList,
      bloodComponentList: bloodComponentList,
      bodyCompositionList: bodyCompositionList
    };
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
    pendingReportContent = null;

    // 重置数据
    this.setData({
      isMeasuring: true,
      hasResult: false,
      progress: 0,
      errorMsg: '',
      measuringTip: '',
      liveHeartRate: 0,
      report: createEmptyReport()
    });

    // 发送开始微体检测量指令
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'start' });
  },

  // 停止微体检测量
  microCheckStop() {
    this.setData({
      isMeasuring: false
    });

    // 发送停止微体检测量指令
    veepooFeature.veepooSendMicroCheckDataManager({ switch: 'stop' });
  }
})
