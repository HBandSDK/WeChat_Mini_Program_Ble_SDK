// pages/ecgTest/index.js

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
import { ab2hex } from '../../utils/util'
let totalArray: any = []
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // let data = {
    //   status: true  // true 开启原始数据输出   false 关闭原始数据输出
    // }
    // veepooBle.veepooWeiXinSDKRawDataShowStatus(data);
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
  // 无参数
  ECGmeasureStartDataManager() {
    veepooFeature.veepooSendECGmeasureStartDataManager();
  },
  ECGmeasureStopDataManager() {
    veepooFeature.veepooSendECGmeasureStopDataManager();
  },
  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyECGValueChange(function (e: any) {
      console.log(" ECG 监听蓝牙回调=>", e);
      if (e.name == 'ecg测量') {
        console.log("========================================================")
        self.setData({
          device: e
        })

        if (e.progress == 100) {
          console.log("totalArray=>", totalArray)
        }


      } else if (e.name == 'ecg波形数据') {
        totalArray.push(...e.content)
      }
    })
  },
})