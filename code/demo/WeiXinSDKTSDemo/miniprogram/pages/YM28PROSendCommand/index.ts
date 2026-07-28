// pages/YM28PROSendCommand/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bloodPressureSwitch: 'close',
    dayTimeGap: 10,
    nightTimeGap: 10,
    nightRangeStartTime: '11:45',
    nightRangeEndTime: '14:19',
    index: 1,
    bloodPressureSwitchArray: ['open', 'close'],
    content: {},
    SNCode: '',
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
    let timestamp = Date.now();
    let date = new Date(timestamp);
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    this.setData({
      nightRangeStartTime: `${hours}:${minutes}`,
      nightRangeEndTime: `${hours}:${minutes}`
    })

    this.notifyMonitorValueChange();
  },


  // 读取当前设备数据情况
  readCurrentDevState() {
    console.log('触发了读取当前设备数据情况')
    let data = {
      switch: 'read'
    }
    veepooFeature.veepooSetupSendYM28PROCommandManager(data);
  },

  // 下发数据
  setupCommandData() {
    console.log('触发下发数据操作')
    let data = {
      switch: 'setup',
      content: {
        bloodPressureSwitch: this.data.bloodPressureSwitchArray[this.data.index],
        dayTimeGap: this.data.dayTimeGap,
        nightTimeGap: this.data.nightTimeGap,
        nightRangeStartTime: this.data.nightRangeStartTime,
        nightRangeEndTime: this.data.nightRangeEndTime,
      }
    }
    console.log('下发数据传入参数=>', data.content);
    veepooFeature.veepooSetupSendYM28PROCommandManager(data);
  },

  // 读取SN码
  readSNCode() {
    console.log('触发读取SN码操作')
    let data = {
      switch: 'readSN'
    }
    veepooFeature.veepooSetupSendYM28PROCommandManager(data);
  },


  // 选择血压开关模式
  bindPickerChange1: function (e: any) {
    console.log('picker1发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value,
    })
  },
  // 夜间范围开始时间选择
  bindPickerChange2: function (e: any) {
    console.log('picker2发送选择改变，携带值为', e.detail.value)
    this.setData({
      nightRangeStartTime: e.detail.value
    })
  },
  // 夜间范围结束时间选择
  bindPickerChange3: function (e: any) {
    console.log('picker3发送选择改变，携带值为', e.detail.value)
    this.setData({
      nightRangeEndTime: e.detail.value
    })
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let that = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" YM28PRO设置数据读取及下发 监听蓝牙回调=>", e);
      if (e.type == 58) {
        if (e.control == '1' || e.control == '2') {
          that.setData({
            content: e.content,
          })
        } else if (e.control == '3') {
          that.setData({
            SNCode: e.SNCode,
          })
        }
      }
    })
  },

  // 获取白天时间间隔
  inputChange(e: any) {
    console.log('e=>', e)
    this.setData({
      dayTimeGap: Number(e.detail.value)
    })
  },

  // 获取夜间时间间隔
  inputChange1(e: any) {
    console.log('e=>', e)
    this.setData({
      nightTimeGap: Number(e.detail.value)
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})