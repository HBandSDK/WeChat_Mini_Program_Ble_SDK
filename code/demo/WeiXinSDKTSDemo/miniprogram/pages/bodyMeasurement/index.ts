// pages/bodyMeasurement/index.js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    deviceIdList: []
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
    this.notifyMonitorValueChange();

  },
  // 开始检测
  BodyCompositionTestStartDataManager() {
    veepooFeature.veepooSendBodyCompositionTestStartDataManager();
  },
  // 关闭检测
  BodyCompositionTestStopDataManager() {
    veepooFeature.veepooSendBodyCompositionTestStopDataManager()
  },
  // 获取成分数据ID
  startGetDataId() {
    veepooFeature.veepooSendReadBodyCompositionTestIdDataManager()
  },
  // 根据ID获取数据
  dataIdGetData() {
    let self = this;
    let deviceIdList: any = this.data.deviceIdList[0];
    console.log("deviceIdList=>", deviceIdList)
    let data = {
      dataId: deviceIdList.dataId
    }
    veepooFeature.veepooSendBodyCompositionIdReadDataManager(data)
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("身体成分 监听蓝牙回调=>", e);
      if (e.type == 32) {
        if (e.name == '身体成分检测') {
          self.setData({
            device: e
          })
        } else if (e.name == '根据Id获取身体成分数据') {
          self.setData({
            device: e
          })
        } else if (e.name == '身体成分读取测量保存的数据ID') {
          self.setData({
            deviceIdList: e.content
          })
        }
      }

    })
  },

})