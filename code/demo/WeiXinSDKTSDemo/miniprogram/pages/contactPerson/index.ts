// pages/contactPerson/index.js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    readList: [],
    sos: false,
    phone: '',
    name: '',
    delId: '',
    fromId: '',
    toId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
    this.notifyMonitorValueChange()
  },
  ReadContactPersonDataManager() {

    veepooFeature.veepooSendReadContactPersonDataManager();
  },
  SettingContactPersonDataManager() {
    let readList = this.data.readList;
    console.log("readList=>", readList.length + 1)

    // 注意：添加联系人，已有的联系人id 假设是1  那么在添加一个联系人的contactNumber 应该传入2

    let data = {
      contactNumber: readList.length,
      name: this.data.name,
      phone: this.data.phone,
      sos: this.data.sos,// 设置为紧急联系人 
    }
    console.log("data=>", data)
    if (!data.phone && !data.name) {
      wx.showToast({
        title: '填写手机号或名称',
        icon: 'none'
      })
      return
    }
    veepooFeature.veepooSendSettingContactPersonDataManager(data)

    setTimeout(() => {
      veepooFeature.veepooSendReadContactPersonDataManager();
    }, 1000);
  },
  deleteId(e: any) {
    let delId = e.detail.value;
    this.setData({
      delId
    })
  },

  deleteContactPersonDataManager() {
    let data = {
      sosId: this.data.delId
    }
    veepooFeature.veepooSendDeleteContactPersonDataManager(data);
    setTimeout(() => {
      veepooFeature.veepooSendReadContactPersonDataManager();
    }, 1000);
  },
  AdjustContactPersonDataManager() {
    let readList = this.data.readList;
    console.log('readList.length=>', readList.length)
    if (readList.length == 1) {
      wx.showToast({
        title: '请先添加更多的联系人',
        icon: 'none'
      })
      return
    }
    let data = {
      fromId: this.data.fromId, // 需要调整的id
      toId: this.data.toId // 目标位置id
    }
    veepooFeature.veepooSendAdjustContactPersonDataManager(data)
    setTimeout(() => {
      veepooFeature.veepooSendReadContactPersonDataManager();
    }, 1000);
  },
  getFromId(e: any) {
    let fromId = e.detail.value;
    this.setData({
      fromId
    })
  },
  getToId(e: any) {
    let toId = e.detail.value;
    this.setData({
      toId
    })
  },
  getSOS(e: any) {
    let sos = e.detail.value;
    this.setData({
      sos
    })
  },

  getPhone(e: any) {
    let phone = e.detail.value;
    this.setData({
      phone
    })
  },
  getName(e: any) {
    let name = e.detail.value;
    this.setData({
      name
    })
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" 读取联系人 监听蓝牙回调=>", e);
      if (e.name == '读取联系人') {
        self.setData({
          readList: e.content
        })
      }
    })
  },
});