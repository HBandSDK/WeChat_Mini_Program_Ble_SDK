import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: "00-00-00",
    time: "00:00",
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
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');

    this.setData({
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    })
  },


  bindSyncTime() {
    let date = this.data.date.split("-");
    let year = date[0];
    let month = date[1];
    let day = date[2];
    const time = this.data.time.split(":");
    let hours = time[0]
    let minutes = time[1]
    let timestamp = Date.now();
    let now = new Date(timestamp);
    let seconds = String(now.getSeconds()).padStart(2, '0');

    let data = {
      year: year,
      month: month,
      day: day,
      hour: hours,// 这里小时+1 为了区分当前时间与同步时间
      minute: minutes,
      second: seconds,
      format: 2,//  1 12小时制 2 24小时制
    }

    veepooFeature.veepooSendSyncTimeManager(data);
  },

  bindDateChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      date: e.detail.value
    })
  },
  bindTimeChange: function (e: any) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      time: e.detail.value
    })
  },
})