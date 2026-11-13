import { veepooBle } from '../../miniprogram_dist/index'

const MAX_LOG = 100
let logSeq = 0

Page({
  data: {
    input: '04 01 00 02 01 01',
    frames: [] as any[],
    lastRecv: '',
    packetInfo: '',
    logs: [] as any[]
  },

  onLoad() {
    this.registerNotify()
  },

  // 监听设备上报，只处理 0x04 自定义协议
  registerNotify() {
    const self = this
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      if (!Array.isArray(e) || e[0] !== '04') return
      const text = e.join(' ')
      self.setData({ lastRecv: text })
      self.log('接收（' + e.length + ' 字节）：' + text, 'recv')
    })
  },

  onInput(e: any) {
    this.setData({ input: e.detail.value })
  },

  // 查询当前链路单包大小（MTU - 3），返回多少由 wx.getBLEMTU 决定
  onQueryPacketSize() {
    const self = this
    veepooBle.veepooWeiXinSDKGetPacketSizeManager(function (res: any) {
      if (!res || !res.success) {
        self.setData({ packetInfo: '' })
        self.log('查询单包大小失败：' + ((res && res.errMsg) || '未知错误'))
        return
      }
      const info = 'MTU ' + res.mtu + ' 字节，单包最大可写 ' + res.packetSize + ' 字节'
      self.setData({ packetInfo: info })
      self.log('查询单包大小：' + info)
    })
  },

  // 解析输入：每行一帧，支持空格、逗号、0x 等分隔
  parseInput(text: string) {
    const lines = (text || '').split('\n')
    const frames: string[][] = []
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].replace(/0x/gi, '').replace(/[\s,;:_-]/g, '')
      if (!raw) continue
      if (!/^[0-9a-fA-F]+$/.test(raw) || raw.length % 2 !== 0) {
        return { error: '第 ' + (i + 1) + ' 行不是合法的十六进制数据（需为偶数个字符）' }
      }
      const frame: string[] = []
      for (let j = 0; j < raw.length; j += 2) {
        frame.push(raw.substr(j, 2).toUpperCase())
      }
      frames.push(frame)
    }
    if (frames.length === 0) {
      return { error: '请输入至少一帧数据' }
    }
    return { frames: frames }
  },

  // 预览解析结果
  onPreview() {
    const res: any = this.parseInput(this.data.input)
    if (res.error) {
      this.setData({ frames: [] })
      this.log(res.error)
      return
    }
    const list = res.frames.map(function (f: string[], i: number) {
      return {
        index: i + 1,
        len: f.length,
        isCustom: f[0] === '04',
        text: f.join(' ')
      }
    })
    this.setData({ frames: list })
    this.log('已解析 ' + list.length + ' 帧')
  },

  // 下发：SDK 内部会做连接、帧头、长度校验，并按 30ms 间隔逐帧写入
  onSend() {
    const res: any = this.parseInput(this.data.input)
    if (res.error) {
      this.log(res.error)
      return
    }
    this.onPreview()
    const self = this
    veepooBle.veepooWeiXinSDKSendCustomDataFramesManager(res.frames, function (r: any) {
      if (r && r.success) {
        self.log('下发成功：共 ' + r.total + ' 帧', 'send')
        return
      }
      // 结果结构：code 数值码 + codeName 名称 + codeDesc 中文描述 + errMsg 具体原因
      const desc = (r && r.codeDesc) || '未知错误'
      const name = (r && r.codeName) || 'Unknown'
      const code = (r && typeof r.code === 'number') ? r.code : -1
      let msg = '下发失败：' + desc + '（' + name + '，code=' + code + '）'
      if (r && r.errMsg) msg += '，' + r.errMsg
      if (r && typeof r.failIndex === 'number' && r.failIndex >= 0) {
        msg += '（失败帧 ' + (r.failIndex + 1) + '）'
      }
      self.log(msg, 'send')
    })
  },

  // 填入礼拜提醒读取指令示例
  onTemplate() {
    this.setData({ input: '04 01 00 02 01 01' })
    this.onPreview()
  },

  onClear() {
    this.setData({ frames: [], lastRecv: '', logs: [] })
  },

  log(text: string, kind?: string) {
    const time = new Date().toTimeString().slice(0, 8)
    const kindText = kind === 'send' ? '下发' : (kind === 'recv' ? '接收' : '信息')
    const logs = this.data.logs || []
    logs.unshift({
      id: time + '_' + (logSeq++),
      time: time,
      kind: kind || 'info',
      kindText: kindText,
      text: text
    })
    if (logs.length > MAX_LOG) logs.length = MAX_LOG
    this.setData({ logs: logs })
  }
})
