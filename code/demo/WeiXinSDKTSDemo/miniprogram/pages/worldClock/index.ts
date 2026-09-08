import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

Page({

  data: {
    id: 1,
    clockList: [],
    progress: 0,
    readState: '',
    addCity: '北京',
    addTimezone: 0,
    fromId: 1,
    toId: 2,
    deleteId: 1,
    logText: ''
  },

  onLoad() { },

  onShow() {
    this.notifyMonitorValueChange();
  },

  notifyMonitorValueChange() {
    let that = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log("世界时钟 监听蓝牙回调=>", e);
      if (e.type == 61) {
        that.appendLog(JSON.stringify(e));
        if (e.name == '读取世界时钟') {
          if (e.Progress !== undefined && e.Progress < 100) {
            that.setData({ progress: e.Progress });
          } else {
            that.setData({
              clockList: e.content || [],
              progress: 100,
              readState: e.state
            });
          }
        } else if (e.name == '添加世界时钟') {
          that.appendLog('添加结果: ' + e.state + ' CRC: ' + e.CRC);
        } else if (e.name == '调整时钟顺序') {
          that.appendLog('调整结果: ' + e.state + ' CRC: ' + e.CRC);
        } else if (e.name == '删除世界时钟') {
          that.appendLog('删除结果: ' + e.state + ' ID: ' + e.worldClockId);
        }
      }
    });
  },

  appendLog(text: string) {
    let prev = this.data.logText || '';
    let now = new Date();
    let time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    this.setData({ logText: `[${time}] ${text}\n${prev}` });
  },

  readWorldClock() {
    console.log('读取世界时钟');
    this.setData({ clockList: [], progress: 0, readState: '' });
    veepooFeature.veepooSendReadWorldClockDataManager({ CRC: 0 });
  },

  addWorldClock() {
    console.log('添加世界时钟');
    let item = {
      id: Number(this.data.id),
      timezone: Number(this.data.addTimezone),
      city: this.data.addCity
    };

    console.log('添加参数=>', item);
    veepooFeature.veepooSendAddWorldClockDataManager(item);
  },

  adjustWorldClock() {
    console.log('调整时钟顺序');
    let data = {
      fromId: Number(this.data.fromId),
      toId: Number(this.data.toId)
    };
    console.log('调整参数=>', data);
    veepooFeature.veepooSendAdujstWorldClockDataManager(data);
  },

  deleteWorldClock() {
    console.log('删除世界时钟');
    let data = {
      worldClockId: Number(this.data.deleteId)
    };
    console.log('删除参数=>', data);
    veepooFeature.veepooSendDeleteWorldClockDataManager(data);
  },

  onCityInput(e: any) {
    this.setData({ addCity: e.detail.value });
  },
  onIdInput(e:any){
    this.setData({ id: e.detail.value });
  },
  onTimezoneInput(e: any) {
    this.setData({ addTimezone: e.detail.value });
  },

  onFromIdInput(e: any) {
    this.setData({ fromId: e.detail.value });
  },

  onToIdInput(e: any) {
    this.setData({ toId: e.detail.value });
  },

  onDeleteIdInput(e: any) {
    this.setData({ deleteId: e.detail.value });
  }
});
