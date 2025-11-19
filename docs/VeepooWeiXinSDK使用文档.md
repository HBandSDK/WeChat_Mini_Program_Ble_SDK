

# **维亿魄微信SDK接口说明**



[TOC]





## 微信sdk各模块区分 

veepooBle 蓝牙模块  进行蓝牙设备的扫描，连接，监听，断开等功能。
veepooFeature 功能模块 各功能接口模块，用于读取数据，操作手环等。

##### 备注：sdk和sdkdemo只能在真机环境下进行调试

## **蓝牙扫描接口说明**



### 扫描蓝牙

##### 前提

确保手机系统蓝牙，定位开启的状态下，调用接口，返回找到的蓝牙设备，每一个设备一个回调值。

这个接口将微信蓝牙api中的初始化蓝牙，获取蓝牙适配器，开始搜寻蓝牙外围设备，获取蓝牙外围设备列表集成。

##### 接口

```js
veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice
```

##### 传入参数

无

##### 使用示例

```js
import { veepooBle} from '../../miniprogram_dist/index'
// e表示当前扫描到设备返回的callback信息
veepooBle.veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice(function(res){
  console.log('res=>',res)
})
```

##### 回调
场景：
成功返回：附近的蓝牙设备
错误返回：接口调用错误，一般是手机配置不符，如蓝牙，定位等没有打开，根据错误返回进行相关操作。

------



### 停止扫描

##### 前提

当扫描到需要连接的蓝牙设备，或离开当前界面时，需要调用停止扫描接口，如果不调用停止扫描接口，会占用手机大量的资源。

##### 接口

```
veepooWeiXinSDKStopSearchBleManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooBle } from '../../miniprogram_dist/index'

veepooBle.veepooWeiXinSDKStopSearchBleManager(function(res){
console.log("res=>",res)
})
```

##### 回调

停止扫描设备成功或失败的回调

------



### 连接设备

##### 前提

确保手机蓝牙开启，且蓝牙初始化完成后，将需要连接的蓝牙设备mac作为参数传入。

##### 接口

```js
veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager
```

##### 传入参数

需要连接的设备mac

##### 使用示例

```js
import { veepooBle } from '../../miniprogram_dist/index'
let value = {
deviceId:'设备的mac'
}
veepooBle.veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager(value,function(e){
console.log("e=>",e)
})
```

##### 回调

连接设备成功或连接设备失败的回调。

------



### 订阅监听

##### 前提

确保手机蓝牙开启，并且初始化蓝牙，连接蓝牙后调用。

##### 接口

```js
veepooWeiXinSDKNotifyMonitorValueChange
```

##### 传入参数

无

##### 使用实例

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function(e){
console.log("e=>",e)
})
```

##### 回调

返回经过蓝牙解析的数据 

------



#### 单独监听蓝牙数据返回
单独监听蓝牙数据返回接口，是让有能力进行单独开发蓝牙连接代码的开发者调用

简易流程：

1. 获取手机设置；
2. 初始化蓝牙；
3. 搜索蓝牙；
4. 连接蓝牙；
5. 获取设备服务；
6. 获取设备特征值；
7. 开启订阅；
8. 监听蓝牙数据返回（可直接替换成veepooWeiXinSDKBLECharacteristicValueChangeManager接口）

##### 接口

```js
veepooWeiXinSDKBLECharacteristicValueChangeManager
```

##### 使用示例

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKBLECharacteristicValueChangeManager(function(e){
console.log("e=>",e)
})
```
##### 回调
返回经过解析的蓝牙数据

------



### 断开设备连接

##### 前提

蓝牙初始化，已连接蓝牙设备

##### 接口

```js
veepooWeiXinSDKloseBluetoothAdapterManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooBle } from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKloseBluetoothAdapterManager(function(e){
console.log("e=>",e)
})
```

##### 回调

断开成功的回调

------



### 监听蓝牙断开

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooWeiXinSDKBLEConnectionStateChangeManager
```

##### 使用示例

```js
import { veepooBle } from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKBLEConnectionStateChangeManager(function(e){
console.log("e=>",e)
})
```

##### 回调

返回蓝牙断开后的回调信息

------



### 获取已连接的蓝牙设备

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooWeiXinSDKGetConnectedBleDeviceManager
```

##### 使用示例

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKGetConnectedBleDeviceManager(function(e){
console.log("e=>",e)
})
```

##### 回调
小程序已连接的蓝牙设备

------



### 封装蓝牙的相关方法

```js
  veepooWeiXinSDKGetSettingManager, // 获取手机设置
  veepooWeiXinSDKOpenBluetoothAdapterManager, // 初始化蓝牙
  veepooWeiXinSDKStartBluetoothDevicesDiscoveryManager, // 搜索蓝牙
  veepooWeiXinSDKBluetoothDeviceFoundManager, // 搜索附近蓝牙设备，搜索到一个返回一个
  veepooWeiXinSDKGetBluetoothDevicesManager, // 搜索附近蓝牙设备，只返回一次
  veepooWeiXinSDKStopSearchBleManager, // 停止蓝牙搜索
  veepooWeiXinSDKBlueConnectionManager, // 连接蓝牙
  veepooWeiXinSDKGetDeviceServicesManager, // 获取设备服务
  veepooWeiXinSDKGetDeviceCharacteristicsManager, // 获取设备特征值
  veepooWeiXinSDKOpenNotifyManager, // 订阅特征值
  veepooWeiXinSDKBLECharacteristicValueChangeManager, // 监听数据返回
  veepooWeiXinSDKWriteBLECharacteristicValueManager, //写入数据
  veepooWeiXinSDKloseBluetoothAdapterManager, //断开蓝牙
  veepooWeiXinSDKBLEConnectionStateChangeManager, // 蓝牙连接状态
  veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice, // 获取配置，蓝牙初始化，扫描蓝牙等合集
  veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager, // 连接蓝牙，获取蓝牙服务，获取特征值等集合
  veepooWeiXinSDKNotifyMonitorValueChange, // 订阅信息,监听数据返回等集合
  veepooWeiXinSDKGetConnectedBleDeviceManager, // 获取已连接的蓝牙设备
  veepooWeiXinSDKUpdateDeviceDialServiceManager, // 切换ui服务
  veepooWeiXinSDKNotifyECGValueChange, // 监听ECG测量特征
```



## **功能接口说明**

功能接口需要进行秘钥认证后才能正常使用，否则返回错误信息



### 秘钥认证

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooBlePasswordCheckManager
```

##### 传入参数

无

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooBlePasswordCheckManager();
```

##### 回调

认证成功 || 认证失败回调

功能汇总，消息推送，公英制开关等功能信息

------



#### 功能汇总（秘钥认证返回）

##### 第一包

| drinkingAlcoholType | bloodPressureType | healthTipsType | skinColorType | WechatCampaignType | cameraType | fatigueType | bloodOxygenTyep | heartRateAlarmType | brightScreenType | femaleType | brightnessAdjustmentType | highEndBloodPressureType | heartRateFunctionType |
| ------------------- | ----------------- | -------------- | ------------- | ------------------ | ---------- | ----------- | --------------- | ------------------ | ---------------- | ---------- | ------------------------ | ------------------------ | --------------------- |
| 饮酒                | 血压              | 健康提醒       | 肤色类型      | 微信运动           | 拍照       | 疲劳度      | 血氧功能        | 心率报警           | 翻腕亮屏设置     | 女性项目   | 屏幕亮度调节             | 高端血压                 | 心率功能              |

##### 第二包

| countdownTimeType | dailyDataReadDayType | HIDFunctionType | modeOfMotionStorageNumberType | UIStyleType | respiratoryRateFunctionType | HRVType              | weatherFunctionType | screenDurationType | sleepFlagBitType | clearDataBitsType | ECGFunction | motionModeType |
| ----------------- | -------------------- | --------------- | ----------------------------- | ----------- | --------------------------- | -------------------- | ------------------- | ------------------ | ---------------- | ----------------- | ----------- | -------------- |
| 倒计时功能        | 日常数据读取天数     | HID功能         | 运动模式存储次数              | UI风格类型  | 呼吸率功能                  | 血氧洛仑兹散点图-HRV | 天气功能            | 亮屏时长           | 睡眠标志位       | 清除数据标志位    | Ecg功能     | 运动模式类型   |

##### 第三包

| dialNumberType       | addressBookType | musicFunctionType | bodyTemperatureFunctionType | lookupFunctionType | lookupFunctionType | GPSFunctionType | geomagneticFunctionType | resetPasswordFunctionType | testMicrophoneFunctionType | bloodGlucoseFunction | chipSeriesType | metaFunctionType | pressureFunctionType |
| -------------------- | --------------- | ----------------- | --------------------------- | ------------------ | ------------------ | --------------- | ----------------------- | ------------------------- | -------------------------- | -------------------- | -------------- | ---------------- | -------------------- |
| 更多表盘和自定义数量 | 通讯录类型      | 音乐功能          | 体温功能                    | 手机查找手环功能   | AGPS功能           | GPS功能         | 地磁功能                | 重设密码功能              | 测麦功能                   | 血糖功能             | 芯片系列       | 梅托功能         | 压力功能             |

##### 第四包

| bloodComponentType | bodyCompositionType | worldClockType | bodyTemperatureAlarmType | walletType | businessCardType | gameFeatureType | alQuestionAndAnswerType | alDialType | distanceAndCalorieType | videoDialType | photoAlbumPhotosType | 4GFeatureType | electronicBusinessCardType | healthAssistanceType | microCheckType |
| ------------------ | ------------------- | -------------- | ------------------------ | ---------- | ---------------- | --------------- | ----------------------- | ---------- | ---------------------- | ------------- | -------------------- | ------------- | -------------------------- | -------------------- | -------------- |
| 血液成分功能       | 身体成分功能        | 世界时钟       | 体温报警                 | 钱包       | 名片             | 游戏功能        | al问答                  | al表盘     | 距离与卡路里目标       | 视频表盘      | 相册相片             | 4G 功能       | 电子名片                   | 健康辅助评估         | 微体检         |

* 血压

  * 0，无此功能
  * 1，有血压功能，血压默认有校准功能
  * 2，有血压功能，(DidoFit App)血压自动监测开关显示成血压自动评估
  * 3，气泵血压类型，无ADC
  * 4，有血压功能(效果同1)，设备端手动测量单独读取
  * 5，气泵血压类型，有ADC

* 健康提醒：(原来定义是久坐)

  0，无此功能
  1，有原久坐提醒
  2，有健康提醒，且本功能模块下的久坐互斥，

* 女性项目：

  0 不具备此功能
  1 app在非中文（英文除外）的时候会推送中文
  2 非中文以外的app语言都推送英文
  3 支持12国语言

* 心率功能：

  0 支持心率功能（默认）
  1 不具备此功能，

* 翻腕亮屏设置:

  0 没有，APP会显示老的抬手亮屏功能
  1 有该功能
  2 没有且没有抬手亮屏

* 呼吸率功能：

  0  不支持
  1  血氧手环
  2  ECG测量呼吸率

* 天气功能：

  0 不支持
  1 天气开关可更改，可显示当前温度和当天、明天的最低最高温度
  2 天气开关固定为开,不可更改
  3 天气开关可更改，只可显示当天和明天的最低最高温度
  4 只需要显示当前的温度状态
  6 手环显示紫外线强度

* HRV:

  0 不支持
  1 血氧手环
  2 ECG手环
  3 全天HRV，手环和APP都显示24小时


* 亮屏时长：

  0 无此功能
  1 有此功能

* 睡眠标志位：

  1 精准睡眠
  2 无睡眠   

* Ecg功能标志：

  0 没有ecg功能
  1 有ecg功能

* 体温功能：
  0 表示没有该功能
  1 表示设备有体温手动检测功能，但是不在App上展示
  2 表示设备有体温手动检测和自动检测功能，自动检测读取使用
  5 表示设备有体温手动检测和自动检测功能，日常数据中

* 血糖功能

  0 无血糖功能
  1 有血糖功能，在日常数据读取
  3 仅有私人模式，无日常数据、单次测量

* 血液成分功能

  0 无该功能
  1 有血脂+尿酸功能
  2 有该功能

* 身体成分功能

  0 无该功能
  1 有身体成分功能
  
* 体温报警

  0 无该功能

  1 有体温过高过低提醒

* 钱包(收款码)

  0 无该功能

  每个平台的有无按照1个BIT确认，0代表无、1代表有，从高BIT位依次是：支付宝、微信、QQ，其他没有用到的预留默认值为0

* 名片

  0 无该功能

  每个平台的有无按照1个BIT确认，0代表无、1代表有，从高BIT位依次是：微信、QQ、Facebook、Instagram，其他没有用到的预留默认值为0

* 游戏功能

  0 无该功能或不需要App上有任何处理

  1 有游戏功能

* AI智能问答

  0 无该功能

  1 有该功能，且为非中国大陆区

  2 有该功能，且为中国大陆区

* AI表盘

  0 无该功能

  1 有该功能，且为非中国大陆区

  2 有该功能，且为中国大陆区

* 运动控制协议支持

  0 不支持

  1 支持

* 相册相片功能

  0 不支持

  1 支持

* 4G功能

  0 不支持

  1 支持

* 电子名片（该功能与钱包功能、名片功能互斥，开启该功能需要关闭钱包功能、名片功能）

  0 不支持

  1 支持

* 健康辅助评估

  0不支持

  大于0 支持

* 微体检功能

  0 不支持APP端

  1 支持APP端

------



#### 消息推送

##### 第一包

| VPSettingCall | VPSettingSMS | VPSettingWechat | VPSettingQQ | VPSettingSina | VPSettingFaceBook | VPSettingTwitter | VPSettingFlickr | VPSettingLinkedln | VPSettingwhatsapp | VPSettingLine | VPSettingInstagram | VPSettingSnapchat | VPSettingSkype | VPSettingGMail | VPSettingDingTalk | VPSettingWeChatWork | VPSettingOthers |
| ------------- | ------------ | --------------- | ----------- | ------------- | ----------------- | ---------------- | --------------- | ----------------- | ----------------- | ------------- | ------------------ | ----------------- | -------------- | -------------- | ----------------- | ------------------- | --------------- |
| 来电          | 短信         | Wechat          | QQ          | Sina          | FaceBook          | Twitter          | Flickr          | Linkedln          | whatsapp          | Line          | Instagram          | Snapchat          | Skype          | Gmail          | 钉钉              | 企业微信            | 包数/其他       |

##### 第二包

| VPSettingOtherTikTok | VPSettingOtherTelegram | VPSettingOtherConnected2 | VPSettingKakaoTalk | VPSettingJingYou | VPSettingMessenger |
| :------------------: | ---------------------- | ------------------------ | ------------------ | ---------------- | ------------------ |
|        tiktok        | telegram               | connected2               | KakaoTalk          | 警右             | Messenger          |

消息推送值解释

noThisFeature   没有此功能

start  开启

stop 关闭

------




#### 公英制开关

##### 第一包

| VPSettingMetric | VPSettingTimeFormat | VPSettingAutomaticHRTest | VPSettingAutomaticBPTest | VPSettingExercise | VPSettingVoiceAnnouncements | VPSettingSearchPhoneInterFace | VPSettingStopwatchInterFace | VPSettingOxygenLowerRemind | VPSettingLedGrade | VPSettingAutomaticHRVTest | VPSettingAutoAnswer | VPSettingDisconnectRemind | VPSettingSOSRemind | VPSettingAutomaticPPGTest | VPSettingAccurateSleep | VPSettingMusicControl |
| --------------- | ------------------- | ------------------------ | ------------------------ | ----------------- | --------------------------- | ----------------------------- | --------------------------- | -------------------------- | ----------------- | ------------------------- | ------------------- | ------------------------- | ------------------ | ------------------------- | ---------------------- | --------------------- |
| 公制/英制       | 12/24小时制         | 心率自动检测             | 血压自动检测             | 运动过量提醒      | 心率/血氧/血压播报          | 手机查找界面显示              | 秒表功能界面显示            | 血氧过低通知               | LED肤色档位       | HRV自动检测               | 来电自动接听        | 蓝牙断连提醒              | 求救页面显示       | PPG自动测量               | 精准睡眠               | 音乐控制开关          |

##### 第二包

| VPSettingLongpressUnlock | VPSettingMessageScreenLight | VPSettingAutomaticTemperatureTest | VPSettingTemperatureUnit | VPSettingECGNormallyOpen | VPSettingAutomaticBloodGlucoseTest | VPSettingMetoFunctionSwitch | VPSettingPressureFunctionSwitch | VPSettingBloodGlucoseUnit | VPSettingAutomaticBloodCompTest | VPSettingUricAcidUnit | VPSettingLipidUnit | VPSettingFallWarning |
| ------------------------ | --------------------------- | --------------------------------- | ------------------------ | ------------------------ | ---------------------------------- | --------------------------- | ------------------------------- | ------------------------- | ------------------------------- | --------------------- | ------------------ | -------------------- |
| 长按解锁                 | 消息亮屏                    | 体温自动监测                      | 体温单位设置             | ECG常开开关              | 血糖功能开关                       | 梅托功能开关                | 压力功能开关                    | 血糖单位设置              | 血液成分开关                    | 尿酸单位设置          | 血脂单位设置       | 跌倒提醒开关         |



**开关类:** 
open 开启
close  关闭

noThisFeature 没有此功能



**英制/公制:**   
metricSystem，表示公制(默认)
english，表示英制

**12/24小时制:**
24，表示24小时(默认)
12，表示12小时 

**体温单位**：
degreeCelsius 摄氏度
fahrenheit 华氏度

**血糖单位设置:**
 mmol/L
 mg/dl


**尿酸单位设置:**
 μmol/L
 mg/dl

**血脂单位设置:**
mmol/L
mg/dl



##### 回调


```js
{
  name:"蓝牙秘钥核准",
  type:1,// type 等于1 表示蓝牙秘钥核准回调
  content: {
    VPDevicepassword, 
    VPDeviceAck, // 核验结果
    VPDeviceVersion, // 设备版本
    VPDeviceRaiseHand, //抬手亮屏 
    VPDeviceMAC, // 设备mac地址
    VPDeviceFindPhone, // 放丢失功能
    VPDeviceWearFlag, // 佩戴检测
  }
}
```

```js
      值：VPDevicepassword
      
      // code 代表核验不通过
      return 'verifyNotPass'
      // code 核验通过
      return 'passTheVerification'
      // code 设置不成功
      return 'setupFailed'
      // code 设置成功
      return 'setupSuccessful'
      // code 读取不成功
      return 'readFailed'
      // code 读取成功
      return 'readSuccessful '
      // 密码和时间都校验成功
      return 'successfulVerification'
      
      
      值：VPDeviceRaiseHand
      
      // 开启，有效时间段为22：00-08：00
      return 'open'
      // 表示没有此功能
      return 'noThisFeature'
      
      
      值：VPDeviceFindPhone ||  VPDeviceWearFlag
      // 没有此功能
      return 'noThisFeature'
      // 开启功能
      return 'open'
      // 关闭功能
      return 'close'
      
