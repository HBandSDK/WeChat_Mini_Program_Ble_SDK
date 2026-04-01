import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'


/** VPWeatherServerHourlyModel
 天气状态码对应天气状态关系 逐小时的状态与此关系一致
 “()” 表示不包含
 "[]" 表示包含
 
 [0,   4]          表示 - 晴天
 (4, 12]          表示 - 晴转多云
 (12, 16]        表示 - 阴天
 (16, 20]        表示 - 阵雨
 (20, 24]        表示 - 雷阵雨
 (24, 32]        表示 - 冰雹
 (32, 40]        表示 - 小雨
 (40, 48]        表示 - 中雨
 (48, 56]        表示 - 大雨
 (56, 72]        表示 - 暴雨
 (72, 84]        表示 - 小雪
 (84, 100]      表示 - 大雪
 (100, 155]    表示 - 多云
 其它 - 未知
 
 */

Page({

  /**
   * 页面的初始数据
   */
  data: {
    weatherSwitch: false,
    unitSwitch: false,
    everydayData: [
      {
        dateTime: "2024-06-04",
        weatherByDay: 56,
        maxFahrenheit: "80.40000000000001",
        minFahrenheit: "75.59999999999999",
        weatherByNight: 56,
        ultravioletLight: 2,
      },
      {
        dateTime: "2024-06-05",
        weatherByDay: 48,
        maxFahrenheit: 80,
        minFahrenheit: "75.8",
        weatherByNight: 48,
        ultravioletLight: 7,
      },
      {
        dateTime: "2024-06-06",
        weatherByDay: 40,
        maxFahrenheit: "82.5",
        minFahrenheit: "75.8",
        weatherByNight: 40,
        ultravioletLight: 10,
      },
      {
        dateTime: "2024-06-07",
        weatherByDay: 40,
        maxFahrenheit: "82.5",
        minFahrenheit: "76.90000000000001",
        weatherByNight: 40,
        ultravioletLight: 7,
      }
    ],
    todayData: [
      {
        weatherStatus: 40,
        fahrenheit: "75.8",
        dateTime: "2024-06-04-10-00",
      },
      {
        weatherStatus: 48,
        fahrenheit: "75.59999999999999",
        dateTime: "2024-06-04-11-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "75.8",
        dateTime: "2024-06-04-12-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: 76,
        dateTime: "2024-06-04-13-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.40000000000001",
        dateTime: "2024-06-04-14-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.59999999999999",
        dateTime: "2024-06-04-15-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.40000000000001",
        dateTime: "2024-06-04-16-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.40000000000001",
        dateTime: "2024-06-04-17-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.2",
        dateTime: "2024-06-04-18-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.2",
        dateTime: "2024-06-04-19-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.2",
        dateTime: "2024-06-04-20-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "75.8",
        dateTime: "2024-06-04-21-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "75.8",
        dateTime: "2024-06-04-22-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "77.09999999999999",
        dateTime: "2024-06-04-23-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "78.5",
        dateTime: "2024-06-05-00-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "79.40000000000001",
        dateTime: "2024-06-05-01-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "79.8",
        dateTime: "2024-06-05-02-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "79.59999999999999",
        dateTime: "2024-06-05-03-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: 80,
        dateTime: "2024-06-05-04-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "79.09999999999999",
        dateTime: "2024-06-05-05-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "78.90000000000001",
        dateTime: "2024-06-05-06-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "77.8",
        dateTime: "2024-06-05-07-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: "76.59999999999999",
        dateTime: "2024-06-05-08-00",
      },
      {
        weatherStatus: 40,
        fahrenheit: 76,
        dateTime: "2024-06-05-09-00",
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(this.getDateday())
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.notifyMonitorValueChange()
    this.readData()
  },

  readData() {
    veepooFeature.veepooSendReadWeatherForecastDataManager()
  },



  SendWeatherForecastDataManager() {
    let self = this
    let date = new Date();
    let year = date.getFullYear(); // 年
    let totalMonth = date.getMonth() + 1 > 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
    let dayss = date.getDate() > 10 ? (date.getDate()) : '0' + (date.getDate());
    let todayData = [];

    // 获取当前时间
    let currentDate = new Date();

    // 往后24小时，以小时为间隔
    for (let i = 1; i <= 24; i++) {
      let futureDate = new Date(currentDate.getTime() + i * 60 * 60 * 1000);
      let year = futureDate.getFullYear();
      let month = ('0' + (futureDate.getMonth() + 1)).slice(-2);
      let day = ('0' + futureDate.getDate()).slice(-2);
      let hours = ('0' + futureDate.getHours()).slice(-2);
      let minutes = ('0' + futureDate.getMinutes()).slice(-2);

      let obj = {
        dateTime: `${year}-${month}-${day}-${hours}-00`, //时间
        fahrenheit: 77, // 华氏度
        weatherStatus: 48, //天气状态
      }
      todayData.push(obj)
    }

    let everydayData = this.data.everydayData;
    let dateDay = this.getDateday();

    dateDay.forEach((item: any, index: number) => {
      everydayData[index].dateTime = item.day
    })


    let hour = date.getHours()
    let value = {
      cityName: '南山', // 城市名称
      dateTime: `${year}-${totalMonth}-${dayss}-${hour}-00`, //最后更新时间
      // 现在数据  间隔三小时，4次
      todayData: todayData,
      // 每天数据
      everydayData: everydayData
    };
    console.log("value==>", value);

    veepooFeature.veepooSendWeatherForecastDataManager(value, function (e: any) {
      console.log("e=>", e)
    })
  },

  getDateday() {

    let self = this;
    // 获取当前日期的年月日
    var currentDate = new Date();
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth() + 1; // 月份从 0 开始，所以需要加 1
    var day = currentDate.getDate();
    let day1 = year + "-" + this.getDateFill0(month) + "-" + this.getDateFill0(day);

    // 获取往后一天的日期
    var nextDay = new Date(year, month - 1, day + 1); // 月份需要减 1
    let day2 = nextDay.getFullYear() + "-" + self.getDateFill0((nextDay.getMonth() + 1)) + "-" + self.getDateFill0(nextDay.getDate())

    // 获取往后两天的日期
    var nextTwoDays = new Date(year, month - 1, day + 2);
    let day3 = nextTwoDays.getFullYear() + "-" + self.getDateFill0((nextTwoDays.getMonth() + 1)) + "-" + self.getDateFill0(nextTwoDays.getDate())

    // 获取往后三天的日期
    var nextThreeDays = new Date(year, month - 1, day + 3);
    let day4 = nextThreeDays.getFullYear() + "-" + self.getDateFill0((nextThreeDays.getMonth() + 1)) + "-" + self.getDateFill0(nextThreeDays.getDate());

    // 获取往后四天的日期
    var nextFourDays = new Date(year, month - 1, day + 4);
    let day5 = nextFourDays.getFullYear() + "-" + self.getDateFill0((nextFourDays.getMonth() + 1)) + "-" + self.getDateFill0(nextFourDays.getDate());

    return [
      {
        day: day1
      },
      {
        day: day2
      },
      {
        day: day3
      },
      {
        day: day4
      },
    ]

  },

  getDateFill0(num: any) {
    return num < 10 ? '0' + num : num
  },

  weather() {
    let weatherSwitch = this.data.weatherSwitch;
    this.setData({
      weatherSwitch: !weatherSwitch
    })
  },

  unit() {
    let unitSwitch = this.data.unitSwitch;
    this.setData({
      unitSwitch: !unitSwitch
    })
  },

  settingData() {
    let weatherSwitch = this.data.weatherSwitch;
    let unitSwitch = this.data.unitSwitch;
    let data = {
      switch: weatherSwitch,
      unit: unitSwitch ? 1 : 0 
    }
    veepooFeature.veepooSendSettingWeatherForecastInfoManager(data);
  },

  // 监听订阅 notifyMonitorValueChange
  notifyMonitorValueChange() {
    let self = this;
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      if (e.type == 10) {
        let device = e.content;
        console.log("e=>", e)
        self.setData({
          weatherSwitch: device.switch || e.switch,
          unitSwitch: device.unit == '摄氏度' ? false : true,
        })
      }
    })
  },

})