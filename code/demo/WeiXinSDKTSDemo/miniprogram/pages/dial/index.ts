import { RCSPOpWatchDial } from "../../jieli_sdk/lib/rcsp-impl/rcsp";
import { RCSPManager, RCSP } from "../../jieli_sdk/lib/rcsp-impl/rcsp"
import { OPWatchDial, OPDirectoryBrowse } from "../../jieli_sdk/jl_lib/jl-rcsp-op/jl_op_watch_1.1.0";
var RCSPOpWatchDialCallback: OPWatchDial.OperaterEventCallbackWatchDial
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
import { showActionSheet } from "../../jieli_sdk/utils/util";
import { veepooJLGetDialListManager, veepooJLSetToCurrentUseManager, veepooJLDeleteDialManager, veepooJLGetDialVersionInfoManager, veepooJLGetDialBackgroundManager, veepooJLUseTheCurrentDialListManager, veepooJLAuthenticationManager } from '../../jieli_sdk/index';
import { DeviceManager, DeviceBluetooth } from "../../jieli_sdk/lib/rcsp-impl/dev-bluetooth";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    dialList: new Array(),
    customBackgroundList: new Array(),
    useDial: OPDirectoryBrowse.File.prototype
  },

  /**
   * 生命周期函数--监听页面加载
   */
  _RCSPWrapperEventCallback: RCSP.RCSPWrapperEventCallback.prototype,
  onLoad() {

    BleDataHandler.init();

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
  onUnload() {
    RCSPOpWatchDial?.unregisterEventCallback(RCSPOpWatchDialCallback);


  },
  /**
  * 点击事件--添加表盘
  */
  clickAddDial(e: WechatMiniprogram.BaseEvent) {
    console.log("添加表盘", e);
    wx.navigateTo({ url: '/pages/dial/addDial/index' })
  },
  /**
  * 获取表盘列表
  */
  getDailList() {
    let self = this;
    // 获取表盘列表
    veepooJLGetDialListManager(function (result: any) {
      console.log("result=>", result)
      self.setData({
        dialList: result.dialList,
        customBackgroundList: result.customBackgroundList
      })
    })
    veepooJLUseTheCurrentDialListManager(function (result: any) {
      self.setData({
        useDial: result.useDial
      })
    })
  },

  /* 
  * 杰里认证
  */
  setJLVerify() {
    let self = this;
    let device = wx.getStorageSync('bleInfo');


    DeviceManager.connecDevice(device);

    // 杰里设备认证
    // veepooJLAuthenticationManager(device,(res:any)=>{
    //   console.log("杰理认证状态==>",res)
    // })


  },
  /**
  * 点击事件--表盘操作  
  */
  clickDialMoreOperate(e: WechatMiniprogram.BaseEvent) {
    console.log("表盘操作", e);
    const index = e.currentTarget.dataset.index;
    const file: OPDirectoryBrowse.File = this.data.dialList[index]
    //@ts-ignore
    const isUsing = file.name == this.data.useDial
    console.log("isUsing==>", isUsing)
    console.log("file===>", file)
    let menu: Array<string>;
    if (isUsing) {
      menu = ["设置自定义表盘背景", "获取表盘版本信息", "获取表盘背景", "删除表盘"]
    } else {
      menu = ["设置为当前使用", "获取表盘版本信息", "获取表盘背景", "删除表盘"]
    }

    console.log("file=ssssss==>", file)
    return wx.showActionSheet({
      alertText: "表盘:" + file.getName(),
      itemList: menu,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            if (isUsing) {
              this._dialOperateSetDialCustomBackground(file)
            } else {
              this._dialOperateSetDialIsUsing(file)
            }
            break;
          case 1:
            this._dialOperateGetDialVersionInfo(file)
            break;
          case 2:
            this._dialOperateGetDialBackground(file)
            break;
          case 3:
            this._dialOperateDeleteDial(file)
            break;
        }
      }
    })
  },

  /**
  * 点击事件--自定义表盘
  */
  clickDialBackground(e: WechatMiniprogram.BaseEvent) {
    console.log("表盘操作", e);
    const index = e.currentTarget.dataset.index;
    const file: OPDirectoryBrowse.File = this.data.customBackgroundList[index]
    //@ts-ignore
    const isUsing = file.name == this.data.useDial;
    console.log("isUsing===>", isUsing)
    console.log("file=====>", file)

    let menu: Array<string>;
    if (isUsing) {
      menu = ["设置自定义表盘背景", "获取表盘版本信息", "获取表盘背景", "删除表盘"]
    } else {
      menu = ["设置为当前使用", "获取表盘版本信息", "获取表盘背景", "删除表盘"]
    }
    return wx.showActionSheet({
      alertText: "表盘:" + file.getName(),
      itemList: menu,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            if (isUsing) {
              this._dialOperateSetDialCustomBackground(file)
            } else {
              this._dialOperateSetDialIsUsing(file)
            }
            break;
          case 1:
            this._dialOperateGetDialVersionInfo(file)
            break;
          case 2:
            this._dialOperateGetDialBackground(file)
            break;
          case 3:
            this._dialOperateDeleteDial(file)
            break;
        }
      }
    })
  },
  /**
   * 表盘操作--设置自定义背景(仅限当前使用表盘)
   */
  _dialOperateSetDialCustomBackground(file: OPDirectoryBrowse.File) {
    if (this.data.customBackgroundList.length == 0) {
      return wx.showToast({ title: "表盘背景列表为空，请先添加表盘背景" })
    }
    RCSPOpWatchDial?.getDialCustomBackground(file).then((dialBackground) => {
      const menu = new Array<string>()
      menu.push("恢复默认背景")
      for (let index = 0; index < this.data.customBackgroundList.length; index++) {
        const element = this.data.customBackgroundList[index];
        menu.push(element.getName())
      }
      const config = {
        alertText: "当前表盘背景:" + dialBackground?.getName(),
        itemList: menu,
        success: (res: any) => {
          let backgroundFile: any
          if (res.tapIndex == 0) {
            backgroundFile = undefined
          } else {
            backgroundFile = this.data.customBackgroundList[res.tapIndex - 1]
          }
          if (!backgroundFile || backgroundFile.getName() != dialBackground?.getName()) {
            RCSPOpWatchDial?.setDialCustomBackground(backgroundFile).then((_res) => {
              if (backgroundFile) {
                wx.showToast({ title: "设置自定义背景成功" })
              } else {
                wx.showToast({ title: "恢复默认背景成功" })
              }
            }).catch((error) => {
              wx.showToast({ title: "设置自定义背景失败," + error })
            })
          }
        }
      }
      showActionSheet(config)
    }).catch((error) => {
      wx.showToast({ title: "获取当前表盘背景失败," + error })
    })
    return
  },

  /**
   * 表盘操作--设置为当前使用
   */
  _dialOperateSetDialIsUsing(file: OPDirectoryBrowse.File) {
    let self = this;

    console.log("设置当前使用file==>", file)
    veepooJLSetToCurrentUseManager(file, function (e: any) {
      console.log("设置当前表盘e=>", e)
      veepooJLUseTheCurrentDialListManager(function (result: any) {
        console.log("result当前表盘==>", result)
        self.setData({
          useDial: result.useDial
        })
      })
    })
  },
  
  /**
   * 表盘操作--获取表盘版本信息
   */
  _dialOperateGetDialVersionInfo(file: OPDirectoryBrowse.File) {
    veepooJLGetDialVersionInfoManager(file, function (result: any) {
      console.log("获取表盘版本信息result=>", result)
    })
  },
  /**
   * 表盘操作--获取表盘背景
   */
  _dialOperateGetDialBackground(file: OPDirectoryBrowse.File) {
    veepooJLGetDialBackgroundManager(file, function (result: any) {
      console.log("获取表盘背景result=>", result)
    })
  },
  /**
   * 表盘操作--设置自定义背景(仅限当前使用表盘)
   */
  /**
   * 表盘操作--删除表盘
   */
  _dialOperateDeleteDial(file: OPDirectoryBrowse.File) {
    wx.showModal({
      title: "删除表盘:" + file.getName(),
      content: "确定要删除表盘文件?",
      confirmText: "删除",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          console.log("删除表盘detele =>", file)
          veepooJLDeleteDialManager(file, function (result: any) {
            console.log("result删除表盘=>", result)
          })
        } else if (res.cancel) {
        }
      }
    })
  },
  /**
  * 点击事件--自定义表盘背景操作
  */
  clickAddDialBackground(e: WechatMiniprogram.BaseEvent) {
    console.log("添加表盘背景", e);
    wx.navigateTo({ url: '/pages/dial/addBg/index' })
  },

  /**
   * 表盘操作--删除表盘背景
   */
  _dialOperateDeleteDialBackground(file: OPDirectoryBrowse.File) {
    wx.showModal({
      title: "删除表盘背景:" + file.getName(),
      content: "确定要删除表盘背景?",
      confirmText: "删除",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          RCSPOpWatchDial?.deleteDialCustomBackground(file).then((_res) => {
            wx.showToast({ title: "删除表盘背景成功" })
          }).catch((error) => {
            wx.showToast({ title: "删除表盘背景失败," + error })
          })
        } else if (res.cancel) {
        }
      }
    })
  },
  /**
   * 获取表盘文件
   */
  // _getWatchFile(fileList: OPDirectoryBrowse.File[]) {
  //   const filt = "WATCH"
  //   const result = new Array<OPDirectoryBrowse.File>()
  //   for (let index = 0; index < fileList.length; index++) {
  //     const element = fileList[index];
  //     if (element.getName()?.toUpperCase().includes(filt)) {
  //       result.push(element)
  //     }
  //   }
  //   return result
  // },
})