```

------



### 读取电池电量
注意⚠️:表盘传输和ota会有较大功耗，在进行表盘传输和ota时，需要增加电量限制，当发起表盘传输或者ota前，需要先读取电池电量，建议电池电量在30%以上，才允许进行传输或升级。

##### 前提

设备已连接

##### 接口

```js
veepooReadElectricQuantityManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooReadElectricQuantityManager();
```

##### 回调
返回的电量信息

```js
{
      name:"电池电量读取",// 描述
      type:2,// type 等于2表示当前返回信息属于电量读取
      content: {
        VPDeviceIsPercent, // 电量是否显示百分百 true : false
        VPDeviceElectricPercent, // 当前设备电量，显示百分百出现
        VPDeviceElectricGrade，// 电量等级 显示等级出现
        VPDeviceElectricTypeIsLowVoltage // 是否低电，normal 正常，lowVoltage 低电
      }
}

```

------



### 同步个人信息
注意：在使用女性功能前，需要先同步个人信息到手环设备，并且个人信息的身高体重会影响卡路里的计算。

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooSynchronizingPersonalInformationManager
```

##### 传入参数

| 参数   | 类型   | 备注               |
| ------ | ------ | ------------------ |
| height | string | 身高 单位为 cm            |
| weight | string | 体重 单位为 kg            |
| age    | string | 年龄               |
| sex    | string | 性别  0 女 1 男    |
| steps  | string | 目标步数           |
| sleep  | string | 目标睡眠  单位分钟 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
 let data = {
     height: '173',// 身高
     weight: '55',//体重
     age: '21',// 年龄
     sex: '1',// 性别
     steps: '8000',// 目标步数
     sleep：'420',// 目标睡眠分钟
  }     
veepooFeature.veepooSynchronizingPersonalInformationManager(data);
```

##### 回调

返回同步成功的回调

```js
{
  name:"同步个人信息", 当前功能描述
  type:3,// type 等于3，表示当前回调是个人信息同步 
  content:{
    settingState:true;// 同步成功
  }
}
```

------



### 读取精准睡眠数据

设备中睡眠数据保存三天，睡眠数据有单段或多段，入起夜再次入睡后，会产生第二段睡眠数据

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooSendReadPreciseSleepManager
```

##### 传入参数

| 参数 | 类型   | 备注                  |
| ---- | ------ | --------------------- |
| day  | number | 0 今天  1 昨天 2 前天 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day:0,// 0 今天  1 昨天 2 前天
}
veepooFeature.veepooSendReadPreciseSleepManager(data);
```

##### 回调

返回读取精准睡眠成功的回调


```js
{
readDay:0,// 读取天数  0 今天  1 昨天  2 前天
Progress:100%,// 读取进度 0-100,
name:"精准睡眠数据",// 当前功能描述
type:4,// type 等于4表示当前回调是睡眠数据
content:{
          fallAsleepTime, // 入睡时间
          exitSleepTime, // 退出睡眠时间
          nightScore, //起夜得分
          deepSleepScore, // 深睡得分
          sleepEfficiencyScore, // 睡眠效率得分
          fallAsleepEfficiencyScore, // 入睡效率得分
          sleepTimeScore, // 睡眠时长得分
          sleepQuality, //睡眠质量
          deepSleepTime, // 深睡时长
          lightSleepTime, // 浅睡时长
          otherSleepTime, // 其他睡眠时长
          sleepTotalTime, // 睡眠总时长
          firstDeepSleepTime, // 首次深睡眠时长
          nightTotalTime, // 起夜总时长
          nightDeepSleepMeanValue, // 起夜到深睡均值
          insomniaScore, // 失眠得分
          insomniaCount, //失眠次数
          sleepCurve, //睡眠曲线
 }
}
```

睡眠曲线：“11111111111111111111111111000000000000000000000000011111111111122222222211111111111114444411111111111111111114444”

0深睡，1浅睡，2快速眼动，3失眠，4苏醒

如何使用：参考G Band（android，ios，HarmonyOS）取 0 1 2 4，小程序可使用canvas绘制睡眠曲线，在高度100，宽度自定义的画布绘制，每段25高度，使用不同颜色绘制区分曲线值。

------



### 读取日常数据

日常数据保存三天时间，包含计步，运动量，脉率，血压，血氧，血糖，压力，血液，体温等信息。

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooSendReadDailyDataManager
```

##### 传入参数

| 参数    | 类型   | 备注                      |
| ------- | ------ | ------------------------- |
| day     | number | 读取天数  0 今天 1 昨天 2 前天  |
| package | number | 开始包 默认1 第一个包开始  |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day:0，
   packages:1,
}
veepooFeature.veepooSendReadDailyDataManager(data);
```

##### 回调

读取日常数据发送成功的回调


```js
{
Progress:100,// 读取进度 1-100%
name:"读取日常数据",
type:5,// type 等于5表示日常数据回调
content:{
   let date = ''
  //  计步相关 stepCount 步 数  amountOfExercise  运动量 distance 距离 calorie,卡路里 wear 佩戴
  let step = ''
  //  睡眠相关  6个睡眠状态
  let sleepData = ''
  //  脉率相关 5个脉率
  let pulseReat = ''
  //  心率相关  5个心率
  let heartReat = ''
  //  呼吸率相关  5个呼吸率
  let respirationRate = ''
  // 血压相关  高低压
  let bloodPressure = ''
  // 5个HRV值
  let HRVData = []
  //  血氧相关  取前5个数，代表5个血氧值
  let bloodOxygen = {
         oxygens， //血氧
         apneaResults， //呼吸暂停次数
         isHypoxias， //呼吸暂停结果
         hypoxiaTimes， //低氧时间
         cardiacLoads， //心脏负荷
         corrects， //血氧矫正
  }
  //  睡眠活动相关   算法用到，应用层不做处理
  let sleepAmountActivity = ''
  //  睡眠状态量25个 算法用到，应用层不做处理
  let sleepStatus = ''
  //  复位 可不做处理
  let reset = ''
  let g5Series = ''
  //  血糖相关
  let bloodGlucose = ''
  //  梅托相关
  let meiTuo = ''
  //  压力相关
  let pressure = ''
  //  血液相关
  let bloodLiquid = {
      cholesterol,//总胆固醇
      triacylglycerol,//甘油三酯
      highDensity,//高密度脂蛋白
      lowDensity,//低密度脂蛋白
      uricAcidVal,//尿酸值
  } 
  //  体温相关
  let bodyTemperature = '' // 如果值为空，需要在特定的读取自动体温数据接口读取

}
}
```

------



### 体温测量     

##### 前提

蓝牙设备已连接，并且设备支持该功能

##### 接口

```js
veepooSendTemperatureMeasurementSwitchManager
```

##### 传入参数

| 参数   | 类型 | 备注                 |
| ------ | ---- | -------------------- |
| switch | BOOL | true 开启  false关闭 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
switch:true,// true 开启 false  关闭
}
veepooFeature.veepooSendTemperatureMeasurementSwitchManager(data);
```

##### 回调

返回体温检测成功回调


注意：并不是一次性全部返回以上值，如测试过程中不返回content，没有其他测试正在进行中不会返回deviceDetectionInfo

```js
{
  name:"体温检测",
  type:6,// type 等于6表示手动体温检测
  switch:true,// 开启或关闭测试  true 开启 false  关闭
  Progress:100,// 0-100%，测试进度
  deviceDetectionInfo:"",// 设备检测信息，枚举
    content: {
    bodySurfaceTemperature, //体表温度
    bodyTemperature, // 体温
    }
}
```

deviceDetectionInfo枚举

```js
      deviceDetectionInfo: 'usable', //可用
      deviceDetectionInfo: 'beMeasuringBloodPressure', //设备正在测量血压
      deviceDetectionInfo: 'beMeasuringHeartRate', //设备正在测量心率
      deviceDetectionInfo: 'beMeasuringAuto', //设备正在测量 五分钟自动
      deviceDetectionInfo: 'beMeasuringBloodOxygen', //设备正在测量血氧
      deviceDetectionInfo: 'beMeasuringFatigue', //设备正在测量疲劳度
      deviceDetectionInfo: 'beMeasuringECG', //设备正在测量ECG
      deviceDetectionInfo: 'beMeasuringBodyTemperature', //设备正在测量 体温（自动测量）可用
      deviceDetectionInfo: 'atLowVoltage', //设备处于低电
      deviceDetectionInfo: 'wrongfulValue', //设备温度传感器异常，给带出来的不法值
```

------



### 体温数据自动检测读取

体温数据读取完成后，将数据保存到本地或者数据库中，下次读取可以根据上一次保存的数据包数，减少读取时间

在手环功能汇总，有体温类型

体温类型 0: 表示没有 1: 有体温但无自动测量 2/4/5: 有体温且有自动测量

