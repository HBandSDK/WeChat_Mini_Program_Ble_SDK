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
  },

  onShow() {
    this.notifyMonitorValueChange()
    veepooFeature.veepooSendReadDeviceUnitSettingDataManager()
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

        const updateData: Record<string, boolean> = {}
        SWITCH_CONFIG.forEach((item, index) => {
          if (item.pkg !== e.package) return
          const value = content[item.responseKey]
          if (value !== undefined) {
            updateData[`switchList[${index}].checked`] = value === 'open'
            updateData[`switchList[${index}].disabled`] = value === 'noThisFeature'
          }
        })
        self.setData(updateData)
      }
    })
  },
})
