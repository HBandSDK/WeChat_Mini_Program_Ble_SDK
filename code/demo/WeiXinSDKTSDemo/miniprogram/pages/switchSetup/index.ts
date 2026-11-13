// pages/switchSetup/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// 开关配置：label(显示名称), sdkKey(下发指令key), responseKey(设备返回key), pkg(所属包序号)
const SWITCH_CONFIG = [
  { label: '心率自动检测', sdkKey: 'heartRate', responseKey: 'VPSettingAutomaticHRTest', pkg: 0 },
  { label: '血压自动检测', sdkKey: 'bloodPressure', responseKey: 'VPSettingAutomaticBPTest', pkg: 0 },
  { label: '科学睡眠', sdkKey: 'scientificSleep', responseKey: 'VPSettingAutomaticPPGTest', pkg: 0 },
  { label: '体温自动检测', sdkKey: 'bodyTemperature', responseKey: 'VPSettingAutomaticTemperatureTest', pkg: 1 },
  { label: '血糖自动检测', sdkKey: 'bloodGlucose', responseKey: 'VPSettingAutomaticBloodGlucoseTest', pkg: 1 },
  { label: '血液自动检测', sdkKey: 'bloodComponents', responseKey: 'VPSettingAutomaticBloodCompTest', pkg: 1 },
  { label: '压力自动检测', sdkKey: 'pressure', responseKey: 'VPSettingPressureFunctionSwitch', pkg: 1 },
  { label: '跌倒提醒', sdkKey: 'fallWarning', responseKey: 'VPSettingFallWarning', pkg: 1 },
  { label: '缺氧提醒', sdkKey: 'lowOxygen', responseKey: 'VPSettingOxygenLowerRemind', pkg: 0 },
  { label: 'HRV自动检测', sdkKey: 'hrv', responseKey: 'VPSettingAutomaticHRVTest', pkg: 0 },
]

Page({

  data: {
    switchList: SWITCH_CONFIG.map(item => ({
      label: item.label,
      checked: false,
      disabled: true,
    })),
    hasUnsupported: false, // 是否存在设备不支持的开关
    b3Supported: false, // 功能汇总第四包 b3AutoTestFeatureType 是否为 1
    b3Known: false, // 是否已读取到功能汇总第四包
  },

  onShow() {
    this.notifyMonitorValueChange()
    this.checkB3Support()
    veepooFeature.veepooSendReadDeviceUnitSettingDataManager()
  },

  // 开关显示“不支持”时，检查功能汇总第四包的 b3AutoTestFeatureType
  // 0 不支持 B3 自动测量；1 支持，可改走 B3 自动测量接口设置
  checkB3Support() {
    const features4 = wx.getStorageSync('Features4')
    if (!features4 || features4.length <= 12) {
      this.setData({ b3Known: false })
      return
    }
    const value = String(features4[12])
    this.setData({
      b3Known: true,
      b3Supported: value === '01' || value === '1',
    })
  },

  goB3AutoTest() {
    wx.navigateTo({
      url: '/pages/b3AutoTestFeature/b3AutoTestFeature'
    })
  },

  onSwitchChange(e: any) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    this.setData({ [`switchList[${index}].checked`]: value })
    veepooFeature.veepooSendAutoTestSwitchDataManager({
      [SWITCH_CONFIG[index].sdkKey]: value ? 'start' : 'stop'
    })
  },

  notifyMonitorValueChange() {
    const self = this
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      if (e.type == 11) {
        console.log('公英制新增开关回调=>', e)
        const content = e.content
        if (!content) return

        const updateData: Record<string, any> = {}
        const disabledList = self.data.switchList.map((item: any) => item.disabled)
        SWITCH_CONFIG.forEach((item, index) => {
          if (item.pkg !== e.package) return
          const value = content[item.responseKey]
          if (value !== undefined) {
            updateData[`switchList[${index}].checked`] = value === 'open'
            updateData[`switchList[${index}].disabled`] = value === 'noThisFeature'
            disabledList[index] = value === 'noThisFeature'
          }
        })
        // 任一开关显示“不支持”时，页面提示可尝试 B3 自动测量
        updateData.hasUnsupported = disabledList.some((disabled: boolean) => disabled)
        self.setData(updateData)
      }
    })
  },
})