体温类型5的自动测量数据读取被整合到日常数据读取中了，不需要调用单独的接口去触发读。

##### 前提

蓝牙设备已连接，设备支持该功能

##### 接口

```js
veepooReadAutoTemperatureMeasurementDataManager
```

##### 传入参数

| 参数    | 类型   | 备注                           |
| ------- | ------ | ------------------------------ |
| day     | number | 读取天数  0 今天 1 昨天 2 前天 |
| package | number | 读取包数 默认1包开始，读取全部包 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day: 0,//读取天数 0 今天  1 昨天 2 前天
   package: 1, // 当前报数开始读取
}
veepooFeature.veepooReadAutoTemperatureMeasurementData(data)  
```

##### 回调

返回读取体温自动检测成功回调


```js
{
  Progress:100,// 读取进度 0-100%
  name:"体温自动检测",
  type:7,// type  等于7表示体温自动监测回调
  content:{

    totalData:[
        {
            time,//时间
            bodySurfaceTemperature, //体表温度  
            bodyTemperature, // 体温
        },// 会返回多个体温数据，这里展示一个
    ]
 }
}
```

------



### 读取计步数


##### 前提

设备已连接

##### 接口 

```js
veepooReadStepNumberManager
```

##### 传入参数

| 参数 | 类型   | 备注                          |
| ---- | ------ | ----------------------------- |
| day  | number | 读取天数 0 今天 1 昨天 2 前天 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
 let data = {
        day: 0,// 0 今天 1 昨天 2 前提
     }
veepooFeature.veepooReadStepNumberManager(data);
```

##### 回调


```js
{
    name:"读取计步数",
    type:8,// type 等于8 表示读取计步数回调
    content: {
      stepNumber,// 读取到的步数
      day,// 当前读取的天数
    }
}
```

day枚举

```js
   day:'today',// 今天
   day:'yesterday',// 昨天
   day:'theDayBeforeYesterday',//前天
```

------



### 读取实时计步数，卡路里，距离

计步，卡路里，距离在本接口读取返回的数据是实时的，与日常数据的步数有差别，在日常数据中，每5分钟的汇总，存在滞后性。如果应用层需要同步获取设备端步数，需要在固定频率调用本接口获取数据

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooReadStepCalorieDistanceManager
```

##### 传入参数

| 参数 | 类型   | 备注                          |
| ---- | ------ | ----------------------------- |
| day  | number | 读取天数 0 今天 1 昨天 2 前天 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
 let data = {
        day: 0
     }
veepooFeature.veepooReadStepCalorieDistanceManager(data);
```

##### 回调


```js
{
    name:"读取实时计步数，卡路里，距离",
    type:9,// type 等于9 表示读取实时计步，卡路里，距离
    content: {
      step,// 步数
      calorie,// 卡路里
      distance,// 距离  m米
      day,// 读取天数
    }
}
    
 day枚举
   day:'today',// 今天
   day:'yesterday',// 昨天
   day:'theDayBeforeYesterday',//前天
   day:'threeDaysAgo',//三天前
   day:'fourDaysAgo',// 四天前
```

------



### 天气功能



#### 读取手环天气信息

##### 前提

蓝牙设备已连接，并且支持该功能，应用层需要自行接入第三方天气数据，sdk内部只负责进行天气数据的传输

##### 接口

```js
veepooSendReadWeatherForecastDataManager
```

##### 传入参数

无

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadWeatherForecastDataManager();
```

##### 回调


```js
{
  name:"读取手环天气信息",
  type:10,// type 等于10 表示天气功能回调
  content:{
    switch,// 天气开关
    unit,// 天气单位
    CrcL,// crcl 这个值不需要管
    CrcH,// crch 这个值不需要管
}
}
```

------



#### 设置手环天气基本信息

##### 前提

蓝牙设备已连接，并且设备支持天气功能

##### 接口

```js
veepooSendSettingWeatherForecastInfo
```

#####  传入参数

| 参数   | 类型   | 注释                  |
| ------ | ------ | --------------------- |
| switch | BOOL   | 开关                  |
| unit   | number | 单位 0摄氏度 1 华氏度 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
	switch:true,// 天气开关
	unit:0,// 气温单位 0 摄氏度 1 华氏度
}
veepooFeature.veepooSendSettingWeatherForecastInfo(data)
```

##### 回调


```
{
  name:"设置天气基本信息",
  type:10,// type 等于10 表示天气功能回调
  content:{
    switch,// 天气开关
    unit,//单位
    CrcL,// crcl
    CrcH,// crch
}
}
```

------



#### 同步天气信息 （同步天气）

##### 前提

蓝牙设备已连接，并且设备支持天气功能

##### 使用示例

```js
veepooSendWeatherForecastDataManager
```

##### 参数
todayData 数组内是24个对象值，每一个对象值代表1小时内的天气数据，如代码时间为22日21小时往后的24小时，则：22日21小时-23日20小时，刚好是往后24小时内。
everydayData 数组内有四个对象，需要传递往后四天内的数据
```js

{
  cityName: '南山', // 城市名称
  dateTime: `${year}-${totalMonth}-${dayss}-${hour}-00`, //最后更新时间，年-月-日-时-分
  // 现在数据  间隔三小时，4次
  todayData: [
  {
    dateTime: "2024-08-22-21-00",//时间
    fahrenheit: 77,// 华氏度
    weatherStatus: 48,// 天气状态
  }
  ],
  // 每天数据
  everydayData: [
    {dateTime: "2024-08-22",maxFahrenheit: "80.40000000000001",minFahrenheit: "75.59999999999999",ultravioletLight: 2,weatherByDay: 56,weatherByNight: 56},
    {dateTime: "2024-08-23",maxFahrenheit: "80.40000000000001",minFahrenheit: "75.59999999999999",ultravioletLight: 2,weatherByDay: 56,weatherByNight: 56},
    {dateTime: "2024-08-24",maxFahrenheit: "80.40000000000001",minFahrenheit: "75.59999999999999",ultravioletLight: 2,weatherByDay: 56,weatherByNight: 56},
    {dateTime: "2024-08-25",maxFahrenheit: "80.40000000000001",minFahrenheit: "75.59999999999999",ultravioletLight: 2,weatherByDay: 56,weatherByNight: 56},
  ],// 手环传递四天数据  
}

todayData:[
  {
        weatherStatus: 40,// 天气状态
        fahrenheit: "75.8",// 华氏度
        dateTime: "2024-06-04-10-00",// 时间
  }
]
everydayData:[{
  dateTime:"",//时间
  maxFahrenheit:"",// 最大华氏度  注意：需要将摄氏度转为华氏度
  minFahrenheit:"",// 最华氏度
  ultravioletLight:"",// 紫外线强度
  weatherByDay:"",// 白天天气
  weatherByNight:"",// 夜间天气
}]

```


##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
    let value = {
      cityName: '南山', // 城市名称
      dateTime: `${year}-${totalMonth}-${dayss}-${hour}-00`, //最后更新时间
      todayData: todayData,// 现在到往后24小时数据
      everydayData: everydayData,// 4天数据
    };
    console.log("value==>", value)
    veepooFeature.veepooSendWeatherForecastDataManager(value, function (e: any) {
      console.log("e=>", e)
    })
```

##### 回调


```js
{
  name:"同步天气信息",
  type:10,// type 等于10表示 天气功能相关
  error:"",// 同步成功或同步失败提示
}
```

------



### 单位设置

注意：开关设置中的心率，血压，血氧，科学睡眠，血糖，血液自动监测开关等初始值和各个单位的初始值都是在“公英制新增开关”返回的包中获取



#### 读取公英制新增单位

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooSendReadDeviceUnitSettingDataManager
```

##### 插入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadDeviceUnitSettingDataManager();
```

##### 回调
<!-- 第一包 -->
```js
{
  "name": "公英制新增开关", 
  "type": 11, 
  "content": {
    "VPSettingMetric": "metricSystem", // 公制/英制
    "VPSettingTimeFormat": 24, // 12/24小时制
    "VPSettingAutomaticHRTest": "open", // 心率自动监测
    "VPSettingAutomaticBPTest": "open", // 血压自动监测
    "VPSettingExercise": "noThisFeature", // 运动过量提醒
    "VPSettingVoiceAnnouncements": "noThisFeature", // 心率/血氧/血压播报
    "VPSettingSearchPhoneInterFace": "noThisFeature", // 手机查找界面显示
    "VPSettingStopwatchInterFace": "noThisFeature", // 秒表功能界面显示
    "VPSettingOxygenLowerRemind": "open", // 血氧过低通知
    "VPSettingLedGrade": "open", // LED档位
    "VPSettingAutomaticHRVTest": "noThisFeature",// HRV自动检测 
    "VPSettingAutoAnswer": "noThisFeature", // 来电自动接听
    "VPSettingDisconnectRemind": "noThisFeature", // 蓝牙断连提醒
    "VPSettingSOSRemind": "noThisFeature", // 求救页面显示
    "VPSettingAutomaticPPGTest": "open", // ppg自动测量
    "VPSettingAccurateSleep": "noThisFeature", // 精准睡眠
    "VPSettingMusicControl": "noThisFeature"// 音乐控制开关
    }
}

<!-- 第二包 -->
 {
  
  "name": "公英制新增开关", 
  "type": 11, 
  "content": {
    "VPSettingLongpressUnlock": "noThisFeature",// 长按解锁
    "VPSettingMessageScreenLight": "noThisFeature",// 消息亮屏
    "VPSettingAutomaticTemperatureTest": "open",// 体温自动监测
    "VPSettingTemperatureUnit": "degreeCelsius",// 体温单位设置
    "VPSettingECGNormallyOpen": "noThisFeature",// ECG 常开开关
    "VPSettingAutomaticBloodGlucoseTest": "open",// 血糖功能开关
    "VPSettingMetoFunctionSwitch": "noThisFeature",// 梅脱功能开关
    "VPSettingPressureFunctionSwitch": "noThisFeature",// 夜里功能开关
    "VPSettingBloodGlucoseUnit": "mmol/L",// 血糖单位设置
    "VPSettingAutomaticBloodCompTest": "open",// 血液成分开关
    "VPSettingUricAcidUnit": "μmol/L",// 尿酸单位设置
    "VPSettingLipidUnit": "mmol/L"// 血脂单位设置
    "VPSettingFallWarning":"open",// 跌倒提醒开关
  }
}




**英制/公制:**   

metricSystem，表示公制(默认)

english，表示英制

**12/24小时制:**

24，表示24小时(默认)

12，表示12小时 


**开关类**

open，为开

close，为关

noThisFeature 表示没有该功能


**体温自动监测**：

start，为开

stop，为关

noThisFeature 表示没有该功能


**体温单位**：

degreeCelsius 摄氏度

fahrenheit 华氏度


**血糖单位设置:**

 mmol/L

 mg/dl


**尿酸单位设置:**

 μmol/L

 mg/dl

**血脂单位设置:**

mmol/L
mg/dl

```

------



#### 单位设置（公英制新增）

##### 前提

蓝牙设备已连接

##### 接口

```js
veepooSendUnitSettingDataManager
```

##### 传入参数

| 参数                | 类型   | 备注 |
| ------------------- | ------ | ---- |
| unitLength          | string | 长度单位|
| unitBodyTemperature | string | 温度单位|
| unitBloodSugar      | string | 血糖单位 |
| unitUricAcid        | string | 尿酸单位 |
| unitBloodLipid      | string | 血脂单位 |

##### 使用示例

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let data = {
  unitLength,//长度单位 metricSystem 表示公制(米,千米)(默认)  english，表示英制
  unitBodyTemperature, //温度单位 degreeCelsius 摄氏度  fahrenheit 华氏度
  unitBloodSugar, // 血糖 1 mmol/L  2 mg/dl
  unitUricAcid, // 尿酸 1 μmol/L  2 mg/dl
  unitBloodLipid, // 血脂 1 mmol/L  2 mg/dl
}
veepooFeature.veepooSendUnitSettingDataManager();

```

##### 回调

```js

{
  name:"公英制新增开关",
  type:11,// type 等于11 表示公英制新增开关
  settingStatus:true,// 设置成功或设置失败布尔值
}

```

------



### 联系人功能



#### 读取联系人

注意：因为微信小程序使用的是低功耗蓝牙连接，在安卓手机中，小程序不支持通话设置，ios系统手机在小程序连接蓝牙，在弹出的配对框点击配对后，能实现通话设置

##### 前提

蓝牙设备已连接，支持添加联系人，支持通话设置

##### 接口

```js
veepooSendReadContactPersonDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadContactPersonDataManager()
```

##### 回调


```js
{
  name:"读取联系人",
  type:12,// type 等于12表示 联系人功能相关
  Progress:100,// 读取进度 0-100
  content:[
      {
      id,//联系人id
      phone,//电话号码
      sosStatus// 是否是sos联系人
      }
  ]
}
```

------



#### 设置联系人

联系人设置最多支持10人，sos设置最多支持5人

##### 前提

蓝牙设备已连接，并且设备支持联系人设置

##### 接口

```js
veepooSendSettingContactPersonDataManager

```

##### 参数

| 参数          | 类型   | 备注         |
| ------------- | ------ | ------------ |
| contactNumber | number | 联系人id     |
| name          | string | 联系人名称   |
| phone         | string | 联系人手机号 |

##### 使用

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
  contactNumber: readList.length,// 联系人id
  name: "测试",// 联系人名称
  phone: '15289356892',// 手机号 这个是虚拟手机号
}
veepooFeature.veepooSendSettingContactPersonDataManager(data)
```

##### 回调


```js
{
  name:"设置联系人",
  type:12,// type 等于12 表示回调属于联系人功能
  content:{
    settingStatus:true,// 设置成功或设置失败布尔值
  }
}

```

------



#### 删除联系人

##### 前提

蓝牙设备已连接，且手表支持联系人功能

##### 接口

```
veepooSendDeleteContactPersonDataManager
```

##### 传入参数

| 参数  | 类型   | 备注     |
| ----- | ------ | -------- |
| sosId | number | 联系人id |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
  sosId: 1,// 联系人id，一般添加联系人的id是从1-10
}
veepooFeature.veepooSendDeleteContactPersonDataManager(data)
```

