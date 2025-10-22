import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// pages/b3AutoTestFeature/b3AutoTestFeature.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    array: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    index: 0,
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
      index: e.detail.value
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
      "p_meas_inv": 60,// 测量间隔 可修改  根据p_step_unit 大小  如30，那么间隔30
      "p_cur_time_slot": { // 当前的测试时间段 可修改
        "startTime": "00:00",// 开始时间
        "stopTime": "00:00"// 结束时间
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