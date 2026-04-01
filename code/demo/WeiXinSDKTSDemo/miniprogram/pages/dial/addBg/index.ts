import { RCSPOpSystemInfo, RCSPOpWatch, RCSPOpWatchDial } from "../../../jieli_sdk/lib/rcsp-impl/rcsp";
import { OPDirectoryBrowse, OPLargerFileTrans } from "../../../jieli_sdk/jl_lib/jl-rcsp-op/jl_op_watch_1.1.0";
import { veepooBle, veepooFeature } from '../../../miniprogram_dist/index';
// pages/function_test/dial_operate/dial_add_background/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isTransfering: false,
    transferProgressText: "",
    imgs: "../../../image/dial_icon3_main.png",
    fileName:""
  },
  devScreenWidth: 240,
  devScreenHeight: 280,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      pathImage: options.pathImage
    })
    console.log("options.pathImage=>", options)

    // 获取屏幕信息
    RCSPOpWatch?.getFlashInfo().then((res) => {
      this.devScreenWidth = res.width
      this.devScreenHeight = res.height
      console.log("devScreenWidth : " + this.devScreenWidth);
      console.log("devScreenHeight : " + this.devScreenHeight);
    })
  },
  onUnload() {
    RCSPOpWatchDial?.cancelAddWatchResourseFile()
  },
  saveFile(fs: WechatMiniprogram.FileSystemManager, filePath: string, data: Uint8Array) {
    fs.writeFileSync(filePath, data.buffer)
    console.log("writeFileSync : ", data);
    console.log("filePath : ", filePath);

    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success() {
        wx.showToast({
          title: '保存成功'
        })
      },
      fail() {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    })
  },
  onShow() {

  },
  uint8ArrayToHex(uInt8Array:any) {
    return uInt8Array.map((byte:any) => byte.toString(16).padStart(2, '0')).join('');
  },
  //裁剪图片
  clickWay1() {
    let self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['original'],
      success: (res) => {
        console.log("选择图片", res);
        const imagePath = res.tempFiles[0].tempFilePath
        wx.navigateTo({
          url: '/pages/dial/addBg/dial_bg_image/index?imagePath=' + imagePath + "&width=" + this.devScreenWidth + "&height=" + this.devScreenHeight,
          events: {
            // 返回的数据
            onDialBgData: (resDialBg: { data: any }) => {
              console.log("resDialBg==+>", resDialBg);
             // 发送数据 分词发送，先发送缩略图，在发送背景图，固定名字
              this._handleDialBgData(resDialBg.data);

            }
          }
        })
      }
    })
    return
    if (this.data.isTransfering) {
      return
    }
    RCSPOpSystemInfo?.getSystemInfo().then((systemInfo) => {
      if (systemInfo.callStatus == 1) {//手表通话中
        wx.showToast({
          title: '通话中，不可操作',
          icon: 'none'
        })
      } else if (systemInfo.callStatus == 0) {//手表空闲
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sizeType: ['original'],
          success: (res) => {
            console.log("选择图片", res);
            const imagePath = res.tempFiles[0].tempFilePath
            wx.navigateTo({
              url: '/pages/dial/addBg/dial_bg_image/index?imagePath=' + imagePath + "&width=" + this.devScreenWidth + "&height=" + this.devScreenHeight,
              events: {
                onDialBgData: (resDialBg: { data: Uint8Array }) => {
                  this._handleDialBgData(resDialBg.data)
                }
              }
            })
          }
        })
      }
    })
  },//传输资源文件
  // clickWay2() {
  //   if (this.data.isTransfering) {
  //     return
  //   }
  //   RCSPOpSystemInfo?.getSystemInfo().then((systemInfo) => {
  //     if (systemInfo.callStatus == 1) {//手表通话中
  //       wx.showToast({
  //         title: '通话中，不可操作',
  //         icon: 'none'
  //       })
  //     } else if (systemInfo.callStatus == 0) {//手表空闲
  //       wx.chooseMessageFile({
  //         count: 1,
  //         success: (res) => {
  //           const tempFilePaths = res.tempFiles
  //           console.log("tempFilePaths : ", tempFilePaths);
  //           const fs = wx.getFileSystemManager()
  //           fs.getFileInfo({
  //             filePath: tempFilePaths[0].path,
  //             success: (res) => {
  //               let fd = fs.openSync({
  //                 filePath: tempFilePaths[0].path
  //               })
  //               let uint8 = new Uint8Array(res.size);
  //               fs.read({
  //                 fd: fd,
  //                 arrayBuffer: uint8.buffer,
  //                 length: res.size,
  //                 success: (_res) => {
  //                   const lastModifyTime = tempFilePaths[0].time
  //                   const dialData = uint8
  //                   console.log("读取文件成功", uint8);
  //                   const fileName = tempFilePaths[0].name
  //                   if (!fileName.toUpperCase().startsWith("BGP_")) {
  //                     wx.showToast({ title: "文件名应为bgp_xxxx或者BGP_xxxx", icon: "error" })
  //                     return
  //                   }
  //                   const transferCallback: OPLargerFileTrans.TransferTaskCallback = {
  //                     onError: (code: number) => {
  //                       this.setData({
  //                         transferProgressText: "传输失败，code:" + code,
  //                         isTransfering: false
  //                       })
  //                     },
  //                     onStart: () => {
  //                       this.setData({
  //                         transferProgressText: "开始传输",
  //                         isTransfering: true
  //                       })
  //                     },
  //                     onProgress: (progress: number) => {
  //                       this.setData({
  //                         transferProgressText: "正在传输，进度:" + progress
  //                       })
  //                     },
  //                     onSuccess: () => {
  //                       this.setData({
  //                         transferProgressText: "传输成功",
  //                         isTransfering: false
  //                       })
  //                     },
  //                     onCancel: (_code: number) => {
  //                       this.setData({
  //                         transferProgressText: "传输取消",
  //                         isTransfering: false
  //                       })
  //                     }
  //                   }
  //                   RCSPOpWatchDial?.addWatchResourseFile(dialData, fileName, lastModifyTime, true, transferCallback).then((res) => {
  //                     console.log("res==ssf=>", res)
  //                     if (res instanceof OPDirectoryBrowse.File) {
  //                       console.log("res===>", res)
  //                       RCSPOpWatchDial?.setDialCustomBackground(res)
  //                     }
  //                   }).catch((_error) => {

  //                   })
  //                 }, complete: (_res) => {
  //                   fs.close({ fd })
  //                 }
  //               })
  //             }
  //           })

  //         }
  //       })
  //     }
  //   })
  // },

  clickCancelTransfer() {
    RCSPOpWatchDial?.cancelAddWatchResourseFile()
  },

  // 发送缩略图
  _handleDialBgData(data: any) {
    let self = this;
    console.log("onDialBgData :  ", data);
    const lastModifyTime = (new Date()).getTime()
    console.log(" lastModifyTime " + lastModifyTime);
    setTimeout(() => {
      wx.showModal({
        title: "输入文件名",
        editable: true,
        content: "bgp_w000", // 缩略图名称 bgp_w000  背景图 bgp_w001
        success: (res) => {
          if (res.confirm) {
            const lastModifyTime = (new Date()).getTime()
            console.log(" lastModifyTime " + lastModifyTime);

            const fileName = res.content
            if (!fileName.toUpperCase().startsWith("BGP_")) {
              wx.showToast({ title: "文件名应为bgp_xxxx或者BGP_xxxx", icon: "error" })
              return
            }
            const transferCallback: OPLargerFileTrans.TransferTaskCallback = {
              onError: (code: number) => {
                this.setData({
                  transferProgressText: "传输失败，code:" + code,
                  isTransfering: false
                })
              },
              onStart: () => {
                this.setData({
                  transferProgressText: "开始传输",
                  isTransfering: true
                })
              },
              onProgress: (progress: number) => {
                this.setData({
                  transferProgressText: "正在传输，进度:" + progress
                })
              },
              onSuccess: () => {
                this.setData({
                  transferProgressText: "传输成功",
                  isTransfering: false
                })
              },
              onCancel: (_code: number) => {
                this.setData({
                  transferProgressText: "传输取消",
                  isTransfering: false
                })
              }
            }
            console.log("data=>", data)
            RCSPOpWatchDial?.addWatchResourseFile(data.data1, fileName, lastModifyTime, true, transferCallback).then((res) => {
              self.setData({
                fileName
              })
              if (res instanceof OPDirectoryBrowse.File) {
                console.log("res====>", res)
                console.log("res====>", res.getName())
                RCSPOpWatchDial?.setDialCustomBackground(res).then((res) => {
                  self._handleDialBgData2(data)
                  console.log("发送数据")
                  console.log("res=>", res)
                  //设置成功
                }).catch((error) => {
                  //失败
                })

              }
            }).catch((_error) => {

            })
          }
        }
      })
    }, 1500);
  },

  // 发送背景图片
  _handleDialBgData2(data: any) {
    let self = this;
    console.log("onDialBgData :  ", data);
    const lastModifyTime = (new Date()).getTime()
    console.log(" lastModifyTime " + lastModifyTime);

    if (data) {
      const lastModifyTime = (new Date()).getTime()
      console.log(" lastModifyTime " + lastModifyTime);

      const fileName = 'bgp_w001'
      if (!fileName.toUpperCase().startsWith("BGP_")) {
        wx.showToast({ title: "文件名应为bgp_xxxx或者BGP_xxxx", icon: "error" })
        return
      }
      const transferCallback: OPLargerFileTrans.TransferTaskCallback = {
        onError: (code: number) => {
          this.setData({
            transferProgressText: "传输失败，code:" + code,
            isTransfering: false
          })
        },
        onStart: () => {
          this.setData({
            transferProgressText: "开始传输",
            isTransfering: true
          })
        },
        onProgress: (progress: number) => {
          this.setData({
            transferProgressText: "正在传输，进度:" + progress
          })
        },
        onSuccess: () => {
          this.setData({
            transferProgressText: "传输成功",
            isTransfering: false
          })
        },
        onCancel: (_code: number) => {
          this.setData({
            transferProgressText: "传输取消",
            isTransfering: false
          })
        }
      }


      console.log("fileName===>",fileName)
      RCSPOpWatchDial?.addWatchResourseFile(data.data2, fileName, lastModifyTime, true, transferCallback).then((res) => {
        self.setData({
          fileName
        })
        if (res instanceof OPDirectoryBrowse.File) {
          console.log("res====>", res)
          console.log("res====>", res.getName())
          RCSPOpWatchDial?.setDialCustomBackground(res).then((res) => {
            console.log("发送数据")
            console.log("res=>", res)
            //设置成功
          }).catch((error) => {
            //失败
          })

        }
      }).catch((_error) => {

      })
    }

  },
})