##### 回调

```js
{
  name:"删除联系人",
  type:12,// type 等于12表示 回调属于联系人功能相关
  content:{
    settingStatus:true,// 删除成功或失败的布尔值
  }
}

```

------



#### 调整联系人

##### 前提

蓝牙设备已连接，且设备支持联系人功能，设备中联系人数量不小于1个

##### 接口

```js
veepooSendAdjustContactPersonDataManager
```

##### 传入参数

| 参数   | 类型   | 备注                 |
| ------ | ------ | -------------------- |
| fromId | number | 当前id               |
| toId   | number | 将当前id移动到目标id |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
    fromId: 1,// 当前联系人id
    toId: 2,// 目标联系人id
}

veepooFeature.veepooSendAdjustContactPersonDataManager(data)

```

##### 回调

```js
{
  name:"调整联系人",
  type:12,// type 等于12表示 回调属于联系人功能相关
  content:{
    settingStatus:true,// 调整成功或失败的布尔值
  }
}
```

------



#### 读取sos

##### 前提

蓝牙设备已连接，且设备支持联系人功能

##### 接口

```js
veepooSendReadSOSDataManager
```

##### 传入参数

无

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'

veepooFeature.veepooSendReadSOSDataManager();
```

##### 回调

```js
{
  name:"SOS",
  type:12,// 
  ack:1,// 1 成功 其他失败
  code:2,// 1 设置 2 读取
  content:{
      times:3,// sos次数
      times_min:1,// 最小设置数
      times_max:3,// 最大设置数
  }
}
```

------



#### 设置SOS

##### 前提

蓝牙设备已连接，且设备支持联系人功能

##### 接口

```js
veepooSendSettingSOSDataManager
```

##### 传入参数

| 参数  | 类型   | 备注    |
| ----- | ------ | ------- |
| times | number | 范围1-3 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
    times:3,
}
veepooFeature.veepooSendSettingSOSDataManager(data);
```

##### 回调

```js
{
  name:"SOS",
  type:12,// 
  ack:1,// 1 成功 其他失败
  code:1,// 1 设置 2 读取
  content:[{
      times:3,// sos次数
  }]
}
```

------



### 文字闹钟功能

文字闹钟运行在设备端进行操作开关，时间设置等，但无法输入文字
设备最多支持10组闹钟，应用层应增加限制闹钟个数逻辑，否则设备可能会出现异常



#### 读取文字闹钟


##### 前提

蓝牙设备已连接，且支持文字闹钟功能

##### 接口

```js
veepooSendReadAlarmClockDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'

veepooFeature.veepooSendReadAlarmClockDataManager();
```

##### 回调

```js
{
  name:"读取文字闹钟",
  type:13,
  content: [

    {
      "alarmId": 1,// 闹钟id
      "alarmSwitch": false, // 闹钟开关
      "alarmRepeat": {
        "Monday": false, 
        "Tuesday": false, 
        "Wednesday": false, 
        "Thursday": false, 
        "Friday": false,
        "Saturday": false,
        "Sunday": false
        },// //重复天数，星期 周一到周日
      "time": "17:13",// 闹钟开始时间
      "name": null// 闹钟标签（备注）
      }
    ]
}

```

------



#### 设置文字闹钟

##### 前提

蓝牙设备已连接，且设备支持文字闹钟功能

##### 接口

```js
veepooSendSetAlarmClockDataManager
```

##### 传入参数

| 参数        | 类型   | 备注                 |
| ----------- | ------ | -------------------- |
| alarmId     | number | 闹钟id，1开始递增    |
| switch      | BOOL   | 开关                 |
| time        | string | 时间                 |
| alarmRepeat | object | 重复天数，周一到周日 |
| name        | string | 闹钟标识             |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
    let data = {
      alarmId: 1,// 闹钟id
      switch: true,// 闹钟开关
      time: `08:00`,// 时间
      alarmRepeat: {
        "Monday": true,
        "Tuesday": true,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true,
        "Saturday": false,
        "Sunday": false
      },// 重复天数
      name: "闹钟标识",// 标签
    }
veepooFeature.veepooSendSetAlarmClockDataManager(data);
```

##### 回调

```js
{
  name:"设置文字闹钟",
  type:13,// type 等于13表示 文字闹钟功能回调
}

```

注意：更改闹钟只需要将原本数据更改周数，时间等，然后将数据传入设置接口即可

------



#### 删除文字闹钟

删除文字闹钟，将需要删除的闹钟值传入删除接口即可

##### 前提

蓝牙设备已连接，且设备支持文字闹钟功能

##### 接口

```js

veepooSendDeleteAlarmClockDataManager

```

##### 传入参数

| 参数        | 类型   | 备注                 |
| ----------- | ------ | -------------------- |
| alarmId     | number | 删除闹钟的id         |
| switch      | BOOL   | 开关                 |
| time        | string | 时间                 |
| alarmRepeat | object | 重复天数，周一到周日 |

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
    let data = {
      alarmId: 1,
      switch: true,
      time: `08:00`,
      alarmRepeat: {
        "Monday": true,
        "Tuesday": true,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true,
        "Saturday": false,
        "Sunday": false
      }
    }
    veepooFeature.veepooSendDeleteAlarmClockDataManager(data);
```

##### 回调
```js
{
  name:"删除文字闹钟",
  type:13,// type 等于13表示 文字闹钟功能回调
}
```

------



### 运动功能

### 读取运动模式校验值

最多存储3次运动模式校验值，超过三次的最新一次将往前覆盖

##### 前提

蓝牙设备已连接，且设备支持运动模式功能

##### 接口

```js
veepooSendAppStartMovementPatternD3DataManager
```

##### 传入参数

无

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendAppStartMovementPatternD3DataManager();
```

##### 设备返回

| 参数    | 类型   | 备注          |
| ------- | ------ | ------------- |
| name    | string | 描述          |
| type    | number | 类型描述 值14 |
| content | object | 三个校验值    |

content内容

```js
{
  name:"读取运动模式",
  type:15,
  
  含有运动数据的content
  content：{
	CRC0,//第一个运动模式的校验值
	CRC1,//第二个运动模式的校验值
	CRC2，//第三个运动模式的校验值
  }

  运动数据为0的content
  content:{
    deviceState:0,
    status:"successful"
  }

}
```

------



### 开启或关闭运动模式

目前设备默认普通运动模式

##### 前提

蓝牙设备已连接，且设备支持运动模式功能

##### 接口

```js
veepooSendAppStartMovementPatternD5DataManager
```

##### 传入参数

| 参数   | 类型   | 备注                              |
| ------ | ------ | --------------------------------- |
| switch | string | 设备开关 开启： start 关闭 ：stop |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start'// start 开启 stop关闭
}
veepooFeature.veepooSendAppStartMovementPatternD5DataManager(value);
```

##### 回调

```js
{
  name:"开启运动模式",
  status:"successful"，
  type:15,/// type 等于15表示 运动模式功能

}
```

------



### 读取运动模式数据

读取运动模式数据，确保得到了crc后才能调用本接口

##### 前提

蓝牙设备已连接，设备支持运动模式功能

##### 接口

```js
veepooSendReadMovementPatternD4DataManager
```

##### 参数

| 参数   | 类型   | 备注        |
| ------ | ------ | ----------- |
| module | number | 参数  1 2 3 |

##### 使用

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let value = {
	module:1// 1 2 3 三个参数 根据获取的运动校验值是否不等于0进行进行读取，如 crc0 不等于0，传入1获取crc0的运动数据
}
veepooFeature.veepooSendReadMovementPatternD4DataManager(value);
```

##### 回调

```js
{
  content:{
    head:{
      startTime:"",// 开始时间
      endTime:"",// 结束时间 
      movementData:{
        allStep,//总计步
        allDistance,//总距离
        allCalories,//总卡路里
        allMovement,//总运动量
        recordCnt,//总记录条数
        pauseTimes,//暂停次数
        allPauseTime,//总暂停时间
        crc,//CRC校验 
        sportType,运动模式 类型见备注
      },//头信息
      data:[
        {
        heartRate,// 心率
        movement,// 运动量
        step,// 计步
        calories,// 卡路里
        distance,// 总距离
        pause// 暂停标志位
      }
      ],// 每分钟运动数据
    }
  }
  name:"读取运动数据",
  type:16,// type 等于16表示 回调数据读取运动模式数据
  Progress:100,// 进度0-100
  Module:1,// 当前读取的模块，对应读取到的crc0,crc1,crc2的运动值
}
```

**sportType**: 0代表只有跑步模式的, 1户外跑步, 2户外步行, 3室内跑步, 4.室内步行, 5.徒步, 6.踏步机, 7.户外骑行, 8.室内骑行, 9.椭圆机, 10.划船机, 11登山(暂时CD273T上把踏步机改成登山) , 12游泳，13仰卧起坐，14滑雪 ，15跳绳 ，16瑜伽，17乒乓球、18篮球，19排球，20足球，21羽毛球，22网球等

------



### 手机查找手环

需要判断设备是否支持手机查找设备功能，需要在 手环功能汇总 查找

##### 前提

蓝牙设备已连接，且设备支持查找手环功能

##### 接口

```js
veepooSendPhoneLookBraceletDataManager
```

##### 传入参数

| 参数   | 类型   | 备注                |
| ------ | ------ | ------------------- |
| switch | string | start 开启 stop关闭 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendPhoneLookBraceletDataManager(value);
```

##### 设备回调


```js
{
  name:"开始查找 || 停止查找",
  type:17,// type 等于17表示 手机查找手环功能回调
  content:"开始查找 || 停止查找"
}

```

------



###  血压功能

### 血压单项测量（通用血压）

##### 前提

蓝牙设备已连接，且设备支持血压功能

##### 接口

```js
veepooSendReadUniversalBloodPressureDataManager
```

##### 参数

| 参数   | 类型   | 备注                  |
| ------ | ------ | --------------------- |
| switch | string | start  开启 stop 关闭 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendReadUniversalBloodPressureDataManager(value);
```

##### 回调


```js
{

  name:"读取血压",
  type:18,// type 等于18 表示血压功能
  Progrss:100,// 进度条 0-100
  state:"",// 手环状态
  content:{
    bloodPressureLow,// 低压
    bloodPressureHigh,// 高压
  }
}
```

state枚举

 0 空闲状态（包括手环不在测试心率，不在测试血压）

 1 手环测试血压状态

 2 手环测试心率状态

 3 手环五分钟自动测试状态

 4 手环测试血氧状态

 5 手环测试疲劳度状态

 6 佩戴不通过

 7 当前设备正在充电，不能开启测量

8 当前设备低电，不能开启测量

9 设备忙碌(其他测量开启中)

------



### 设置血压私人定制

私人定制血压值没有开关量

##### 前提

蓝牙设备已连接，且设备支持血压功能

##### 接口

```js
veepooSendBloodPressurePrivateDataManager
```

##### 参数

| 参数   | 类型   | 备注                  |
| ------ | ------ | ---------------------|
| switch | string | start  开启 stop 关闭 |
| bloodPressureHigh | string | 高压  |
| bloodPressureLow | string | 低压  |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
  bloodPressureHigh: 150,// 血压私人定制高压值
  bloodPressureLow: 89,// 血压私人定制低压值
}
veepooFeature.veepooSendBloodPressurePrivateDataManager(value);
```

##### 回调


```js
{

  name:"血压私人定制设置",
  type:28,// type 等于28 表示血压私人定制设置
  deviceRes:"Success",// 设置状态
  deviceControl:"start",// 当前开关状态
  content:{
    bloodPressureLow,// 低压
    bloodPressureHigh,// 高压
  }
}
```

------



### 血压私人定制测量

需要先设置血压私人定制值，在进行血压私人定制测量

##### 前提

蓝牙设备已连接，且设备支持血压私人功能

##### 接口

```js
veepooSendPrivateBloodPressureStupDataManager

```

##### 传入参数

| 参数   | 类型   | 备注                  |
| ------ | ------ | --------------------- |
| switch | string | start  开启 stop 关闭 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendPrivateBloodPressureStupDataManager(value);
```

##### 回调


```js
{

  name:"读取血压",
  type:18,// type 等于18 表示血压功能，需要判定是否属于血压私人定制测量
  Progrss:100,// 进度条 0-100
  state:"",// 手环状态
  content:{
    bloodPressureLow,// 低压
    bloodPressureHigh,// 高压
  }
}
```

------



### 屏幕亮度时长设置

##### 前提

设备已连接，且设备支持该功能

##### 方法

```
veepooSendLightUpTimeDataManager
```

##### 参数

| 参数     | 类型   | 备注                 |
| -------- | ------ | -------------------- |
| switch   | string | setup 设置 read 读取 |
| duration | string | 设置时间  3-60秒     |

##### 使用

```js
import {  veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'setup',// setup 设置 read 读取
	duration:'20',// 单位 秒 3-60
}
veepooFeature.veepooSendLightUpTimeDataManager(value);
```

##### 回调

```js

{
  name:"屏幕常亮时长",
  deviceControl:""setup",// 设置状态  setup 设置 read  读取
  type:19,// type 等于19表示屏幕亮度时长
  content: {
    currentDuration, // 当前设置亮屏时长
    recommend, // 推荐亮屏时长
    maxDuration, // 最大亮屏时长
    minDuration, // 最小亮屏时长
 }
}
```

------



### 心率报警功能

##### 前提

设备已连接，且设备支持该功能

##### 接口

```js
veepooSendHeartRateAlarmIntervalDataManager
```

##### 传入参数

