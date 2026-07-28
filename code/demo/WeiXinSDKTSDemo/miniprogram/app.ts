import { veepooJLBle } from "./jieli_sdk/bleInit"
import { veepooLogger } from "./miniprogram_dist/index";
const vpJLBle = new veepooJLBle();

App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.setStorageSync('connectionStatus', true)
    vpJLBle.init();
    // 配置VPSDK打印等级
    veepooLogger.setLevel(veepooLogger.LEVEL.DEBUG)
    const currentLevel = veepooLogger.getLevel()
    console.log('当前日志级别:', currentLevel)
  },
})