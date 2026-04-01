import { veepooJLBle } from "./jieli_sdk/bleInit"
import { veepooLogger } from "./miniprogram_dist/index.js";
const vpJLBle = new veepooJLBle();

function getDaysBetween(currentDateStr: string, pastDateStr: string): number {
  const currentDate = new Date(currentDateStr)
  const pastDate = new Date(pastDateStr)

  // 获取毫秒差值
  const diffTime = currentDate.getTime() - pastDate.getTime()

  // 转为天数（毫秒 / 一天的毫秒数）
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

console.log("getDaysBetween===>",getDaysBetween('2022-11-11','2022-11-09'))

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