| 参数         | 类型   | 备注     |
| ------------ | ------ | -------- |
| switch       | string | 开关     |
| maxHeartRate | string | 最大心率 |
| minHeartRate | string | 最小心率 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭 read 读取
	maxHeartRate:'150',
	mimHeartRate:'60',
}
veepooFeature.veepooSendHeartRateAlarmIntervalDataManager(value);
```

##### 回调 

| 参数    | 类型   | 备注     |
| ------- | ------ | -------- |
| name    | string | 描述     |
| type    | number | 类型描述 |
| content | object | 内容     |

content内容

```js
{
   type:20,// type 等于20表示心率报警功能
   name:"开启心率报警功能 || 关闭心率报警功能 || 读取心率报警功能",
   content: {
    maxHeartRate,// 最大心率  正常情况可自由传值，异常情况默认传值120
    minHeartRate,// 最小心率  正确情况下默认传值30  异常情况默认传值50 
    state，// 心率功能状态 0 关闭 1 打开
  }
}
```

------



### 血液成分功能

血液成分功能支持校准逻辑，同血压校准类似

#### 血液成分单项测量 || 血液成分校准测量

注意：使用血液成分校准测量前，需要先设置血液校准值

##### 前提

设备已连接，且支持该功能

##### 接口

```js
veepooSendBloodComponentDataManager
```

##### 传入参数

| 参数   | 类型   | 备注        |
| ------ | ------ | ----------- |
| switch | string | start  stop |
| calibration | string | 是否使用校准值 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop关闭
  calibration:false,// true 不使用血液校准  false 使用校准
}
veepooFeature.veepooSendBloodComponentDataManager(value);
```

##### 回调


```js

{ 
  type:21,// type 等于21 表示血液成分功能
  name:"开启血液单项测量",
  Progress:100,// 进度0-100
  deviceAck:"usable",// 测试状态
  content: {
      uricAcidVal, // 尿酸
      cholesterol,// 总胆固醇
      triacylglycerol, // 甘油三脂
      highDensity,// 高密度脂蛋白
      lowDensity，// 低密度脂蛋白
  }

}

```

deviceAck枚举

   'usable',// 可用的

   deviceLowVoltage',// 设备低电

   deviceBusy',// 设备忙碌 pass

   'notPassTheWearing',// 佩戴不通过

------



### 设置血液成分校准值

血液校准值需要在特定范围内
##### 前提

设备已连接

##### 接口

```js
veepooSendBloodComponentCheckDataManager
```

##### 传入参数

| 参数            | 类型   | 备注                   |
| --------------- | ------ | ---------------------- |
| deviceControl   | string | setup 设置 read 读取   |
| switch          | string | start 开启 stop 关闭   |
| uricAcidVal     | string | 尿酸 90-1000 u mol/L   |
| cholesterol     | string | 总胆固醇 0.01 - 20     |
| triacylglycerol | string | 甘油三脂 0.01 - 20     |
| highDensity     | string | 高密度脂蛋白 0.01 - 20 |
| lowDensity      | string | 低密度脂蛋白 0.01 - 20 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  deviceControl: 'read', // setup 设置 read 读取
  switch: self.data.deviceSwitch,
  uricAcidVal: self.data.value1,
  cholesterol: self.data.value2,
  triacylglycerol: self.data.value3,
  highDensity: self.data.value4,
  lowDensity: self.data.value5
}
veepooFeature.veepooSendBloodComponentCheckDataManager(data);
```

##### 设备返回

| 参数          | 类型   | 备注                 |
| ------------- | ------ | -------------------- |
| name          | string | 描述                 |
| type          | number | 类型描述 21          |
| deviceAck     | string | 操作状态             |
| deviceControl | string | 设备控制 setup  read |
| content       | object | 内容                 |

content内容

```js
 content: {
    switch,// 开关 start 开启 stop关闭
    uricAcidVal,// 尿酸
    cholesterol,// 总胆固醇
    triacylglycerol,// 甘油三脂
    highDensity,// 高密度脂蛋白
    lowDensity,// 低密度脂蛋白
  }
```

------



### 血糖功能

#### 血糖测量 || 血糖校准测量

血糖测量跟血液测量类型

##### 前提

设备已连接，并且设备支持血糖功能

##### 接口

```js
veepooSendBloodGlucoseMeasurementDataManager
```

##### 参数

| 参数   | 类型   | 备注                      |
| ------ | ------ | ------------------------- |
| switch | string | 开关 start 开启  stop关闭 |    
| calibration | string | 是否使用校准 |    

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',
  calibration: false,// true 开启校准模式  false 关闭校准模式
}
veepooFeature.veepooSendBloodGlucoseMeasurementDataManager(data);
```

##### 回调


```js
{

  name:"血糖测量",
  type:22,// type 类型等于22 表示血糖功能
  Progress:100,// 进度 0-100
  deviceAck:"",// 设备状态
  content:{
    bloodGlucose:"",// 血糖值
  }

}

```


deviceAck枚举

   ‘usable',// 可用的

   'deviceLowVoltage',// 设备低电

  'deviceBusy',// 设备忙碌 pass

   notPassTheWearing',// 佩戴不通过

------



#### 血糖校准模式

此功能会被6个血糖值覆盖（血糖私人模式）

##### 前提

设备已连接

##### 接口

```js
veepooSendBloodGlucoseCalibrateModuleDataManager
```

##### 传入参数

| 参数              | 类型           | 备注       |
| ----------------- | -------------- | ---------- |
| switch            | string         | 开关       |
| bloodGlucoseValue | number\|string | 血糖校准值 |

##### 使用示例

```js
import {  veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  // 注意：每次发送都需要将血糖转换为 mmol/L   
  // mg/dl  转mmol/L 公式：血糖水平（mg/dl）= 血糖水平（mmol/L）× 18   血糖水平（mmol/L）= 血糖水平（mg/dl）
  switch: 'start', // start 开启 stop关闭
  bloodGlucoseValue: 7.5 // mmol/L  
}
veepooFeature.veepooSendBloodGlucoseCalibrateModuleDataManager(data);
```

##### 回调


```js
{

  name:"血糖校准模式",
  type:22,// type 类型等于22 表示血糖功能
  deviceAck:"successful",// 执行状态
  content:{
    bloodGlucose:"",// 血糖值
  }

}
```

------



### 血糖6个值校准模式（血糖私人模式）


##### 前提

设备已连接，且设备支持血糖私人模式

##### 接口

```js
veepooSendSixBloodGlucoseCalibrateValueDataManager
```

##### 传入参数

| 参数            | 类型   | 备注                 |
| --------------- | ------ | -------------------- |
| BeforeBreakfast | object | 早餐前               |
| AfterBreakfast  | object | 早餐后               |
| BeforeLunch     | object | 午餐前               |
| AfterLunch      | object | 午餐后               |
| BeforeDinner    | object | 晚餐前               |
| AfterDinner     | object | 晚餐后               |
| conSwitch       | string | start 开启 stop 关闭 |
| switch          | string | setup 设置 read 读取 |

| 六个参数Object子项 | 类型   | 备注   |
| ------------------ | ------ | ------ |
| hour               | string | 小时   |
| minute             | string | 分钟   |
| bloodGlucoseValue  | string | 血糖值 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
 let data = {
  conSwitch: 'start', // start 开启  stop 关闭
  switch: 'setup', // setup 设置 read 读取
  beforeBreakfast: {
    hour: '08',
    minute: '00',
    bloodGlucoseValue: 5.5
  },
  afterBreakfast: {
    hour: '09',
    minute: '00',
    bloodGlucoseValue: 7.5
  },
  beforeLunch: {
    hour: '12',
    minute: '00',
    bloodGlucoseValue: 5.0
  },
  afterLunch: {
    hour: '13',
    minute: '00',
    bloodGlucoseValue: 7.5
  },
  beforeDinner: {
    hour: '18',
    minute: '00',
    bloodGlucoseValue: 6.5
  },
  afterDinner: {
    hour: '19',
    minute: '00',
    bloodGlucoseValue: 7.5
  }
}
veepooFeature.veepooSendSixBloodGlucoseCalibrateValueDataManager(data);
```

##### 回调

| 参数      | 类型     | 备注                 |
| --------- | -------- | -------------------- |
| name      | string   | 描述                 |
| type      | number   | 类型描述22           |
| deviceAck | string   | 设置/读取状态        |
| switch    | string   | setup 设置 read 读取 |
| content   | string[] | 内容                 |


```js

// 设置
{

  "name": "血糖6个校准模式",
  "type": 22, 
  "deviceAck": "successful",
  "switch": "setup"

}

// 读取
{
  "name": "血糖6个校准模式",
   "type": 22,
    "deviceAck": "successful",
     "switch": "read",
      "content": {
        "calibrationSwitch":"start",// start 开启 stop 关闭
        "beforeBreakfast": {"hour": "08", "minute": "00", "bloodGlucoseValue": 5.5},// 早餐前
        "afterBreakfast": {"hour": "09", "minute": "00", "bloodGlucoseValue": 7.5}, // 早餐后
        "beforeLunch": {"hour": "12", "minute": "00", "bloodGlucoseValue": 5}, // 午餐前
        "afterLunch": {"hour": "13", "minute": "00", "bloodGlucoseValue": 7.5}, // 午餐后
        "beforeDinner": {"hour": "18", "minute": "00", "bloodGlucoseValue": 6.5}, // 晚餐前
        "afterDinner": {"hour": "19", "minute": "00", "bloodGlucoseValue": 7.5}// 晚餐后
        }
}

```

------



### 久坐功能提醒

##### 前提

设备已连接，且设备支持久坐提醒功能


本接口无标志位判断设备是否支持久坐，要判断设备是否支持久坐，可以使用接口读取一遍信息，如果触发失败，则表示设备不支持本接口，需要到健康提醒接口获取


##### 接口

```
veepooSendSetupSedentaryToastTimeDataManager
```

##### 传入参数

| 参数         | 类型   | 备注         |
| ------------ | ------ | ------------ |
| switch       | string | 开关         |
| startTime    | string | 开启久坐时间 |
| endTime      | string | 关闭久坐时间 |
| intervalTime | string | 间隔时间     |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// start 开启 stop 关闭 read 读取
  startTime: self.data.startTime,// 开始时间
  endTime: self.data.endTime,// 结束时间
  intervalTime: self.data.intervalTime//间隔时间
}
veepooFeature.veepooSendSetupSedentaryToastTimeDataManager(data)
```

##### 回调



```js
{
  name:"久坐功能提醒",
  type:23,// type 等于23表示久坐功能提醒
  deviceAck:"",// 成功或失败回调
  content: {
    startTime,// 开始时间
    endTime,// 结束时间
    intervalTime,// 间隔
    deviceControl,// 设备设置状态
    switchStatus:true,// 开关状态
}
}
```

------



### 拍照

##### 前提

设备已连接，且设备支持拍照功能

##### 接口

```js
veepooSendTakeAPictureDataManager
```

##### 传入参数

| 参数   | 类型   | 备注                        |
| ------ | ------ | --------------------------- |
| switch | string | start 进入拍照 stop退出拍照 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// start 进入拍照 stop 退出拍照
}
veepooFeature.veepooSendTakeAPictureDataManager(data);
```

##### 回调


```js
{
  name:"拍照",
  type:24,// type 等于24，表示拍照功能
  deviceAck:"Success",// 调用状态
  content: {
  takePicture,//stopAndExit 停止并退出拍照 enter 进入拍照 start 开始拍照
  deviceCallTakePicture,// 是否主动调用相机
}
}
```

------



### 抬手亮屏


##### 前提

设备已连接，且设备支持抬手亮屏功能

##### 接口

```js
veepooSendTurnWristBrightScreenDataManger
```

##### 传入参数

| 参数        | 类型   | 备注                |
| ----------- | ------ | ------------------- |
| switch      | string | start 开启 stop关闭 |
| startTime   | string | 开始时间            |
| endTime     | string | 结束时间            |
| deviceLevel | string | 等级                |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// 开关
  startTime: self.data.startTime,// 开始时间
  endTime: self.data.endTime,// 结束时间
  deviceLevel: self.data.deviceLevel,// 灵敏登记
}
veepooFeature.veepooSendTurnWristBrightScreenDataManger(data);
```

##### 回调


```js
{
  name:"抬手亮屏",
  deviceAck:"",// 设置成功或失败的状态
  type:25,// type等于25 表示抬手亮屏功能
  content: {
    startTime,// 开始时间
    endTime,// 结束时间
    deviceSwitch,// 开关 start 开启 stop 关闭
    deviceLevel,// 灵敏等级
    defaultLevel,//默认等级
    deviceControl,// 控制  start  开启 stop关闭 read 读取
  }
}

```

------



### 健康功能提醒

手环功能汇总的健康功能提醒字段，当字段等于1，久坐功能需要在单独的接口获取，当字段等于2，久坐功能集成到健康功能提醒

##### 前提

设备已连接

##### 接口

```js
veepooSendHealthToastFeatureDataManager
```

##### 传入参数

| 参数          | 类型   | 备注                     |
| ------------- | ------ | ------------------------ |
| switch        | string | start 开启 stop关闭      |
| startTime     | string | 开始时间                 |
| endTime       | string | 结束时间                 |
| intervalTime  | string | 间隔时间                 |
| deviceControl | string | 控制 setup设置 read 读取 |
| deviceType    | string | 功能类型： 久坐 喝水     |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch，// 开关 start 开启 stop 关闭
  startTime,// 开始时间
  endTime,// 结束时间
  intervalTime,//间隔时间
  deviceControl,// 控制 setup 设置 read 读取
  deviceType,// 功能类型  久坐 喝水等
}
veepooFeature.veepooSendHealthToastFeatureDataManager(data);



```

##### 回调


```js
{
  name:"健康功能提醒",
  type:26,// type 等于26表示 健康功能提醒
  deviceAck:"Success",// 读取或者设置状态
  totalPackage:2,// 总包  总共有多少个功能，每一个功能为一个包
  currentPackage:1,// 当前返回的包
  content: {
      startTime,//开始时间
      endTime,// 结束时间
      deviceType,// 功能类型
      intervalTime,//间隔时间
      deviceSwitch//开关
  }
}

deviceType 

