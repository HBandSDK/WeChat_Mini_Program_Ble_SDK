// pages/sportControl/index.ts
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({
  data: {
    opCode: 1,
    sportMode: 0,
    isReading: false,
    sportData: {
      sportModel: 0,
      opCode: 0,
      runState: 'Unknown',
      deviceState: 'Unknown',
      exerciseTimeStamp: '00:00:00',   // 格式化为 HH:MM:SS
      exerciseDistance: '0.00',        // 公里
      heartRate: 0,
      calories: '0.0',                // 千卡
      pace: "0'00\"",                 // 配速 分′秒″
      speed: '0.00',                  // km/h
      gnssInfo: null as { isGnssType: boolean; gnssSignal: string } | null,
    },
    opCodeText: '',
  },

  _isReading: false,
  _timerId: null as any,

  onLoad() {
    this.notifyMonitorValueChange()
  },

  onUnload() {
    if (this._isReading) {
      this._isReading = false
      if (this._timerId) {
        clearTimeout(this._timerId)
        this._timerId = null
      }
      this.setData({ isReading: false })
    }
  },

  inputChange(e: any) {
    this.setData({ opCode: Number(e.detail.value) })
  },

  inputChange2(e: any) {
    this.setData({ sportMode: Number(e.detail.value) })
  },

  // ----- 运动控制指令 -----
  startSport() {
    const data = { switch: 'setup', sportMode: this.data.sportMode, opCode: 1 }
    console.log('运动控制下发数据:', data)
    veepooFeature.veepooSendSportControlDataManager(data)
  },
  pausedSport() {
    const data = { switch: 'setup', sportMode: this.data.sportMode, opCode: 2 }
    console.log('运动控制下发数据:', data)
    veepooFeature.veepooSendSportControlDataManager(data)
  },
  continueSport() {
    const data = { switch: 'setup', sportMode: this.data.sportMode, opCode: 3 }
    console.log('运动控制下发数据:', data)
    veepooFeature.veepooSendSportControlDataManager(data)
  },
  stopSport() {
    const data = { switch: 'setup', sportMode: this.data.sportMode, opCode: 4 }
    console.log('运动控制下发数据:', data)
    veepooFeature.veepooSendSportControlDataManager(data)
  },

  // 开始/停止读取（点击切换）
  startReadSportControl() {
    if (this._isReading) {
      this._isReading = false
      if (this._timerId) {
        clearTimeout(this._timerId)
        this._timerId = null
      }
      this.setData({ isReading: false })
      console.log('已停止读取')
      return
    }
    this._isReading = true
    this.setData({ isReading: true })
    console.log('开始读取')
    const sendRequest = () => {
      if (!this._isReading) return
      const data = { switch: 'read', sportMode: this.data.sportMode }
      veepooFeature.veepooSendSportControlDataManager(data)
      this._timerId = setTimeout(sendRequest, 300)
    }
    sendRequest()
  },

  // 注册回调并转换单位
  // notifyMonitorValueChange() {
  //   veepooBle.veepooWeiXinSDKNotifyMonitorValueChange((e: any) => {
  //     console.log('运动控制回调 =>', e)
  //     if (!e || !e.content) return
  //     const content = e.content

  //     // --- 单位转换 ---
  //     const rawTime = content.exerciseTimeStamp ?? 0
  //     const rawDist = content.exerciseDistance ?? 0
  //     const rawSpeed = content.speed ?? 0
  //     const rawPace = content.pace ?? 0
  //     const rawCal = content.calories ?? 0

  //     // 时间：秒 → HH:MM:SS
  //     const hours = Math.floor(rawTime / 3600)
  //     const minutes = Math.floor((rawTime % 3600) / 60)
  //     const seconds = Math.floor(rawTime % 60)
  //     const timeStr = [hours, minutes, seconds]
  //       .map(v => String(v).padStart(2, '0'))
  //       .join(':')

  //     // 距离：米 → 公里
  //     const distKm = (rawDist / 1000).toFixed(2)

  //     // 速度：0.01 km/h → km/h
  //     const speedKmh = (rawSpeed / 100).toFixed(2)

  //     // 配速：0.1秒/公里 → 分′秒″
  //     const paceSec = Math.round(rawPace / 10)
  //     const paceMin = Math.floor(paceSec / 60)
  //     const paceSecRem = paceSec % 60
  //     const paceStr = `${paceMin}'${String(paceSecRem).padStart(2, '0')}"`

  //     // 卡路里：假设原始为卡，除以1000得千卡（若协议为0.01千卡则除以100，请按实际调整）
  //     const kcal = (rawCal / 1000).toFixed(1)

  //     const sportData = {
  //       sportModel: content.sportModel ?? 0,
  //       opCode: content.opCode ?? 0,
  //       runState: content.runState ?? 'Unknown',
  //       deviceState: content.deviceState ?? 'Unknown',
  //       exerciseTimeStamp: timeStr,
  //       exerciseDistance: distKm,
  //       heartRate: content.heartRate ?? 0,
  //       calories: kcal,
  //       pace: paceStr,
  //       speed: speedKmh,
  //       gnssInfo: content.gnssInfo ?? null,
  //     }

  //     const opCodeText = this.getOpCodeText(sportData.opCode)
  //     this.setData({ sportData, opCodeText })
  //   })
  // },
  notifyMonitorValueChange() {
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange((e: any) => {
      console.log('运动控制回调 =>', e)
      if (!e || !e.content) return
      const content = e.content
  
      // --- 单位转换 ---
      const rawTime = content.exerciseTimeStamp ?? 0
      const rawDist = content.exerciseDistance ?? 0
      const rawSpeed = content.speed ?? 0
      const rawPace = content.pace ?? 0
      const rawCal = content.calories ?? 0
  
      // 时间：秒 → HH:MM:SS
      const hours = Math.floor(rawTime / 3600)
      const minutes = Math.floor((rawTime % 3600) / 60)
      const seconds = Math.floor(rawTime % 60)
      const timeStr = [hours, minutes, seconds]
        .map(v => String(v).padStart(2, '0'))
        .join(':')
  
      // 距离：米 → 公里
      const distKm = (rawDist / 1000).toFixed(2)
  
      // ---------- 除以 1000，保留 1 位小数 ----------
      let speedKmh = "-.-"
      if (rawSpeed !== 0) {
        speedKmh = (rawSpeed / 1000).toFixed(1)
      }
  
      // ---------- 限制最大 59999 ----------
      let paceStr = "--'--\""
      if (rawPace !== 0) {
        let limitedPace = rawPace
        if (limitedPace > 59999) {
          limitedPace = 59999
        }
        const paceMin = Math.floor(limitedPace / 60)
        const paceSecRem = limitedPace % 60
        paceStr = `${paceMin}'${String(paceSecRem).padStart(2, '0')}"`
      }
  
      // 卡路里：原始为卡 → 千卡（保留 1 位小数）
      const kcal = (rawCal / 1000).toFixed(1)
  
      const sportData = {
        sportModel: content.sportModel ?? 0,
        opCode: content.opCode ?? 0,
        runState: content.runState ?? 'Unknown',
        deviceState: content.deviceState ?? 'Unknown',
        exerciseTimeStamp: timeStr,
        exerciseDistance: distKm,
        heartRate: content.heartRate ?? 0,
        calories: kcal,
        pace: paceStr,
        speed: speedKmh,
        gnssInfo: content.gnssInfo ?? null,
      }
  
      const opCodeText = this.getOpCodeText(sportData.opCode)
      this.setData({ sportData, opCodeText })
    })
  },
  getOpCodeText(opCode: number): string {
    const map: { [key: number]: string } = {
      1: '开启运动',
      2: '暂停运动',
      3: '继续运动',
      4: '停止运动',
      5: '运动数据上报',
    }
    return map[opCode] || '未知操作'
  },
})