// pages/networkDial/index.ts\
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
import { veepooJLGetFileDataManager, veepooJLAddDialTransferStartManager, veepooJLAuthenticationManager, veepooJLGetDialListManager, veepooJLDeleteDialManager } from '../../jieli_sdk/index';
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler';
import { RCSPManager, RCSP } from "../../jieli_sdk/lib/rcsp-impl/rcsp";
import { DeviceManager, DeviceBluetooth } from "../../jieli_sdk/lib/rcsp-impl/dev-bluetooth";
import { BluetoothDevice } from "../../jieli_sdk/lib/rcsp-protocol/rcsp-util";


Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    dialInfo: {},
    resultList: [],// 表盘列表
    fileData: {},
    transferProgressText: '',
    dialList: {},// 设备表盘列表
    getIndex: 1,// 请求的页数

  },
  _RCSPWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    let device = wx.getStorageSync('VPDevice');
    this.setData({
      device: device
    });

    // 注意，需先订阅vp指令，在订阅杰里
    this.notifyMonitorValueChange();

    setTimeout(() => {
      BleDataHandler.init();// 接受杰理数据
    }, 100);

    this._RCSPWrapperEventCallback = new RCSP.RCSPWrapperEventCallback()
    this._RCSPWrapperEventCallback.onEvent = (event) => {
      if (event.type === "onSwitchUseDevice") {
        const connectedDeviceId = event.onSwitchUseDeviceEvent?.device?.deviceId
        console.log(" onSwitchUseDevice111: " + connectedDeviceId);
        this.setData({
          connectedDeviceId: connectedDeviceId == undefined ? "" : connectedDeviceId
        })

        if (connectedDeviceId != undefined) {
          setTimeout(() => {
            console.log('==================================认证成功=====================================');

          }, 300);
        }
      }
    }
    RCSPManager.observe(this._RCSPWrapperEventCallback)

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
    this.getCustomDial();
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

  },

  // 获取自定义背景表盘信息
  getCustomDial() {
    // 1 表盘市场ui信息  2 自定义表盘信息 3 全套ui信息
    let data = {
      type: 1
    }
    veepooFeature.veepooSendReadCustomBackgroundDailManager(data);
  },

  // 添加获取页数
  addGetIndex() {

    this.setData({
      getIndex: this.data.getIndex + 1
    })
    this.getData();
  },

  // 减少获取页数
  removeGetIndex() {
    if (this.data.getIndex != 1) {
      this.setData({
        getIndex: this.data.getIndex - 1
      })
    }

    this.getData();

  },

  // 接口
  getData() {
    let self = this;
    let device: any = self.data.device;
    let dialInfo: any = self.data.dialInfo;
    // dialInfo: { "dataAddress": 0, "writeDataLength": 532597, "binProtocol": 2, "dataUseType": 1, "dialShape": 48, "ImageId": 0 },
    // version: "00.77.02.05-5097",
    // dialInfo: { "dataAddress": dialInfo.dataAddress, "writeDataLength": dialInfo.writeDataLength, "binProtocol": dialInfo.binProtocol, "dataUseType": dialInfo.dataUseType, "dialShape": dialInfo.dialShape, "ImageId": dialInfo.ImageId },
    console.log('这个时获取的dailInfo==>', dialInfo)
    let data = {
      version: "11.95.01.00-6702",
      // version: "01.05.02.00-5376",
      // version: "01.05.02.00-5840",
      // dialInfo: { "dataAddress": 0, "writeDataLength": 614733, "binProtocol": 2, "dataUseType": 1, "dialShape": 56, "ImageId": 0 },
      // dialInfo: { "dataAddress": dialInfo.dataAddress, "writeDataLength": dialInfo.writeDataLength, "binProtocol": dialInfo.binProtocol, "dataUseType": dialInfo.dataUseType, "dialShape": dialInfo.dialShape, "ImageId": dialInfo.ImageId },
      // dialInfo: { "dataAddress": 0, "writeDataLength": 532597, "binProtocol": 2, "dataUseType": 1, "dialShape": 48, "ImageId": 0 },
      // version: "01.05.02.00-5840",
      // dialInfo: { "dataAddress": dialInfo.dataAddress, "writeDataLength": dialInfo.writeDataLength, "binProtocol": dialInfo.binProtocol, "dataUseType": dialInfo.dataUseType, "dialShape": dialInfo.dialShape, "ImageId": dialInfo.ImageId },
      dialInfo: { "dataAddress": 0, "writeDataLength": 614733, "binProtocol": 2, "dataUseType": 1, "dialShape": 56, "ImageId": 0 },
      pageIndex: this.data.getIndex,// 当前页数
      pageSize: 24,// 数据条数
    }

    let resut = veepooFeature.veepooGetNetworDialManager(data);
    resut.then((result: any) => {
      console.log("resut==>", result.data)

      self.setData({
        resultList: result.data.results
      })

      // 获取杰理表盘列表
      veepooJLGetDialListManager(function (result: any) {
        console.log("result=>", result)
        self.setData({
          dialList: result.dialList,
          customBackgroundList: result.customBackgroundList
        })
        console.log("手环表盘列表dialList=>", self.data.dialList)
      })
    }).catch((err: any) => {
      console.log("err=>", err);
    })


  },


  // 杰理认证
  setJLVerify() {
    let self = this;
    let info = wx.getStorageSync('bleInfo')
    // 杰里设备认证
    let device = info as BluetoothDevice;

    DeviceManager.connecDevice(device);
  },

  // 开始传输
  clickStartTransferDialFile() {
    let self = this;
    let fileData: any = this.data.fileData;
    if (fileData.length <= 0) {
      wx.showToast({
        title: "请先下载表盘",
        icon: "none"
      })
      return
    }
    console.log("点击了开始传输");

    console.log("查看设备列表中是否存在已下载的设备")
    let deteleState = false;
    let deteleFile = {}
    // 获取表盘列表
    let dialList: any = self.data.dialList;
    let resultList: any = self.data.resultList;

    console.log("dialList==>", dialList);
    console.log("resultList==>", resultList)
    for (let i = 0; i < dialList.length; i++) {
      let Item = dialList[i];
      let fileName = (Item.name).toLowerCase();
      for (let j = 0; j < resultList.length; j++) {
        let JTem = resultList[j];
        let name = JTem.fileUrl.split("/");
        //  如此存在，那么先删除
        if (fileName == name[name.length - 1]) {
          console.log("fileName===>", fileName);
          console.log("name===>", name)
          deteleFile = Item
          deteleState = true
        }
      }
    }

    console.log("deteleState===>", deteleState)
    console.log("deteleFile===>", deteleFile)

    // 如果为真，删除，否则直接传输
    if (deteleState) {
      veepooJLDeleteDialManager(deteleFile, function (result: any) {
        console.log("result删除表盘=>", result)
        // 删除完成，传输数据
        veepooJLAddDialTransferStartManager(fileData, function (result: any) {
          console.log("传输进度result=>", result);
          self.setData({
            transferProgressText: result.transferProgressText
          })
          deteleState = false
          deteleFile = {}
        })
      })
    } else {
      veepooJLAddDialTransferStartManager(fileData, function (result: any) {
        console.log("传输进度result=>", result);
        self.setData({
          transferProgressText: result.transferProgressText
        })
      })
    }

  },

  downloadDial(e: any) {
    let self = this;
    console.log("e==>", e);
    let name = e.currentTarget.dataset.name;
    console.log("name=>", name);
    let resultList = self.data.resultList;
    let currentItem: any = {}
    resultList.forEach((item: any, index) => {
      if (item.name == name) {
        console.log("item==>", item);
        currentItem = item;
      }
    })




    wx.downloadFile({
      url: currentItem.fileUrl,
      success: function (res: any) {
        if (res.statusCode === 200) {
          var tempFilePath = res.tempFilePath;
          console.log("res==>", res)
          console.log('文件下载成功，临时路径为：', tempFilePath);
          let Time = Date.now(); // 记录下载开始时间  
          let names = currentItem.fileUrl.split("/");
          console.log("name==>", names[names.length - 1])
          console.log("Time=>", Time)
          let tempFilePaths = {
            path: tempFilePath,
            size: res.dataLength,
            name: names[names.length - 1],
            time: Time
          }
          veepooJLGetFileDataManager(tempFilePaths, function (fileResult: any) {
            console.log("获取文件成功==>", fileResult);
            self.setData({
              fileData: fileResult
            })
          })

          return
          // 保存到磁盘
          let dialStorageList = wx.getStorageSync("dialStorageList");
          if (!dialStorageList) {
            let obj = {
              name: currentItem.name,
              path: tempFilePath
            }
            let arr = [obj]
            wx.setStorageSync("dialStorageList", arr)
          } else {
            let obj = {
              name: currentItem.name,
              path: tempFilePath
            }
            dialStorageList.push(obj);
            wx.setStorageSync("dialStorageList", dialStorageList)
          }

          // 在成功回调中可以继续其他操作，比如保存文件或者展示文件等
        } else {
          console.log('文件下载失败，HTTP 状态码：', res.statusCode);
        }
      },
      fail: function (err) {
        console.log('文件下载失败：', err);
      }
    })
  },


  readDownLoadData() {
    let self = this;
    let dialStorageList = wx.getStorageSync("dialStorageList");
    console.log("dialStorageList==>", dialStorageList);
    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: `${dialStorageList[0].path}`,
      success(res: any) {
        console.log(res);
        const uint8Array = new Uint8Array(res.data); // 将ArrayBuffer转换为Uint8Array  
        console.log('Uint8Array 数据:', uint8Array);
      },
      fail(res) {
        console.error(res)
      }
    })

  },


  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("e=>", e);
      console.log("表盘信息===e==>", e)
      if (e.type == 46) {
        self.setData({
          dialInfo: e.content
        })
      }
    })
  },
});