'久坐', '喝水', '远眺', '运动', '吃药', '看书', '出行', '洗手'
```

注意：功能类型并不是每个表都支持，需要根据支持的类型进行设置

------



### 设置/读取血氧自动监测

##### 前提

设备已连接，且设备支持全体血氧监测

注意：需要查看  手环功能类型是否支持全天血氧检测

##### 接口

```js
veepooSendBloodOxygenAutoTestDataManager
```

##### 传入参数

| 参数          | 类型   | 备注                 |
| ------------- | ------ | -------------------- |
| switch        | string | start 开启 stop 关闭 |
| startTime     | string | 开始时间             |
| endTime       | string | 结束时间             |
| deviceControl | string | setup 设置 read 读取 |

注意：时间传入固定 开始时间22：00  结束时间：08:00

##### 使用示例

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch,// start 开启 stop 关闭
  startTime,// 开始时间
  endTime,// 结束时间
  deviceControl，// setup设置 read 读取
}
veepooFeature.veepooSendBloodOxygenAutoTestDataManager(data);
```

##### 回调


```js
{
  name:"血氧自动检测",
  type:29,// type 等于29，表示血氧自动监测功能
  deviceAck:"Success",// 设置或读取状态
  content: {
    switch,// 开关
    startTime,//开始时间
    endTime,//结束时间
  }
}
```

------



### 血氧手动测量

##### 前提

设备已连接，且设备支持血氧手动测量功能

##### 接口

```js
veepooSendBloodOxygenControlDataManager
```

##### 传入参数

| 参数   | 类型   | 备注                |
| ------ | ------ | ------------------- |
| switch | string | start 开启 stop关闭 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',
}
veepooFeature.veepooSendBloodOxygenControlDataManager(data);
```

##### 回调

注意：血氧自动检测值在日常数据读取

```js
{
  name:"血氧手动测量",
  type:31,// type 等于31，表示血氧手动测量功能
  content: {
    bloodOxygen,// 血氧值
  }
}
```

------



### 女性经期

女性功能为SDK的限制功能，需要先与我司商务联系，进行商务对接。

在权限未开启情况下，相应接口的职能无法生效。

 女性经期功能较为复杂，需要结合sdkdemo代码进行开发

##### 前提

设备已连接且支持该功能

##### 接口

```js
veepooSendFemaleInstructionsDataManager
```

##### 传入参数

| 参数                 | 类型   | 备注             |
| -------------------- | ------ | ---------------- |
| deviceControl        | string | 设备模式         |
| menstruationTime     | string | 最后一次经期时间 |
| menstruationLength   | string | 月经时间 如5天   |
| menstruationInterval | string | 月经间隔 如28天  |
| babySex              | string | 孩子性别         |
| babyDateBirth        | string | 孩子出生日期     |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  deviceControl: '04',// 类型
  menstruationTime: self.data.date,// 经期时间时间
  menstruationLength: self.data.value1,// 经期长度
  menstruationInterval: self.data.value2,// 经期间隔
  babySex: self.data.value3,// 婴儿性别 
  babyDateBirth: self.data.BabyDate,// 婴儿出生日期，不为辣妈期值无效
}
veepooFeature.veepooSendFemaleInstructionsDataManager(data)

deviceControl枚举

00  ----  没有女性生理记录

01  ----  只记经期

02  ----  备孕期

03  ----  怀孕期

04  ----  辣妈

05  ----  读取
```





##### 回调

```js
 {
  "name": "女性经期", 
  "type": 32, // type 等于32表示女性经期功能
  "deviceControl": 5, // 模式类型
  "deviceAck": "Success", // 设置或读取状态
  "content": {
    "menstruationTime": "2024-08-23", 
    "menstruationLength": 5, 
    "menstruationInterval": 28, 
    "babyDateBirth": "0-00-00", 
    "babySex": 0
    }
  }
```

------



### 恢复出厂设置

##### 前提

设备已连接，且设备支持恢复出厂设置

##### 接口

```js
veepooSendResettingTheDeviceDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
veepooFeature.veepooSendResettingTheDeviceDataManager()
```

##### 回调

```js
{
  deviceAck:"Success",// 恢复出厂设置状态
  name:"恢复出厂设置",
  type:90,// type 等于90 表示出厂设置
}
```

------



### 复位

##### 前提

设备已连接且支持复位功能

##### 接口

```js
veepooSendResetDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
veepooFeature.veepooSendResetDataManager()
```

##### 回调

无

------



### 开关设置

注意：开关设置的初始值需要在公英制新增开关返回的两个包中获取
在全部的开关设置中，血氧自动监测开关，需要在自动监测接口设置

##### 前提

设备设备已连接且支持开关设置功能

##### 接口

```js
veepooSendAutoTestSwitchDataManager
```

##### 传入参数

| 参数            | 类型   | 备注     |
| --------------- | ------ | -------- |
| heartRate       | string | 心率开关 |
| bloodPressure   | string | 血压开关     |
| scientificSleep | string | 科学睡眠 |
| bodyTemperature | string | 体温开关     |
| bloodGlucose    | string | 血糖开关     |
| bloodComponents | string | 血液成分开关 |
| fallWarning | string | 跌倒提醒开关 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  heartRate,// start 开启  stop 关闭  开启心率开关
}


veepooFeature.veepooSendAutoTestSwitchDataManager(data)


```

##### 回调

```js
{
  name:"公英制新增开关",
  type:11,// 表示公英制新增开关（开关设置）
  settingStatus:true,// 设置成功 || 设置失败
}
```

------



### 肤色档位设置

##### 前提

设备已连接

##### 接口

```
veepooSendSkinToneSettingDataManager
```

##### 参数

| 参数          | 类型   | 备注            |
| ------------- | ------ | --------------- |
| skinColorType | number | 肤色类型 0 与 2 |
| level         | number | 肤色档位        |

##### 使用示例

```typescript
import { veepooFeature } from '../../miniprogram_dist/index';

veepooFeature.veepooSendSkinToneSettingDataManager({
  skinColorType: 2,// 肤色类型
  level: 2,// 肤色档位
})
```

skinColorType肤色类型根据功能汇总第一包的skinColorType字段

skinColorType = 0，level有两档位   1 白人模式  2 黑人模式

skinColorType  = 2，level有六档位 1-6档位，1最白 6最黑

G Band肤色等级对应：

```
0, 1 -> 6
2, 3 -> 5
4 -> 4
5 -> 3
6, 7 -> 2
8, 9 -> 1
```

------



### ota升级

注意：文档中包含ota升级的各种接口，使用示例的简单应用，具体的ota升级逻辑可以在sdkdemo中查看，ota升级成功后，需要手动恢复出厂设置（带升级成功后自动恢复出厂可不用），否则可能会导致数据混乱。

##### 前提

设备已连接，已进行杰里认证，且设备支持远程ota功能

##### 接口

```js
veepooJLOTAInITManager // ota初始化
BleDataHandler.init()// 蓝牙接收数据初始化
veepooJLAuthenticationManager// 进行杰里认证
veepooJLStartOTAManager// 开始ota
veepooJLOTAUnloadObserveManager// 销毁ota相关数据
```

##### 接口参数

| 方法                            | 参数           | 备注                     |
| ------------------------------- | -------------- | ------------------------ |
| veepooJLOTAInITManager          | 无             | 无                       |
| BleDataHandler.init()           | 无             | 无                       |
| veepooJLAuthenticationManager   | device         | 蓝牙搜索到的设备全部内容 |
| veepooJLStartOTAManager         | updateFileData | 获取到的ota升级文件数据  |
| veepooJLOTAUnloadObserveManager | 无             | 退出页面销毁             |

##### 使用示例

```js
import { veepooJLAuthenticationManager, veepooJLOTAInITManager, veepooJLStartOTAManager, veepooJLOTAUnloadObserveManager } from "../../jieli_sdk/index"
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'

// 页面加载生命周期
onLoad() {
    // 初始化，接收返回的杰里数据
    BleDataHandler.init()
    // ota初始化
    veepooJLOTAInITManager();
},


auth(){
    // 杰里设备认证  device 设备蓝牙信息
    veepooJLAuthenticationManager(device)
}


startOTA(){
    let value = {
    updateFileData: this.otaData// 获取的ufw升级文件数据
    }
    // 开始ota，传入文件数据
    veepooJLStartOTAManager(value, function (event: any) {
    console.log("event=>", event);
    self.setData({
      otaProgressText: event.otaProgressText
    })
    })
}

onUnload() {
// 销毁ota资源
veepooJLOTAUnloadObserveManager();
},

```

##### 回调

| 参数            | 类型   | 备注     |
| --------------- | ------ | -------- |
| otaProgressText | string | ota进度  |
| error           | string | 错误信息 |
| Progress        | number | 升级进度 |
| message         | string | 升级信息 |

------



### 表盘传输功能

表盘传输功能这里做代码使用示例，具体的整个流程需要请到sdkdemo做参考

设备需要支持表盘功能，已进行杰里认证



#### 杰里认证

##### 前提 

蓝牙设备已连接，且设备支持表盘传输功能

##### 使用示例

```js

import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
import {veepooJLAuthenticationManager } from '../../jieli_sdk/index'

// 页面加载
onLoad() {
// 杰理sdk 初始化
BleDataHandler.init()
},

// 认证
auth(){
    // 这里的device 搜索到的蓝牙设备device信息
    let device = wx.getStorageSync('bleInfo')
    // 杰里设备认证
    veepooJLAuthenticationManager(device)
}


```

------



#### 获取表盘列表

##### 前提

设备已连接，已进行杰理认证

##### 使用示例

```js
import {veepooJLGetDialListManager } from '../../jieli_sdk/index'

// 获取表盘列表
veepooJLGetDialListManager(function (result: any) {
	console.log('表盘列表=>',result.dialList)
})
```

------



#### 获取当前使用表盘列表

##### 前提 

设备已连接，已进行杰理认证

##### 使用示例

```js
import {veepooJLGetDialListManager } from '../../jieli_sdk/index'

// 获取表盘列表
veepooJLGetDialListManager(function (result: any) {
	console.log('表盘列表=>',result.dialList)
})
```

------



#### 设置当前表盘

##### 前提 

设备已连接，已进行杰理认证，且表盘数量大于1

##### 使用示例

```js
import {veepooJLSetToCurrentUseManager } from '../../jieli_sdk/index'

// 设置当前表盘 file 获取到的表盘列表项  如list[inidex]
veepooJLSetToCurrentUseManager(file，function (result: any) {
	 console.log("设置当前表盘e=>", e)
})
```

------



#### 获取当前表盘版本

##### 使用示例

```js
import {veepooJLGetDialVersionInfoManager } from '../../jieli_sdk/index'

// 获取当前版本 file 获取到的表盘列表项  如list[inidex]
veepooJLGetDialVersionInfoManager(file，function (result: any) {
	 console.log("当前版本e=>", e)
})
```

------



#### 删除表盘

##### 使用示例

```js
import {veepooJLDeleteDialManager } from '../../jieli_sdk/index'

// 删除表盘 file 获取到的表盘列表项  如list[inidex]
veepooJLDeleteDialManager(file, function (result: any) {
console.log("result删除表盘=>", result)
})
```

------



#### 开始传输表盘文件数据

开发表盘传输，传输流程需要结合sdkdemo

##### 使用示例

```js
import {veepooJLAddDialTransferStartManager } from '../../jieli_sdk/index'
veepooJLAddDialTransferStartManager(fileData,function(result:any){
  console.log("传输进度result=>",result);
  self.setData({
    transferProgressText:result.transferProgressText
  })


})
```

##### 注意：sdkdemo可查看ota跟表盘传输的相关代码

------



### android编码功能

安卓手机不具备通话功能，此接口可忽略，ios可实现以下功能



#### 未知来电通知

##### 前提

设备已连接，且设备支持通话功能

未知来电是指在手机通讯录没有存储该手机号码，调用接口前需要查看一遍通讯录是否存储有该手机号，如果有存储，则需要将存储的名称一起带上

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '02',// 类型
  phone: self.data.phone1// 手机号
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 通讯录来电通知

##### 前提

设备已连接，且支持通话功能

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '01',// 类型
  phone: self.data.phone1,// 手机号
  name: self.data.name,// 名称
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 未知短信通知

##### 前提

设备已连接，且支持通话功能

##### 使用

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '04',// 类型
  phone: self.data.phone1,// 手机号
  message: self.data.message,// 消息内容
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 通讯录短信通知

##### 前提

设备已连接，且支持通话功能

##### 使用

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '03',// 类型
  phone: self.data.phone1,// 手机号
  message: self.data.message,// 消息内容
  name: self.data.name// 名称
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 应用通知

##### 前提

设备已连接，且支持通话功能

##### 使用

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '05',// 类型
  apply: self.data.index,// 应用类型
  message: self.data.message,// 消息内容
}
veepooFeature.veepooSendAndroidCodeDataManager(data);


apply：应用类型

 00 来电
 01 手机短信 
 02 微信
 03 QQ
 04 微博
 05 facebook
 06 推特
 07 flickr
 08 Linke
 09 WhatsApp
 0A Line 
 0B Instagram
 0C Snapchat
 0D Skype
 0E Gmail
 0F 钉钉
 10 企业微信
 11 其他  // 设备端未做判断
 12 tiktok
 13 telegram 
 14 connected2 
 15 KakaoTalk
 16 警右

```

------



### 自定义表盘（UI风格）

蓝牙设备已连接，且设备支持自定义表盘功能



#### 设置自定义背景表盘（切换自定义背景表怕）

##### 前提

设备已连接

##### 接口

```
veepooSendSwitchCustomBGUIDialManager
```

**参数**

