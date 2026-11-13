import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// pages/b3AutoTestFeature/b3AutoTestFeature.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 功能类型：0 脉率、1 血压、2 血糖、3 压力、4 血氧、5 体温、6 洛伦兹散点图、7 HRV、8 血液成分
    typeNames: ['脉率(心率、科学睡眠)', '血压', '血糖', '压力', '血氧', '体温', '洛伦兹散点图', 'HRV', '血液成分'],
    index: 0,
    intervalList: [5, 10, 30, 60, 120, 180], // 检测间隔，单位：分钟
    intervalIndex: 3, // 默认 60 分钟
    startTime: '00:00', // 当前测试时间段-开始
    stopTime: '00:00', // 当前测试时间段-结束
    sleepChecked: false, // 科学睡眠（脉率）开关
    switch2Checked: false
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

  switch2Change(e: any) {
    console.log('开关e==>', e);

    this.setData({
      switch2Checked: e.detail.value
    })

  },

  bindPickerChange(e: any) {
    console.log('e=>', e);

    this.setData({
      index: Number(e.detail.value)
    })
  },

  // 检测间隔切换
  bindIntervalChange(e: any) {
    this.setData({
      intervalIndex: Number(e.detail.value)
    })
  },

  // 开始时间选择
  bindStartTimeChange(e: any) {
    this.setData({
      startTime: e.detail.value
    })
  },

  // 结束时间选择
  bindEndTimeChange(e: any) {
    this.setData({
      stopTime: e.detail.value
    })
  },

  // 科学睡眠：开关只控制开启/关闭，不直接下发
  sleepChange(e: any) {
    this.setData({
      sleepChecked: e.detail.value
    })
  },

  // 科学睡眠：点击按钮才下发指令
  // 关键：检测间隔必须为 0，开始时间与结束时间必须相等（连续 24 小时）
  sleepSetup() {
    const on = this.data.sleepChecked;
    veepooFeature.veepooSendSetupB3AutoTestFeatureDataManager({
      "p_protocol_type": 0,// 不可修改
      "p_fun_type_content": 0,// 0 = 脉率，开启脉率即开启科学睡眠
      "p_fun_switch": on ? 1 : 0,// 1 开启 0 关闭
      "p_step_unit": 30,
      "p_time_slot_modify": 1,// 不可修改
      "p_time_interval_modify": 1,// 不可修改
      "p_support_time_slot": { // 不可修改
        "startTime": "00:00",
        "stopTime": "00:00"
      },
      "p_meas_inv": 0,// 科学睡眠检测间隔必须为 0
      "p_cur_time_slot": { // 开始时间与结束时间相等，形成连续 24 小时
        "startTime": "00:00",
        "stopTime": "00:00"
      }
    })
  },
  startRead() {
    console.log('开始读取');
    veepooFeature.veepooSendReadB3AutoTestFeatureDataManager();
  },


  startSetup() {
    // 开始设置
    veepooFeature.veepooSendSetupB3AutoTestFeatureDataManager({
      "p_protocol_type": 0,// 不可修改
      "p_fun_type_content": this.data.index,// 功能类型 0~8数据对应 脉率、血压、血糖、压力、血氧、体温、洛伦兹散点图、HRV、血液成分  可修改
      "p_fun_switch": this.data.switch2Checked ? 1 : 0,// 0 关闭 1 开启  可修改
      "p_step_unit": 30,// 支持最小的步进，分 不可修改
      "p_time_slot_modify": 1,// 不可修改
      "p_time_interval_modify": 1,// 不可修改
      "p_support_time_slot": { // 支持测试的时间段  不可修改
        "startTime": "00:00",// 开始时间  
        "stopTime": "00:00"// 结束时间  
      },
      "p_meas_inv": this.data.intervalList[this.data.intervalIndex],// 测量间隔 可修改  根据p_step_unit 大小  如30，那么间隔30
      "p_cur_time_slot": { // 当前的测试时间段 可修改
        "startTime": this.data.startTime,// 开始时间
        "stopTime": this.data.stopTime// 结束时间
      }
    })
  },

  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调=>", e);
    })
  },

})
