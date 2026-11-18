// pages/sleep/index.js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({
  data: {
    device: {
      readDay: '--',
      readPercent: 0,
      Progress: 0,
      content: [{
        fallAsleepTime: '--',
        exitSleepTime: '--',
        deepSleepTime: 0,
        lightSleepTime: 0,
        nightTotalTime: 0,
        otherSleepTime: 0,
        sleepQuality: 0,
        sleepCurve: []
      }]
    },

    // 标尺相关变量
    showRuler: false,
    rulerX: 0,
    rulerTipText: '',
    clickTimeout: 300,
    canvasWidth: 375,
    canvasHeight: 90
  },

  onLoad(options) {
    // 直接挂到 this 上，方便 canvas 计算
    this.canvasWidth = this.data.canvasWidth
    this.canvasHeight = this.data.canvasHeight
    this.lastClickTime = 0
  },

  onReady() {},

  onShow() {
    this.notifyMonitorValueChange()
  },

  ReadPreciseSleepManager(e) {
    const day = Number(e.currentTarget.dataset.day)
    console.log('day:', day)

    veepooFeature.veepooSendReadPreciseSleepManager({
      day
    })
  },

  notifyMonitorValueChange() {
    const self = this

    // 注意：uni-app 里是 veepooUniAppSDKNotifyMonitorValueChange
    // 微信小程序里改回 veepooWeiXinSDKNotifyMonitorValueChange
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e) {
      console.log('睡眠监听回调=>', e)

      if (e && e.name === '精准睡眠数据') {
        const content = Array.isArray(e.content) ? e.content : []
        const firstData = content[0] || {}

        const device = {
          ...e,
          readDay: e.readDay || '--',
          readPercent:
            e.readPercent != null
              ? e.readPercent
              : e.Progress != null
              ? e.Progress
              : 0,
          Progress:
            e.Progress != null
              ? e.Progress
              : e.readPercent != null
              ? e.readPercent
              : 0,
          content: [{
            fallAsleepTime: firstData.fallAsleepTime || '--',
            exitSleepTime: firstData.exitSleepTime || '--',
            deepSleepTime: firstData.deepSleepTime || 0,
            lightSleepTime: firstData.lightSleepTime || 0,
            nightTotalTime: firstData.nightTotalTime || 0,
            otherSleepTime: firstData.otherSleepTime || 0,
            sleepQuality: firstData.sleepQuality || 0,
            sleepCurve: Array.isArray(firstData.sleepCurve)
              ? firstData.sleepCurve
              : []
          }]
        }

        self.setData({ device }, () => {
          self.drawSleepCurve()
        })
      }
    })
  },

  // 绘制多层堆叠睡眠轨道
  drawSleepCurve() {
    const first = this.data.device.content && this.data.device.content[0]
    const curve = first && first.sleepCurve

    if (!curve || curve.length === 0) {
      return
    }

    // 小程序里不能用 uni.createCanvasContext，要用 wx.createCanvasContext
    const ctx = wx.createCanvasContext('sleepCurveCanvas', this)
    const query = wx.createSelectorQuery().in(this)

    query.select('#sleepCurveCanvas').boundingClientRect(rect => {
      if (!rect) {
        this.canvasWidth = 375
        this.canvasHeight = 90
        this._drawWithSize(ctx, curve, this.canvasWidth, this.canvasHeight)
        return
      }

      this.canvasWidth = rect.width
      this.canvasHeight = rect.height
      this._drawWithSize(ctx, curve, this.canvasWidth, this.canvasHeight)
    }).exec()
  },

  _drawWithSize(ctx, curve, width, height) {
    // 层级定义：【顶层→底层】
    const layers = [
      { type: 4, color: '#FFB74D' }, // 苏醒
      { type: 2, color: '#42A5F5' }, // 快速眼动
      { type: 1, color: '#7C68ED' }, // 浅睡
      { type: 0, color: '#512DA8' }  // 深睡
    ]

    const layerCount = layers.length
    const layerHeight = height / layerCount
    const totalPointCount = curve.length

    layers.forEach((layer, layerIndex) => {
      const yStart = layerIndex * layerHeight
      const targetType = layer.type
      const segments = []

      let isInSegment = false
      let segStart = 0

      for (let i = 0; i < curve.length; i++) {
        const val = curve[i]

        if (val === targetType) {
          if (!isInSegment) {
            isInSegment = true
            segStart = i
          }
        } else {
          if (isInSegment) {
            isInSegment = false
            segments.push({
              start: segStart,
              end: i - 1
            })
          }
        }
      }

      if (isInSegment) {
        segments.push({
          start: segStart,
          end: curve.length - 1
        })
      }

      segments.forEach(seg => {
        const segWidth = (seg.end - seg.start + 1) / totalPointCount * width
        const x = seg.start / totalPointCount * width

        ctx.setFillStyle(layer.color)
        ctx.fillRect(
          x,
          yStart + 2,
          Math.max(1, segWidth - 0.5),
          layerHeight - 4
        )
      })
    })

    // 如果开启标尺，绘制竖线
    if (this.data.showRuler) {
      ctx.setStrokeStyle('#333333')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(this.data.rulerX, 0)
      ctx.lineTo(this.data.rulerX, height)
      ctx.stroke()
    }

    ctx.draw()
  },

  getTouchX(e) {
    const touch =
      (e.touches && e.touches[0]) ||
      (e.changedTouches && e.changedTouches[0])

    if (!touch) return 0
    if (touch.x !== undefined) return touch.x
    if (touch.offsetX !== undefined) return touch.offsetX
    return touch.clientX || 0
  },

  // Canvas 点击：模拟双击
  onCanvasTouchStart(e) {
    const now = Date.now()
    const touchX = this.getTouchX(e)

    if (now - (this.lastClickTime || 0) < this.data.clickTimeout) {
      const showRuler = !this.data.showRuler

      this.setData({
        showRuler,
        rulerX: touchX
      })

      this.updateRulerInfo(touchX)
    }

    this.lastClickTime = now
  },

  // 滑动更新标尺位置
  onCanvasTouchMove(e) {
    if (!this.data.showRuler) return

    const touchX = this.getTouchX(e)

    this.setData({
      rulerX: touchX
    })

    this.updateRulerInfo(touchX)
  },

  onCanvasTouchEnd() {
    // 抬起不关闭标尺，再次双击关闭
  },

  // 根据标尺 X 坐标，查找当前所在睡眠段，计算时长
  updateRulerInfo(xPos) {
    const first = this.data.device.content && this.data.device.content[0]
    const curve = first && first.sleepCurve

    if (!curve || curve.length === 0) {
      this.setData({
        rulerTipText: '无数据'
      })
      this.drawSleepCurve()
      return
    }

    const totalPointCount = curve.length
    const canvasWidth = this.canvasWidth || this.data.canvasWidth || 375

    let index = Math.round(xPos / canvasWidth * (totalPointCount - 1))
    index = Math.max(0, Math.min(totalPointCount - 1, index))

    const currentType = curve[index]

    let segStart = index
    let segEnd = index

    while (segStart > 0 && curve[segStart - 1] === currentType) {
      segStart--
    }

    while (segEnd < totalPointCount - 1 && curve[segEnd + 1] === currentType) {
      segEnd++
    }

    // 假设每个采样点代表 1 分钟，按需修改采样间隔
    const durationMin = segEnd - segStart + 1

    const typeMap = {
      0: '深睡',
      1: '浅睡',
      2: '快速眼动',
      4: '苏醒'
    }

    const typeName = typeMap[currentType] || '未知'

    this.setData({
      rulerTipText: `${typeName}，持续${durationMin}分钟`
    })

    this.drawSleepCurve()
  }
})