| 参数      | 类型   | 备注     |
| --------- | ------ | -------- |
| control   | number | 控制类型 |
| style     | number | 风格     |
| styleType | number | 表盘类型 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
    control: 1,
    style: this.style,
    styleType: this.styleType
}
veepooFeature.veepooSendSwitchCustomBGUIDialManager(data)
```

control   1 设置  2 读取  3 读取

style 风格 根据获取列表

styleType 0  默认表盘  1 表盘市场  2 自定义表盘

------



#### 设置自定义背景样式

##### 前提

设备已连接

##### 接口

```typescript
veepooSendSetupCustomBackgroundDialDataManager
```

##### 参数

| 参数               | 类型          | 备注           |
| ------------------ | ------------- | -------------- |
| timePosition       | string        | 时间位置       |
| timeTopPosition    | string        | 时间顶部位置   |
| timeButtomPosition | string        | 时间底部位置   |
| isDefaultBg        | string        | 是否为默认背景 |
| isDefaultBg        | Array<number> | 文字颜色       |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
  timePosition: timePosition,// 时间位置
  timeTopPosition: timeTop,// 时间顶部位置
  timeButtomPosition: timeButtom,// 时间底部位置
  isDefaultBg: '0',// 是否为默认背景
 isDefaultBg: [r, g, b]// 文字颜色
}
veepooFeature.veepooSendSetupCustomBackgroundDialDataManager(value)
```

##### 回调

```typescript
{
"name": "表盘UI信息", 
"type": 46,
"content": {
	"dataAddress": 0,
    "writeDataLength": 524288,
    "customDialType": 66,
    "elementColor": [160, 195, 231],
    "isDefaultBg": 0,
    "timePosition": 0,
    "timeTopPosition": 0,
    "timeButtomPosition": 0
    }
}

{
   "name": "读取ui风格",
   "type": 14, 
    "content": {
        "setupStatus": true
    }
}
```



#### 读取表盘信息

##### 前提

设备已连接

##### 接口

```
veepooSendReadCustomBackgroundDailManager
```

##### 参数

| 参数 | 类型   | 备注                         |
| ---- | ------ | ---------------------------- |
| type | number | 1 表盘市场  2 自定义背景表盘 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
    type:2// 自定义背景表盘
}
veepooFeature.veepooSendReadCustomBackgroundDailManager(data)
```

##### 回调

```typescript
{
"name": "读取自定义照片表盘", 
"type": 46,
"content": {
	"dataAddress": 0,
    "writeDataLength": 524288,
    "customDialType": 66,
    "elementColor": [160, 195, 231],
    "isDefaultBg": 0,
    "timePosition": 0,
    "timeTopPosition": 0,
    "timeButtomPosition": 0
    }
}
```



#### 获取屏幕信息

##### 使用示例：

```typescript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let value = {
  type// 表盘类型
}
veepooFeature.veepooSendGetCustomDialInfoManager(value, function (e: any) {})
```

##### 回调

```typescript
 {
     "resolution": [240, 296],// 表盘分辨率大小
     "border": [172, 207],// 缩略图边框大小
     "thumbnails": [152, 187]// 缩略图大小
 }
```



------



### ECG测量功能

#### 开启测量

// 注意：疾病信息属于付费内容，如需要，需先与我司商务协商，未付费默认0

##### 前提

设备已连接，且设备支持ECG功能

##### 接口

```js
veepooSendECGmeasureStartDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendECGmeasureStartDataManager();
```

##### 回调

```js

// 每秒进度包回调
 {
  "name": "ecg测量", // 名称
  "type": 42, // type 等于42表示 ECG功能回调
  "progress": 7, // 当前进度 0-100
  "content": {
    "wristbandStatus": "open", // 手环状态   open 空闲，测试开启状态  testPPG 手环正在测量PPG  charging  充电中  lowVoltage 低电中
    "wearStatus": "wearNotPass", // 佩戴状态 wearPass  佩戴通过    wearNotPass 佩戴不通过
    "HR1PerSecond": 0,  // 每秒心率
    "HR2PerMinute": 0, // 每分钟心率
    "Hrv": "--", // hrv
    "RR1PerSecond": 0, // rr1每秒
    "RR2Per6Second": 0, // rr2每6秒
    "BR2PerSecond": 0, // br1 每秒
    "BR2PerMinute": 0, // br1 每分钟
    "M_ID": 1, 
    "QTC": 0, 
    "PWV": 0
    }
  }


// 每秒ECG波形数据

{

  name:"ecg波形数据",
  type:42,// 42表示ECG功能回调
  content:[],// 每秒波形数据 每秒有四个包返回
}




// 测量结束回调


{
  
  name:"ecg测量",
  type:42,// type 等于42表示 ecg功能回调
  content:{
      leadOffType,//导联类型    注意，导联脱落超过四次，需要应用层需要结束本次测量，重新测量
      diagParamBuf: arr, // 八个诊断数据
      heartRate,//心率
      respiratoryRate,//呼吸率
      hrv,// hrv
      QTC,// QTC

   
      diseaseRisk,//疾病风险     
      pressureIndex,//压力指数    
      fatigueIndex,/疲劳指数    
      myocarditisRisk,//心肌炎风险    
      coronaryHeartDisease,// 冠心病风险    
      angiosclerosisRisk,//血管硬化风险    
      riskParam32,// 32个疾病信息    

      

      qrsTime, // qrs时长
      qrsAmp,//qrs振幅
      pwvMeanVal,//pwv均值
      stMeanVal,//st 平均
      diseaseSdnn,//窦性心搏间标准差,正常值为(141±39)ms 
      diseaseRmssd,// 相邻正常心动周期差值的均方根，正常值范围为（27±12）ms
  } 
}
```

------



#### 关闭测量

##### 前提

设备已连接，且设备正在测量中

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendECGmeasureStopDataManager();
```

------



### 读取PTT测量波形数据

##### 前提

设备已连接，且设备支持ptt功能

使用场景：在设备端开启ptt功能，设备上报，当返回的额type等于2000，表示设备端开启了ptt公，应用层需要调用切换并读取ptt数据接口

##### 使用示例

```js
 import { veepooFeature } from '../../miniprogram_dist/index'
 
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function (e: any) {
      console.log(" ECG 主服务蓝牙回调=>", e);
      if (e.type == 2000) {
        veepooBle.veepooWeiXinSDKNotifyECGValueChange(function (eve: any) {
          console.log("PPT 测量返回=》", eve)
        })
        // 切换读取ptt服务数据
        veepooFeature.veepooSendReadPPTTestDataManager()
      }
    })
```

返回：PTT波形数据

注意：PTT需要在设备端开启，当收到e.type === 2000的时候，切换监听服务，监听PTT波形数据

------



### 读取设备ECG数据ID

##### 前提

设备已连接，设备支持ECG功能，在设备端中保存有ecg数据

##### 接口

```js
veepooSendReadTestSeavDataIdDataManager
```

#### 传入参数

| 参数   |        | 备注      |
| ------ | ------ | --------- |
| IdType | string | 固定 02值 |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  IdType: '02'// 读取手动的ecg数据id
}
veepooFeature.veepooSendReadTestSeavDataIdDataManager(data);
```

##### 回调


```js
{
  name:"ECG 手动测量保存的数据ID",
  type:41,// 等type等于41，表示当前回调等于获取ecg手动测量id
  content:{
    dataId:0,// 注意：data不等于0的时候，数值有效
  }
}
```

------



### 根据读取到的ECG ID获取数据

 注意：疾病信息属于付费内容，如需要，需先与我司商务协商，未付费默认0

##### 前提

设备已连接，且设备支持ECG功能

##### 接口

```js
veepooSendReadIdTestSeavDataManager();
```

##### 传入参数

| 参数   | 类型   | 备注            |
| ------ | ------ | --------------- |
| dataId | number | 设备保存的ECGID |

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  dataId
}
veepooFeature.veepooSendReadIdTestSeavDataManager(data);
```

##### 回调



```js
{
  type:42,
  name:"ECG根据ID获取手动测量数据",
  content：{
    time,// 时间
    leadSignal //导联信号
    meanHeartRate,//平均心率
    diagnosticData, // 8个诊断数据 
    meanRespiratoryRate,//平均呼吸
    averageHRV,//平均HRV
    averageTimeInterval,//平均QT时间间隔
    totalSecond, // 总时间
    diseaseInfo, // 疾病信息
    wavefrom, // 每秒b2数据
  }
}


// 疾病信息字段
diseaseInfo:{
  "diseaseRisk": 0, // 疾病风险 心率失常
  "pressureIndex": 0, // 压力指数
  "fatigueIndex": 0, // 疲劳指数
  "myocarditisRisk": 0, // 心肌炎风险
  "chdRisk": 0, // 冠心病风险
  "angiosclerosisRisk": 0, // 血管硬化
  "riskParamArr": [], // 32个疾病信息
  "qrsTime": 100, // qrs 时长
  "qrsAmp": 21, // qrs 振幅
  "avePWV": 81, // pwv
  "stMeanAmp": 7, // st 振幅
  "diseaseSdnn": 51, // sdnn
  "diseaseRmssd": 50 // rmssd
}


// 每秒波形相关数据
wavefrom：[
  {
      heart: "",// 每秒心率
      resRate: "",// 每秒呼吸率
      HRV: "",// 每秒hrv
      QT: "", // 每秒qt
      pwv: "",// 每秒pwv 
      waveformData: [],// 每秒波形数据
  }
]

```

------



### 获取ECG基本信息文本

##### 前提

该设备已开启ECG全部功能

##### 接口

```
veepooGetDiseaseTextManager
```

##### 参数

| 参数          | 类型     | 备注          |
| ------------- | -------- | ------------- |
| heartRate     | number   | 心率          |
| diseaseResult | number[] | ecg 8个诊断值 |

##### 使用示例

```typescript
import {veepooFeature } from './veepoo_sdk/index'


let data = veepooFeature.veepooGetDiseaseTextManager({
  heartRate: 77,
  diseaseResult: [0, 0, 0, 0, 0, 0, 0, 0]
});
console.log('ecg文本data==>', data);

```

##### 返回类型

```
[{
    type: 1,
    text: "信号太弱"
  },
  {
    type: 2,
    text: "心率过高"
  },
  {
    type: 3,
    text: "心率过低"
  },
  {
    type: 4,
    text: "窦性心律"
  },
  {
    type: 5,
    text: "窦性心动过速"
  },
  {
    type: 6,
    text: "窦性心动过缓"
  },
  {
    type: 7,
    text: "窦性心律不齐"
  },
  {
    type: 8,
    text: "窦性停搏"
  },
  {
    type: 9,
    text: "室性早搏"
  },
  {
    type: 10,
    text: "二联律"
  },
  {
    type: 11,
    text: "三联律"
  },
  {
    type: 12,
    text: "阵发性室性心动过速"
  },
  {
    type: 13,
    text: "心房扑动"
  },
  {
    type: 14,
    text: "心室扑动"
  },
  {
    type: 15,
    text: "心肌缺血"
  },
  {
    type: 16,
    text: "房性逸搏"
  }
]
```

------



### 身体成分检测

身体成分功能依赖于ECG，与ECG测量姿态一致，在手表正常佩戴情况下，进行手动测量。测量指令开启测量和设备端离线测量。

离线测量指该次测量结果存储在手表端中，跟ecg的设备测量一样，获取保存数据的id，在跟进id获取数据

##### 前提

设备已连接，且设备支持身体成分检测

##### 接口

```js
veepooSendBodyCompositionTestStartDataManager
```

##### 参数

无

##### 使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'

// 开启测试
veepooFeature.veepooSendBodyCompositionTestStartDataManager();
// 关闭测试
veepooFeature.veepooSendBodyCompositionTestStopDataManager();
```

##### 回调


```js

{
  name:"身体成分检测",
  type:32,// type 32 表示身体成分测量
  lead:"",// 导联  导联脱落超过四次，需要应用层结束测量，  leadThrough  导联通过  leadShedding 导联脱落
  progress:100,// 进度 0-100, 只有每秒进度包中含有 progress 
  content:{
        BMI,
        bodyFatPercentage, //体脂率
        fatMass, //脂肪量
        leanBodyMass, //去脂体重
        muscleRate, //肌肉率
        muscleMass, //肌肉量
        subcutaneousFat, //皮下脂肪
        bodyMoisture, //体内水分
        waterContent, //含水量
        skeletalMuscleRate, //骨骼肌率
        boneMass, //骨量
        proportionOfProtein, //蛋白质占比
        proteinAmount, //蛋白质量
        basalMetabolicRate, //基础代谢率
  }
}
```



| 数据类型   | 有效范围        | 偏低范围                         | 正常范围                           | 偏高范围                           | 过高范围                           |
| ---------- | --------------- | -------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| BMI        | [4,1114] kg/m2  | [4,18.5)<br/>偏低                | [18.5,24.0)<br/>正常               | [24.0,28.0)<br/>超重               | [28.0,1114]<br/>肥胖               |
| 体脂率     | [2,48]%         | 男 [2,17]<br/>女 [2,25]<br/>偏低 | 男 [18,22]<br/>女 [26,31]<br/>正常 | 男 [23,29]<br/>女 [32,39]<br/>超重 | 男 [30,48]<br/>女 [40,48]<br/>肥胖 |
| 脂肪量     | [10,248] kg     |                                  |                                    |                                    |                                    |
| 去脂体重   | [1,132] kg      | [1,45.8)<br/>偏低                | [45.8,55.9]<br/>标准               | (55.9,132]<br/>优秀                |                                    |
| 肌肉率     | [39,90]%        | [39,68.1)<br/>偏低               | [68.1,84.8]<br/>标准               | (84.8,90]<br/>优秀                 |                                    |
| 肌肉量     | [9,248] kg      | [9,40.8)<br/>偏低                | [40.8,50.8]<br/>标准               | (50.8,248]<br/>优秀                |                                    |
| 皮下脂肪   | [1,47]%         | [1,8.6)<br/>偏低                 | [8.6,16.7]<br/>正常                | (16.7,47]<br/>偏高                 |                                    |
| 体内水分   | [28,79]%        | [28,53.4)<br/>偏低               | [53.4,66.6]<br/>标准               | (66.6,79]<br/>优秀                 |                                    |
| 含水量     | [7,217] kg      |                                  |                                    |                                    |                                    |
| 骨骼肌率   | [13,69]%        | [13,25)<br/>偏低                 | [25,35]<br/>标准                   | (35,69]<br/>优秀                   |                                    |
| 骨量       | [2.3,4.8] kg    | [2.3,2.9)<br/>偏低               | [2.9,3.7]<br/>标准                 | (3.7,4.8]<br/>优秀                 |                                    |
| 蛋白质占比 | [4,26]%         | [4,14.1)<br/>偏低                | [14.1,17.7]<br/>标准               | (17.7,26]<br/>优秀                 |                                    |
| 蛋白质量   | [1,71] kg       |                                  |                                    |                                    |                                    |
| 基础代谢   | [25,14995] kcal | [25,1619)<br/>偏低               | [1619,14995]<br/>优秀              |                                    |                                    |



### 获取身体成分数据ID

需要设备端进行身体成分测量，应用层再通过该接口获取测量的数据ID

##### 前提

蓝牙设备已连接，且设备支持身体成分功能

##### 接口

```js
veepooSendReadBodyCompositionTestIdDataManager
```

##### 传入参数

无

##### 使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadBodyCompositionTestIdDataManager()
```

