// pages/ecgTest/index.js

import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
import { ab2hex } from '../../utils/util'
let totalArray: any = []

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    list: [],
    // list: [],
    height: 300,
    width: 5000,
    centerY: 240 // y轴中心作为绘画点，
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

    this.drawCurve();
    let data = veepooFeature.veepooGetDiseaseTextManager({
      heartRate: 77,
      diseaseResult: [0, 0, 0, 0, 0, 0, 0, 0]
    });

    console.log('data==>', data);
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.notifyMonitorValueChange();
  },
  // 无参数
  ECGmeasureStartDataManager() {
    this.notifyMonitorValueChange();
    veepooFeature.veepooSendECGmeasureStartDataManager();
  },
  ECGmeasureStopDataManager() {
    veepooFeature.veepooSendECGmeasureStopDataManager();
  },
  // 监听订阅 notifyMonitorValueChange
  //  veepooWeiXinSDKNotifyECGValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {

      console.log(" ECG 监听蓝牙回调=>", e);
      if (e.name == 'ecg测量') {
        console.log("========================================================")
        self.setData({
          device: e
        })

        if (e.progress == 100) {
          console.log("totalArray=>", totalArray)
          self.setData({
            list: totalArray
          })
          self.drawCurve();
        }
      }
    })
    // 这里主要是获取的是波形的数据 为
    veepooBle.veepooWeiXinSDKNotifyECGValueChange(function (e: any) {
      if (e.name == 'ecg波形数据') {
        totalArray.push(...e.content)
        console.log('ecg波形数据', e.content)
      }
    })
  },



  drawCurve: function () {

    let ctx = wx.createCanvasContext('myCanvas', this)
    let list = this.data.list;
    console.log("list==>", list)
    let centerY = this.data.centerY;
    let width = this.data.width;
    let xScale = width / (list.length - 1); // 计算每个数据点占据的宽度
    let yScale = centerY / (Math.max(...list) - Math.min(...list))
    let x = 0;
    let y = centerY / 2 - (list[0] * yScale)
    ctx.beginPath();// 开始绘制
    ctx.moveTo(x, y);
    ctx.setStrokeStyle('#c96d79'); // 设置线条颜色
    ctx.setLineWidth(2); // 设置线条宽度
    for (let i = 1; i < list.length; i++) {
      let x = i * xScale;
      let y = centerY / 2 - ((list[i] / 2) * yScale); // 负数在中心下方，正数在中心上方
      ctx.lineTo(x, y);
    }
    ctx.stroke(); // 绘制线条
    ctx.draw(false); // 绘制到canvas上，不需要等待上一步绘制完成
  }



})