
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// pages/4GService/Index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    switchStatus: false,// 4G开关
    dataUploadSwitch: false,// 4G上传开关
    accountStatus: false,// 账号是否有效
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

  read4GService() {

    veepooFeature.veepooRead4GServiceDataManager();
  },


  setup4GService() {

    // 参数可选，
    veepooFeature.veepooSetup4GServiceInfoManager({
      ipAddress: "vphband.com", // ip地址
      port: 34421, // 端口 
      userName: "你丫的我绑定账号了", // 用户名
      password: "PdbGqvN2BhOpYDtiCxiLNA==", // 密码
      // switch: 1, // 开关  0 关闭 1 开启
      // dataUploadSwitch: 1, // 数据上传开关 0 关闭 1 开启
      // uploadInterval: 10, // 上传间隔 分钟
      // accountStatus: 1, // 账号是否有效 0 无效 1 有效
    });
  },

  // 更新用户名称
  setup4GUserName() {
    veepooFeature.veepooSetup4GServiceInfoManager({
      userName: `绑定了账号${Math.floor(1000 + Math.random() * 9000)}`, // 用户名
    })
  },

  // 更新ip地址
  setup4GIpAddress(){
    veepooFeature.veepooSetup4GServiceInfoManager({
      ipAddress: "vpgband.com", // ip地址
    })
  },

  // 端口
  setup4GPort(){
    veepooFeature.veepooSetup4GServiceInfoManager({
      port: 34425, // 端口 
    })
  },

  // 密码
  setup4GPassword(){
    veepooFeature.veepooSetup4GServiceInfoManager({
      password: "AdcGqvN2BhOpYDtiCxiLNA==", // 密码
    })
  },

  // 
  bindSwitchChange(e: any) {
    let self = this;
    console.log("e=>", e);
    self.setData({
      switchStatus: e.detail.value
    })
  },

  // 
  bindUploadSwitchChange(e: any) {
    let self = this;
    console.log("e=>", e);
    self.setData({
      dataUploadSwitch: e.detail.value
    })
  },

  // 4G开关设置
  setup4GSwitch() {
    let self = this;
    veepooFeature.veepooSetup4GServiceInfoManager({
      switch: self.data.switchStatus ? 1 : 0,// 0 关闭 1 开启 
    })
  },

  // 4G上传开关设置
  setup4GUploadSwitch() {
    let self = this;
    veepooFeature.veepooSetup4GServiceInfoManager({
      dataUploadSwitch: self.data.dataUploadSwitch ? 1 : 0,// 0 关闭 1 开启 
    })
  },

  bindAccountStatusChange(e: any) {
    let self = this;
    console.log("e=>", e);
    self.setData({
      accountStatus: e.detail.value
    })
  },

  // 

  // 4G账号是否有效
  setup4GAccountStatus() {
    let self = this;
    veepooFeature.veepooSetup4GServiceInfoManager({
      accountStatus: self.data.accountStatus ? 1 : 0,// 0 关闭 1 开启 
    })
  },

  // 4G服务间隔设置 
  setup4GServiceInterval() {
    veepooFeature.veepooSetup4GServiceInfoManager({
      uploadInterval: 30,// 
    })
  },

  // 设置时间戳相关
  setup4GTimeStamp() {
    veepooFeature.veepooSetup4GServiceInfoManager({
      lastTimeStamp: 1767606251,//  APP或设备最后一次同步服务器的时间戳  秒级
      restoreTimeStamp: 1767839964,
    })
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" ss 监听蓝牙回调=>", e);
    })
  },
})