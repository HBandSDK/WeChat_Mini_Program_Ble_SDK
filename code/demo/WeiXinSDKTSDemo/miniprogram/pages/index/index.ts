
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

import { veepooJLAuthenticationManager, veepooJLDisconnectDevice } from "../../jieli_sdk/index"
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler';
import { veepooJLBle } from "../../jieli_sdk/bleInit"
// const vpJLBle = new veepooJLBle();
//打印设置

let imagePath = 'file:///data/storage/el2/base/haps/entry/files/custom_dial_images/2025430_114654.jpg';

let path = imagePath.split(":")[1]

console.log("path=>", path.substring(2));

// 获取应用实例
const app = getApp<IAppOption>()
// 血液 血糖bug修复
Component({
  data: {
    bleList: [],
    device: {},
    info: {},
    connected: false,
    listDate: [
      {
        name: '切换服务',
        path: 'switchServices'
      },
      {
        name: '蓝牙重连',
        path: 'Reconnect'
      },
      {
        name: '波形',
        path: '/pages/waveform/index'
      },
      {
        name: '断开连接',
        path: 'DisconnectBluetooth'
      },
      {
        name: '单位设置',
        path: '/pages/unitSetting/index'
      },
      {
        name: '天气',
        path: '/pages/weatherForecast/index'
      },
      {
        name: '个人信息',
        path: '/pages/personalInfo/index'
      },
      {
        name: '日常数据',
        path: '/pages/readDailyData/index'
      },
      {
        name: '睡眠',
        path: '/pages/sleep/index'
      },
      {
        name: '计步',
        path: '/pages/step/index'
      },
      {
        name: '体温手动',
        path: '/pages/bodyTemperature/index'
      },
      {
        name: 'ECG测量',
        path: '/pages/ecgTest/index'
      },
      {
        name: 'PTT测量',
        path: '/pages/pttTest/index'
      },
      {
        name: 'ECG读取',
        path: '/pages/ecgRead/index'
      },
      {
        name: '身体成分',
        path: '/pages/bodyMeasurement/index'
      },
      {
        name: '体温自动',
        path: '/pages/bodyTemperatureAuto/index'
      },
      {
        name: '联系人',
        path: '/pages/contactPerson/index'
      },
      {
        name: 'SOS',
        path: '/pages/sos/index'
      },
      {
        name: '闹钟',
        path: '/pages/alarmClock/index'
      },
      {
        name: '运动模式',
        path: '/pages/movementPattern/index'
      },
      {
        name: '表盘相关',
        path: '/pages/dial/index'
      },
      {
        name: '查找手机',
        path: '/pages/lookPhone/index'
      },
      {
        name: '血压',
        path: '/pages/universalBlood/index'
      },
      {
        name: '屏幕设置',
        path: '/pages/screenSetup/index'
      },
      {
        name: '心率报警',
        path: '/pages/heartRateAlarm/index'
      },
      {
        name: '血液成分',
        path: '/pages/bloodComponent/index'
      },
      {
        name: '血糖测量',
        path: '/pages/bloodGlucose/index'
      },
      {
        name: 'ota',
        path: '/pages/ota/index'
      },
      // {
      //   name: 'ota原生版',
      //   path: '/pages/otaNavite/index'
      // },
      {
        name: '久坐提醒',
        path: '/pages/sedentaryToast/index'
      },
      {
        name: '拍照',
        path: '/pages/takeAPicture/index'
      },
      {
        name: '抬手亮屏',
        path: '/pages/brightScreen/index'
      },
      {
        name: 'ANCS开关',
        path: '/pages/ANCSToast/index'
      },
      {
        name: '健康提醒',
        path: '/pages/healthToast/index'
      },
      {
        name: '血氧自动',
        path: '/pages/bloodOxygen/index'
      },
      {
        name: '血氧手动',
        path: '/pages/bloodOxygen2/index'
      },
      {
        name: '女性经期',
        path: '/pages/female/index'
      },
      {
        name: '恢复出厂',
        path: 'resettingTheDevice'
      },
      {
        name: '复位',
        path: 'reset'
      },
      {
        name: '开关设置',
        path: '/pages/switchSetup/index'
      },
      {
        name: 'android编码',
        path: '/pages/androidCode/index'
      },
      {
        name: 'UI风格',
        path: '/pages/uiStyle/index'
      },
      {
        name: '同步时间',
        path: '/pages/syncTime/index'
      },
      {
        name: '网络表盘',
        path: '/pages/networkDial/index'
      },
      {
        name: '心率测量',
        path: '/pages/heartRateTest/index'
      },
      {
        name: '语言切换',
        path: '/pages/languagePage/index'
      },
      {
        name: '读取手动测量',
        path: '/pages/manualMeasurement/index'
      },
      {
        name: '肤色设置',
        path: '/pages/skinColorSetting/index'
      },
      {
        name: '微体检',
        path: '/pages/microCheck/index'
      },
      {
        name: 'B3自动测量',
        path: '/pages/b3AutoTestFeature/b3AutoTestFeature'
      },
    ],
    valData: {
      heartRate: 'start',
      bloodPressure: 'stop',
    }
  },
  methods: {


    packRgb(r: any, g: any, b: any) {

      // 构造高位字节
      console.log("(r << 3) & 0xF8)=>", (r << 3) & 0xF8)
      console.log("((g >> 3) & 0x07)=>", ((g >> 3) & 0x07))
      let big = ((r << 3) & 0xF8) | ((g >> 3) & 0x07); // 注意：在JavaScript中我们需要左移r以腾出空间

      // 构造低位字节
      let little = ((g << 5) & 0xe0) | (b & 0x1F); // 注意：在JavaScript中我们左移g 5位以腾出空间

      return { big, little };
    },
    getF003() {
      let device: any = wx.getStorageSync('bleDate')
      wx.getBLEDeviceServices({
        // 这里的 deviceId 需要已经通过 wx.createBLEConnection 与对应设备建立连接
        deviceId: device.deviceId,
        success(res) {
          console.log('device services:', res.services)
          let date = res.services;
          for (let i = 0; i < date.length; i++) {
            if (date[i].uuid == 'F0020001-0451-4000-B000-000000000000') {
              wx.getBLEDeviceCharacteristics({
                deviceId: device.deviceId,
                serviceId: date[i].uuid,
                success(res) {
                  console.log('device getBLEDeviceCharacteristics:', res.characteristics);
                  res.characteristics.forEach((item: any, index: number) => {
                    if (item.properties.notify) {
                      console.log("item==>", item)
                      wx.notifyBLECharacteristicValueChange({
                        state: true, // 启用 notify 功能
                        deviceId: device.deviceId,
                        serviceId: date[i].uuid,
                        characteristicId: item.uuid,
                        success(res) {
                          console.log("监听ecg特征成功=>", res)
                          wx.onBLECharacteristicValueChange(function (res) {
                            console.log("res=>", res)
                          })
                        },
                        fail(err) {
                          console.log("监听ecg特征失败err=>", err)
                        }
                      })
                    }
                  })

                }, fail(err) {
                  console.log('err=>', err)
                }
              })
            }
          }
        }, fail(err) {
          console.log(err)
        }
      })
    },


    blePwd() {

      console.log("蓝牙秘钥核准")
      this.BlePasswordCheckManager();

    },

    onShow() {
      let self = this;

      // let blePackage = {"deviceId":"FA:4E:30:9C:E6:B0","rssi":-38,"connectable":true,"data":{"0":2,"1":1,"2":6,"3":9,"4":255,"5":248,"6":248,"7":76,"8":197,"9":217,"10":146,"11":3,"12":248,"13":3,"14":3,"15":231,"16":254,"17":5,"18":9,"19":86,"20":50,"21":55,"22":90},"deviceName":"V27Z"}
      // 初始化蓝牙适配器

      let blePackage = { "deviceId": "F0:87:99:D6:F7:2D", "rssi": -53, "connectable": true, "data": { "0": 2, "1": 1, "2": 6, "3": 3, "4": 3, "5": 231, "6": 254, "7": 3, "8": 25, "9": 65, "10": 3, "11": 9, "12": 255, "13": 248, "14": 248, "15": 46, "16": 28, "17": 105, "18": 64, "19": 211, "20": 20, "21": 6, "22": 9, "23": 70, "24": 49, "25": 48, "26": 48, "27": 0 }, "deviceName": "F100" }


      const valuesArray = Object.values(blePackage.data);
      console.log("valuesArray=>", valuesArray)
      let hexValue = valuesArray.map(value => value.toString(16).toUpperCase().padStart(2, '0'));
      console.log('hexValue==>', hexValue)
      let hexMac = hexValue.splice(15, 6).reverse();
      let max = '';
      for (let i = 0; i < hexMac.length; i++) {
        if (i == hexMac.length - 1) {
          max = max + hexMac[i]
        } else {
          max = max + hexMac[i] + ':'
        }
      }
      console.log("mac=>", max);

      let dataLength = [2, 1, 6, 3, 3, 231, 254, 3, 25, 65, 3, 9, 255, 248, 248, 46, 28, 105, 64, 211, 20, 6, 9, 70, 49, 48, 48, 0].length
      let tbyte = [2, 1, 6, 3, 3, 231, 254, 3, 25, 65, 3, 9, 255, 248, 248, 46, 28, 105, 64, 211, 20, 6, 9, 70, 49, 48, 48, 0]

      let hex = ["02", "01", "06", "03", "03", "E7", "FE", "03", "19", "41", "03", "09", "FF", "F8", "F8", "2E", "1C", "69", "40", "D3", "14", "06", "09", "46", "31", "30", "30", "00"]


      for (let i = 0; i < hex.length; i++) {
        if (hex[i] + hex[i + 1] == 'F8F8') {
          console.log('index====>', i + 2)
        }

      }

      if (dataLength >= 8) {
        let endIndex: number = 7;
        if (tbyte[0] === 0xF8 && tbyte[1] === 0xF9) {
          endIndex += 4;
        }


      }

      veepooBle.veepooWeiXinSDKStopSearchBleManager(function (e: any) {
        console.log("停止蓝牙搜索=>", e)
      })
      this.getConnectedBleDevice();

      wx.onBLEConnectionStateChange(function (res) {
        // 该方法回调中可以用于处理连接意外断开等异常情况
        console.log("res==>", res)
        console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
        wx.setStorageSync('VPDevice', null)
      })
      const items = Array.from({
        length: 40
      }, () => 0)
      console.log("items=>", items)


      let data = {
        status: true
      }
      veepooBle.veepooWeiXinSDKRawDataShowStatus(data);

      let str = "2025-09-03 17:48:00";
      const isoStr = str.replace(' ', 'T');
      const date = new Date(isoStr);
      console.log('时间戳==》', date.getTime());

    },

    getNextDays(startDate: any, count: number) {
      let days = [];
      for (let i = 0; i < count; i++) {
        let day = new Date(startDate);
        day.setDate(day.getDate() - i);
        days.push(day.toISOString().split('T')[0]); // 转换为 YYYY-MM-DD 格式  
      }
      return days;
    },

    uint8ArrayToHex(uInt8Array: any) {
      return uInt8Array.map((byte: any) => byte.toString(16).padStart(2, '0'));
    },
    updateProgress(currentValue: any, maxValue: any) {
      const progressWidth = (maxValue - currentValue) / maxValue * 100;
      return progressWidth
    },

    setJLVerify() {
      let self = this;
      // 初始化，接受杰里数据
      BleDataHandler.init()
      let device = wx.getStorageSync('bleInfo')
      // 杰里设备认证
      setTimeout(() => {
        // 杰里设备认证
        veepooJLAuthenticationManager(device, (res: any) => {
          console.log("杰理认证状态==>", res)
        })
      }, 2000);
    },
    // 获取背景信息
    getBackgroundInfo() {
      veepooFeature.veepooSendReadCustomBackgroundDailManager()
    },

    // 断开连接
    closeBluetoothAdapterManager() {
      let self = this;
      let device = wx.getStorageSync('bleInfo');
      // 杰里断开蓝牙连接，清除认证数据等
      veepooJLDisconnectDevice(device)

      // 杰里断开连接

      self.setData({
        device: {}
      })
      self.setData({
        isConnected: false,
        connected: false,
        info: {}
      })
    },
    // 获取已连接的蓝牙设备
    getConnectedBleDevice() {
      let self = this;
      wx.getConnectedBluetoothDevices({
        services: ['FFFF', 'FEE7', '0001', '180D'],
        success(res) {
          let device: any = self.data.device
          console.log("已连接的蓝牙设备res=>", res)
          res.devices.forEach(item => {
            let bleInfo = wx.getStorageSync('bleInfo');
            if (bleInfo.deviceId == item.deviceId) {

              self.setData({
                info: item,
                connected: true
              })
              device.name = item.name;
              self.setData({
                device
              })
              self.notifyMonitorValueChange();
              // vpJLBle.init();
              // 连接上后读取秘钥，电量等
              setTimeout(() => {
                self.BlePasswordCheckManager();
              }, 500);
            }
          })
        }
      })
    },
    skipDeviceGet() {
      console.log("a")
      wx.navigateTo({
        url: '/pages/bleConnection/index',
      })
    },
    // 跳转相关页面
    skipPages(e: any) {
      let path = e.currentTarget.dataset.path;
      let self = this;
      console.log(path)
      if (path == 'DisconnectBluetooth') {
        veepooFeature.veepooSendDisconnectBluetoothDataManager()
        return
      }
      if (path == 'resettingTheDevice') {
        veepooFeature.veepooSendResettingTheDeviceDataManager()
        return
      }
      if (path == 'reset') {
        veepooFeature.veepooSendResetDataManager()
        return
      }

      if (path == 'switchServices') {

        // 获取存储的蓝牙信息
        const device = wx.getStorageSync('bleInfo');

        // 切换服务
        veepooBle.veepooWeiXinSDKHandoverServiceManager({ deviceId: device.deviceId }, (res: any) => {
          console.log("服务切换res=>", res)
        });

        return
      }

      if (path == "Reconnect") {
        let item = wx.getStorageSync('bleInfo');
        veepooBle.veepooWeiXinSDKBleReconnectDeviceManager(item, function (result: any) {
          console.log('蓝牙重连result=>', result);
          // 获取当前服务，订阅监听
          self.notifyMonitorValueChange();
          // 蓝牙密码核准
          veepooFeature.veepooBlePasswordCheckManager();

        })
        return
      }


      // switchServices
      // Reconnect

      wx.navigateTo({
        url: path,
      })
    },
    // 密钥核验  无参数
    BlePasswordCheckManager() {
      let self = this;
      let VPDevice = wx.getStorageSync('VPDevice');

      console.log("VPDevice==>", VPDevice)
      if (VPDevice) {
        self.setData({
          device: VPDevice
        })
      } else {
        veepooFeature.veepooBlePasswordCheckManager();
      }

      console.log("读取电量")
      this.ElectricQuantityManager();
      console.log("读取步数")
      this.StepCalorieDistanceManager();
      this.getBackgroundInfo()
      let bleDate = wx.getStorageSync('bleDate')
      console.log("bleDate==>", bleDate)
      wx.setBLEMTU({
        deviceId: bleDate.deviceId,
        mtu: 247,
        success: res => {
          console.log("第一个res=>", res)
        }, //
        fail: (res) => {
          wx.getBLEMTU({
            deviceId: bleDate.deviceId, success: res => {
              console.log("第二个res=>", res)

              // 切换杰里服务等
            }
          })
        }
      })

    },
    // 电量读取
    ElectricQuantityManager() {
      veepooFeature.veepooReadElectricQuantityManager();
    },
    // 读取步数，距离卡路里
    /*
    参数：day:0； 0 今天 1 昨天 2 前天 
     */
    StepCalorieDistanceManager() {
      let data = {
        day: 0
      }
      veepooFeature.veepooReadStepCalorieDistanceManager(data)
    },
    // 监听订阅 notifyMonitorValueChange
    notifyMonitorValueChange() {
      let self = this;
      veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
        self.bleDataParses(e)
      })
    },
    // 监听蓝牙返回数据解析
    bleDataParses(value: any) {
      let self = this;
      let device: any = this.data.device;
      console.log("蓝牙监听返回= 这个是index页面 >", value)
      // 校验
      if (value.type == 1) {
        device.VPDeviceVersion = value.content.VPDeviceVersion;
        device.VPDeviceMAC = value.content.VPDeviceMAC;
        wx.setStorageSync('VPDevice', device)
        self.setData({
          device
        })
      } else if (value.type == 2) {
        device.VPDeviceElectricPercent = value.content.VPDeviceElectricPercent;
        self.setData({
          device
        })
      } else if (value.type == 9) {
        device.step = value.content.step;
        device.calorie = value.content.calorie;
        device.distance = value.content.distance;
        self.setData({
          device
        })
        // 存储自定义背景类型，方便获取屏幕信息
      } else if (value.type == 46) {
        let type = value.content.customDialType
        wx.setStorageSync('customType', type)
      }
    }
  },
})
