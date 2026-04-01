import { RCSPManager } from "../../jieli_sdk/lib/rcsp-impl/rcsp"
import { veepooJLAuthenticationManager, veepooJLOTAInITManager, veepooJLStartOTAManager, veepooJLOTAUnloadObserveManager } from "../../jieli_sdk/index"
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isOTAing: false,
    otaProgressText: "",
    fileStatus: 0,
    fileInfo: "",
    fileName: ""
  },
  otaData: Uint8Array.prototype,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 初始化，接受杰里数据
    BleDataHandler.init()
    // ota初始化
    veepooJLOTAInITManager();
  },
  onUnload() {
    // 销毁ota资源
    veepooJLOTAUnloadObserveManager();
  },
  setJLVerify() {
    let device = wx.getStorageSync('bleInfo')
    // 杰里设备认证
    veepooJLAuthenticationManager(device, (res: any) => {
      console.log("杰理认证状态==>", res)
    })
  },
  // 读取文件
  clickReadFile() {
    wx.chooseMessageFile({
      count: 1,
      success: (res) => {
        const tempFilePaths = res.tempFiles
        console.log("tempFilePaths : ", tempFilePaths);
        this.setData({
          fileStatus: 1
        })
        const fs = wx.getFileSystemManager()
        fs.getFileInfo({
          filePath: tempFilePaths[0].path,
          success: (res) => {
            let fd = fs.openSync({
              filePath: tempFilePaths[0].path
            })
            let uint8 = new Uint8Array(res.size);
            fs.read({
              fd: fd,
              arrayBuffer: uint8.buffer,
              length: res.size,
              success: (_res) => {
                this.otaData = uint8
                console.log("读取文件成功", uint8);
                this.setData({
                  fileStatus: 2,
                  fileName: tempFilePaths[0].name,
                  fileInfo: "文件大小：" + res.size
                })
              }, complete: (_res) => {
                fs.close({ fd })
              }
            })
          }
        })

      }
    })
  },

  // 开始ota
  clickStartOTA() {
    let self = this;
    if (!RCSPManager.isConnectedDevce()) {
      wx.showToast({ title: "请先连接设备" })
      return
    }
    if (this.data.fileStatus == 2 && this.otaData.length > 0) {
      // 开始ota
      let value = {
        updateFileData: this.otaData
      }

      // 开始ota，传入文件数据
      veepooJLStartOTAManager(value, function (event: any) {
        console.log("event=>", event);
        self.setData({
          otaProgressText: event.otaProgressText
        })
      })
    }
  },
})