##### 回调

注意：需要测试完成身体成分，才能够读取到相应的成分ID

```js
// 获取身体成分保存数据ID回调
{
 name:"身体成分读取测量保存的数据ID",
 type:32,// type  等于32，表示身体成分功能
 content:[
  {
    dataId:0,// 身体成分ID，当id等于0表示无效值
  }
 ]
}

// 身体成分设备主动上报

{

  name:"身体成分检测到设备主动上报",
  type:32,// type 等于32表示身体成分功能
  content:{
    deviceReporting:true
  }
}

```

------



### 根据身体成分数据ID获取数据

##### 前提

设备已连接，且设备支持身体成分功能

##### 接口

```js
veepooSendBodyCompositionIdReadDataManager()
```

##### 传入参数

| 参数   | 类型   | 备注       |
| ------ | ------ | ---------- |
| dataId | string | 身体成分ID |

##### 使用

```js
let data = {
  dataId: deviceIdList.dataId
}
veepooFeature.veepooSendBodyCompositionIdReadDataManager(data)
```

##### 回调


```js
{
  name:"根据Id获取身体成分数据",
  type:32,// type 32表示身体成分功能
  content:{
        BMI,
        bodyFatPercentage, //体脂率
        fatMass, //脂肪量
        leanBodyMass, //去脂体重
        muscleRate, //肌肉率
        muscleMass, //肌肉量
        subcutaneousFat, //皮下脂肪
        bodyMoisture, //体内水分
        waterContent, //含水量
        skeletalMuscleRate, //骨骼肌率
        boneMass, //骨量
        proportionOfProtein, //蛋白质占比
        proteinAmount, //蛋白质量
        basalMetabolicRate, //基础代谢率
  }
}
```

------



### 同步手环时间

##### 前提

设备已连接

##### 接口

```js
veepooSendSyncTimeManager
```

##### 传入参数

| 参数   | 类型               | 备注                         |
| ------ | ------------------ | ---------------------------- |
| year   | String \|\| Number | 年                           |
| month  | String             | 月                           |
| day    | String             | 日                           |
| hour   | String             | 时                           |
| minute | String             | 分                           |
| second | String             | 秒                           |
| format | Number             | 时间制 1 12小时制 2 24小时制 |

##### 使用示例

```js
    let timestamp = Date.now();
    let date = new Date(timestamp);
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours() + 1).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');

    let data = {
      year: year,
      month: month,
      day: day,
      hour: hours,// 这里小时+1 为了区分当前时间与同步时间
      minute: minutes,
      second: seconds,
      format: 2,//  1 12小时制 2 24小时制
    }

    veepooFeature.veepooSendSyncTimeManager(data);
```

##### 回调

```js
{
  name:"同步手环时间",
  type:47,// type 等于47表示同步手环时间功能
  content:{
    message:"" // 设置成功 || 设置不成功
  }
}
```

------



### 获取网络表盘列表

注意：小程序正式版本需要配置域名才能正常获取网络列表

域名：

```typescript
https://www.vphband.com
```

##### 前提

设备已连接

##### 接口

```typescript
veepooGetNetworDialManager
```

##### 传输参数

| 参数      | 类型   | 备注             |
| --------- | ------ | ---------------- |
| version   | string | 设备版本         |
| dialInfo  | object | 表盘信息         |
| pageIndex | number | 当前页数         |
| pageSize  | number | 当前页数内容长度 |

 根据接口veepooSendReadCustomBackgroundDailManager  （读取自定义表盘背景）获取表盘信息

##### 使用示例

```typescript
 let data = {
    type:1,// type 等于1表示ui背景信息  等于2表示自定义表盘信息
}
veepooFeature.veepooSendReadCustomBackgroundDailManager(data)
// 获取网络表盘列表
let data = {
      version: "00.77.02.05-5097",
      dialInfo: { "dataAddress": 0, "writeDataLength": 502944, "binProtocol": 2, "dataUseType": 1, "dialShape": 56, "ImageId": 0 },
      pageIndex: 1,// 当前页数
      pageSize: 24,// 数据条数
    }
    let resut = veepooFeature.veepooGetNetworDialManager(data);
    resut.then((result: any) => {
      self.setData({
        resultList: result.data.results
      })
    }).catch((err: any) => {
      console.log("err=>", err)
    })
```

##### 回调

```typescript
{
    pageIndex: 1, // 当前页数
    pageSize: 24, // 一页的内容总数
    pageCount: 7, // 总页数
    counts: 160, // 设备列表适配的总数
    results: Array(24),// 表盘列表内容
}
```



##### 网络表盘传输流程：

表盘功能中有详细接口

获取表盘=>下载表盘=>获取表盘信息=>  传输    传输前：查看设备市场表盘是否含有（传输完成，可将标志位保存在本地），含有，先删除，删除完成，在进行表盘传输，详细流程在demo 网络表盘有相关代码。

------



### 读取手动测量数据

##### 前提

设备已连接，且设备支持相关手动测量功能，目前只具备气泵血压

##### 接口

```js
veepooSendManualMeasurementDataReadManager()
```

##### 传入参数

| 参数      | 类型   | 备注        |
| --------- | ------ | ----------- |
| timestamp | Number | 时间戳 秒级 |
| dataType  | Number | 数据类型    |

timestamp  时间戳秒级  如获取今天的全部手动测量数据 需传入当天0点01秒的时间戳

dataType 数据类型  0 血压 1 心率 2 血糖 3 压力 4 血氧 5 体温 6 梅拖 7 hrv 8 血液成分 9 微体检 10 情绪 11 疲劳度 12 皮电

##### 使用

```js
let data = {
      timestamp: 1755313815,
      dataType: 0
    }
veepooFeature.veepooSendManualMeasurementDataReadManager(data)
```

##### 回调

```
{
	"name": "手动测量读取", 
	"type": 53, 
	"dataType": 0, // 数据类型  0 血压 1 心率 .....
	"progress": 100, // 读取进度
	"content": [
		{
		"timestamp": 1755311819, // 当条测量数据时间戳
		"dataType": 1, // 当前血压类型  0 普通血压  1 气泵血压
		"BasicData": {
			"Mode": 1, // 测量模式
			"heartRate": 91, // 心率
			"high": 109, // 高压
			"low": 67, //  低压
			"status": 1, // 测量状态
			"credibility": 10 // 结果可信度
			}, 
		"UserData": {
			"height": 170,// 身高 
			"weight": 60, // 体重
			"age": 31, // 年龄
			"sex": 1// 性别 
			}
		}
	]
}


// 微体检
{
	"timestamp": 1760645025, // 时间
	"dataType": 0, // 数据类型
	"heart": 79, // 心率
	"oxygen": 98, // 血氧
	"pressure": 11, // 压力
	"emotion": 0, // 情绪
	"fatigue": 0, // 疲劳度
	"bloodSugar": 5.31, // 血糖
	"bodyTemperature": 0, // 体温
	"bodySurfaceTemperature": 0,// 体表温度 
	"highPressure": 119, // 高压
	"lowPressure": 86, // 低压
	"hrv": 101// hrv
}

```



### 微体检测量

##### 前提

设备已连接，且设备支持微体检测量  (功能类型第4包)

##### 接口

```
veepooSendMicroCheckDataManager
```

##### 传入参数

| 参数   | 类型   | 备注                 |
| ------ | ------ | -------------------- |
| switch | string | start 开启 stop 关闭 |

##### 使用示例

```
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// start 开启  stop 关闭
veepooFeature.veepooSendMicroCheckDataManager({ switch: 'start' });
```

##### 回调

```

// 微体检返回
{
    type: 53,
    name: "微体检",
    control: 1, // 1 开启 2 关闭
    dataType: 1,// 数据类型  0 进度包 1 测量成功报告数据  2 测量失败无结果数据 3 设备正忙 4 设备低电
    progress: 100,// 进度
    content: {
      heartRate: 0,// 心率
      bloodOxygen:0,// 血氧
      pressure: 0,//  压力
      emotion: 0,// 情绪 值域[-10,10]
      fatigueLevel: 0,// 疲劳度
      bloodSugar: 0,// 血糖
      bodyTemperature: 0,// 体温
      highPressure: 0,// 高压
      lowPressure: 0,// 低压
      hrv:0,// hrv
    }
 }
 
 
 // 每秒心率
 {
    "type": 51,
    "name": "心率测量",
    "content": {
        "heartRate": 88,
        "heartState": 0,
        "watchState": 0
     }
   }
 
 // ppg数据
 {
 	"name": "ppg数据", 
 	"type": 54,
    "content": [48703, 48610, 48542, 48426, 48116, 48125, 48139, 48047, 48012, 48185, 48718, 49417, 49726, 50051, 50409, 50424, 50425, 50538, 50463, 50285, 50208, 50166, 50100, 49981, 50005]
 }
```



### 自动测量功能读取

##### 前提

设备已连接，且设备支持B3自动测量功能(功能类型第4包)

##### 接口

```
veepooSendReadB3AutoTestFeatureDataManager
```

##### 无

##### 使用示例

```
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// 读取自动测量功能
veepooFeature.veepooSendReadB3AutoTestFeatureDataManager();
```

##### 回调

```javascript
 {
 	"name": "自动测量功能", 
 	"type": 54, 
 	"control": 2, // 1 设置 2 读取
 	"progress": 100, // 进度
 	"content": [
 		{
 			"p_protocol_type": 0, // 协议类型 不可更改
 			"p_fun_type_content": 0, // 功能类型 0~8数据对应 脉率、血压、血糖、压力、血氧、体温、洛伦兹散点图、HRV、血液成分  可修改
 			"p_fun_switch": 1, // 0 关闭 1 开启  可修改
 			"p_step_unit": 30, // 支持最小的步进，分 
 			"p_time_slot_modify": 1, // 是否支持时间段修改 0 不可修改 1 
 			"p_time_interval_modify": 1, // 是否支持时间间隔修改  0 不可修改 1 支持修改
  			"p_support_time_slot": { // 支持测试的时间段  不可修改
 				"startTime": "0:0", // 表示全天可修改
 				"stopTime": "0:0"
 				}, 
 			"p_meas_inv": 30, // 测量间隔 可修改  根据p_step_unit 大小  如30，那么间隔30
 			"p_cur_time_slot": {// 当前的测试时间段 可修改
 				"startTime": "0:0", 
 				"stopTime": "0:0"
 				}
 			}
 		]
 }
```



### 自动测量功能设置

##### 前提

设备已连接，且设备支持B3自动测量功能(功能类型第4包)

##### 接口

```
veepooSendReadB3AutoTestFeatureDataManager
```

##### 参数

```javascript
// 全部为number类型
{
      "p_protocol_type": 0,// 不可修改
      "p_fun_type_content": 2,// 功能类型 0~8数据对应 脉率、血压、血糖、压力、血氧、体温、洛伦兹散点图、HRV、血液成分  可修改
      "p_fun_switch": 1,// 0 关闭 1 开启  可修改
      "p_step_unit": 30, // 支持最小的步进，分 
      "p_time_slot_modify": 1, // 是否支持时间段修改 0 不可修改 1 
      "p_time_interval_modify": 1, // 是否支持时间间隔修改  0 不可修改 1 支持修改
      "p_support_time_slot": { // 支持测试的时间段  不可修改
        "startTime": "0:0",// 开始时间  
        "stopTime": "0:0"// 结束时间  
      },
      "p_meas_inv": 60,// 测量间隔 可修改  根据p_step_unit 大小  如30，那么间隔30
      "p_cur_time_slot": { // 当前的测试时间段 可修改
        "startTime": "01:00",// 开始时间
        "stopTime": "10:0"// 结束时间
      }
    }
```



##### 使用示例

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// 开始设置
veepooFeature.veepooSendSetupB3AutoTestFeatureDataManager({
  "p_protocol_type": 0,// 不可修改
  "p_fun_type_content": 2,// 功能类型 0~8数据对应 脉率、血压、血糖、压力、血氧、体温、洛伦兹散点图、HRV、血液成分  可修改
  "p_fun_switch": 1,// 0 关闭 1 开启  可修改
  "p_step_unit": 30, // 支持最小的步进，分 
  "p_time_slot_modify": 1, // 是否支持时间段修改 0 不可修改 1 
  "p_time_interval_modify": 1, // 是否支持时间间隔修改  0 不可修改 1 支持修改
  "p_support_time_slot": { // 支持测试的时间段  不可修改
    "startTime": "0:0",// 开始时间  
    "stopTime": "0:0"// 结束时间  
  },
  "p_meas_inv": 60,// 测量间隔 可修改  根据p_step_unit 大小  如30，那么间隔30
  "p_cur_time_slot": { // 当前的测试时间段 可修改
    "startTime": "01:00",// 开始时间
    "stopTime": "10:0"// 结束时间
  }
})
```

##### 回调

```
{
 	"name": "自动测量功能", 
 	"type": 54, 
 	"control": 1, // 1 设置 2 读取
}
```

