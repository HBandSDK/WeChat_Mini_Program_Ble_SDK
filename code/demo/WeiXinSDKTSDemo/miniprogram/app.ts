import { veepooJLBle } from "./jieli_sdk/bleInit"
const vpJLBle = new veepooJLBle();


App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.setStorageSync('connectionStatus', true)
    vpJLBle.init();
  },
})



