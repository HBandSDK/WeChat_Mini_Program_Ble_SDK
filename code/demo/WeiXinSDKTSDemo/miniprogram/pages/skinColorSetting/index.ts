// pages/skinColorSetting/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    array1: ["肤色类型0", "肤色类型2"], // 根据功能类型  目前只有 0 与 2  1 废弃
    array2: ["档位1", "档位2"], // 肤色类型0  档位1  白人模式   档位2 黑人模式  默认白人模式
    array3: ['档位1', '档位2', '档位3', '档位4', '档位5', '档位6'],// 档位由黑到白 1-6; 6最黑 1最白
    index1: 0,// 肤色类型 数组下表 0 => 值0  下标1 => 值2
    index2: 0,// 档位数组下标
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
  },

  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" 肤色 监听蓝牙回调=>", e);
    })
  },

  bindPickerChange1: function (e: any) {
    console.log("e=>", e.detail.value)
    let array1 = this.data.array1
    this.setData({
      index1: e.detail.value,
    })
  },

  bindPickerChange2: function (e: any) {
    console.log("e=>", e.detail.value)
    let array2 = this.data.array2
    this.setData({
      index2: e.detail.value,
    })
  },

  // 设置肤色
  settingSkinColor() {

    let skinColorType = this.data.index1 === 0 ? 0 : 2; // 肤色类型只有 0 与 2; 
    let level = Number(this.data.index2) + 1;// 肤色档位 

    veepooFeature.veepooSendSkinToneSettingDataManager({
      skinColorType: skinColorType,// 肤色类型
      level: level,// 肤色档位
    })
  }

})

