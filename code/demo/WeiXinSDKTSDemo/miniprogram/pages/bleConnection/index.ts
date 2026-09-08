// pages/bleConnection/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bleList: [],
    isIOS: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    let self = this;
    wx.getSystemInfo({
      success: function (res) {
        if (res.platform == "ios") {
          self.setData({
            isIOS: true
          })
        }
      }
    });
    this.veepooSDKGetSetting()
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

  },
  onHide() {
    this.StopSearchBleManager()
  },

  veepooSDKGetSetting() {
    let self = this;
    let arr: any = []
    // 获取手机设置状态
    veepooBle.veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice(function (res: any) {
      console.log('res=>', res)
      arr.push(res[0]);
      self.setData({
        bleList: arr.sort((a: any, b: any) => b.RSSI - a.RSSI)
      })
    })
  },
  

  connectionDevice(e: any) {
    let self = this;
    let deviceList = self.data.bleList;
    wx.showLoading({
      title: '连接中'
    })
    this.StopSearchBleManager()
    deviceList.forEach((item: any) => {
      if (item.deviceId == e.currentTarget.dataset.deviceid) {
        wx.setStorageSync('bleInfo', item)
        console.log('传入的bleInfo-item:', item)
        // 连接
        veepooBle.veepooWeiXinSDKConnectionDevice(item, function (result: any) {
          wx.hideLoading()
          console.log("连接的result=>", result)
        })
      }
    })
  },

  connectBle(e: any) {
    let self = this;
    let deviceList = self.data.bleList;
    wx.showLoading({
      title: '连接中'
    })

    this.StopSearchBleManager()

    deviceList.forEach((item: any) => {
      if (item.deviceId == e.currentTarget.dataset.deviceid) {
        console.log("点击连接的设备:",item)
        wx.setStorageSync('bleInfo', item)
        veepooBle.veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager(item, function (result: any) {
          console.log("result=>", result)
          if (result.connection) {
            // 获取当前服务，订阅监听
            self.notifyMonitorValueChange();
            
            setTimeout(() => {
              let data = {
                isPair: true
              }
              wx.setStorageSync('pairData', data);
              veepooFeature.veepooBlePasswordCheckManager(data)
            }, 500);

            let times = setInterval(() => {
              // 设备芯片
              // 当前设备芯片获取状态  （通过调用蓝牙密码核准设置， 获取）
              let deviceChipStatus = wx.getStorageSync('deviceChipStatus')
              console.log("deviceChipStatus===>", deviceChipStatus)
              if (deviceChipStatus) {
                wx.hideLoading()
                wx.redirectTo({
                  url: '/pages/index/index'
                })
                clearInterval(times)
              }
            }, 1000)
          }
        })
      }
    })
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("监听蓝牙回调= 这个是连接页面>", e);
      self.bleDataParses(e)
    })
  },
  // 蓝牙断开监听
  BLEConnectionStateChange() {
    veepooBle.veepooWeiXinSDKBLEConnectionStateChangeManager(function (e: any) {
      console.log("蓝牙断开=>", e)
    })
  },
  // 停止蓝牙搜索
  StopSearchBleManager() {
    veepooBle.veepooWeiXinSDKStopSearchBleManager(function (e: any) {
      console.log("停止蓝牙搜索=>", e)
    })
  },
  // 电量读取
  ElectricQuantityManager() {
    veepooFeature.veepooReadElectricQuantityManager();
  },
  // 读取步数，距离卡路里
  /*
  参数：day:0； 0 今天 1 昨天 2 前天 
   */
  StepCalorieDistanceManager() {
    let data = {
      day: 0
    }
    veepooFeature.veepooReadStepCalorieDistanceManager(data)
  },
  // 监听蓝牙返回数据解析
  bleDataParses(value: any) {
    let content = value;
    console.log("content=>", content)
  }
})