

# **维亿魄微信SDK接口说明**



[TOC]





## 1.SDK概述

SDK 提供三个模块，均从 `miniprogram_dist/index` 导入(以给出的demo为例)：

| 模块              | 作用                                                |
| ----------------- | --------------------------------------------------- |
| **veepooBle**     | 蓝牙连接层：扫描、连接、订阅监听、断开、连接状态等  |
| **veepooFeature** | 功能层：读取数据、控制手环（心率/血压/睡眠/ECG 等） |
| **veepooLogger**  | 日志层：控制 SDK 内部日志输出，便于调试             |

此外顶层导出一个 **`init(options)`** 方法，用于 SDK 初始化（见第 6 节）。

```js
import { veepooBle, veepooFeature, veepooLogger, init } from '../../miniprogram_dist/index'
```

> **能力边界：** 本 SDK 负责蓝牙连接与协议解析。OTA 升级、表盘传输等基于杰理（Jieli）SDK 的能力，由独立的 `jieli_sdk` 模块提供，需另行引入（见对应章节）。

## 2.环境要求与集成

### 2.1 适用范围

- 仅支持**微信小程序原生 + TypeScript** 项目。
- 仅限**真机环境**调试（微信开发者工具模拟器不支持蓝牙）。
- 不兼容 uni-app / Taro / mpvue 等二次编译框架（会破坏 SDK 模块结构）。

### 2.2 手机前置条件

- 系统蓝牙已开启；
- 定位服务已开启（Android 扫描蓝牙需要）；
- 已授予微信蓝牙/位置权限。

### 2.3 引入 SDK

将构建产物 index.js 放入小程序项目，按上方方式 `import` 即可。

> 小程序正式版若使用「网络表盘」功能，需在后台配置域名 `https://www.vphband.com`。

## 3. 核心概念：数据是怎么回来的（必读）

> 这是**对接成败的关键**。请先读完本节，再写任何代码。

### 3.1 数据接收模型

SDK 的功能接口采用 **"发指令 + 全局监听"** 模式，而不是常见的"调用即返回结果"：

```
你调用 veepooFeature.xxx(data)
        │  （这一步只是把指令通过蓝牙发给手环，调用本身不返回业务数据）
        ▼
   指令通过蓝牙发给手环
        ▼
   手环处理后通过蓝牙回传数据
        ▼
数据进入「全局监听」 veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(cb)
        ▼
   你在回调里按 res.type 判断是哪一项功能，再做对应处理
```

**也就是说：几乎所有功能接口的结果，都从同一个全局监听里回来，靠 `res.type`（数字）区分。**

### 3.2 最小监听骨架

```js
import { veepooBle } from '../../miniprogram_dist/index'

// 全局监听：所有功能返回数据都走这里
veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(res => {
  console.log('收到设备数据:', res)
  switch (res.type) {
    case 1:  // 密钥认证结果
      break
    case 2:  // 电池电量
      break
    case 4:  // 精准睡眠
      break
    // ... 完整对照见第 10 节
  }
})
```

### 3.3 三个易踩的坑

1. **直接调用功能接口拿不到结果。** 例如 `veepooFeature.veepooBlePasswordCheckManager()` 本身不返回认证结果，结果在全局监听里以 `type:1` 出现。
2. **不要给功能接口硬塞回调参数。** 除少数例外（见下），功能接口只接收一个参数对象 `data`，**没有 callback 参数**。
3. **例外情况（仅这几个）：**
   - `veepooSendGetCustomDialInfoManager(value, callback)` — 同步返回屏幕信息；
   - `veepooGetNetworDialManager(value)` — 返回 Promise（走 HTTPS，非蓝牙）；
   - HRV/洛伦兹相关、`veepooGetDiseaseTextManager(value)` — 同步返回计算结果，不走蓝牙。

### 3.4 返回数据统一结构

全局监听收到的对象统一长这样：

```js
{
  name: "功能名称",   // 中文描述，可辅助判别
  type: 2,           // 数字类型，路由依据（见第 10 节总表）
  content: { ... },  // 具体数据，不同 type 结构不同
  // 部分功能还会带：Progress / progress（进度 0-100）、deviceAck / ack（状态）等
}
```

## 4.  5分钟快速对接（Quick Start）

下面这段代码演示**从扫描到读到电量**的完整最小流程，可直接参考：

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

Page({
  onUnload() {
    // 离开页面务必停止扫描、断开连接，释放资源
    veepooBle.veepooWeiXinSDKStopSearchBleManager(() => {})
  },

  // 1. 全局监听：必须先注册，认证结果、电量等所有数据都从这里回来
  startListen() {
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(res => {
      switch (res.type) {
        case 1: // 密钥认证结果
          if (res.content?.VPDevicepassword === 'successfulVerification') {
            console.log('认证通过，可开始使用功能接口')
            this.readBattery() // 认证通过后再读电量
          }
          break
        case 2: // 电量
          console.log('电量:', res.content)
          break
      }
    })

    // 监听蓝牙断开
    veepooBle.veepooWeiXinSDKBLEConnectionStateChangeManager(res => {
      console.log('连接状态变化:', res)
    })
  },

  // 2. 扫描设备（每扫到一个回调一次）
  scan() {
    this.startListen()
    veepooBle.veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice(res => {
      console.log('扫描到设备:', res)
      // 选中目标设备后停止扫描并连接
      // this.connect(res.deviceId)
    })
  },

  // 3. 连接设备（deviceId 即扫描到的设备 mac）
  connect(deviceId) {
    veepooBle.veepooWeiXinSDKStopSearchBleManager(() => {})
    const value = { deviceId }
    veepooBle.veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager(value, e => {
      // 连接成功后回调
      this.passwordCheck()
    })
  },

  // 4. 密钥认证（功能接口的前置条件）
  passwordCheck() {
    veepooFeature.veepooBlePasswordCheckManager()
    // 认证结果在全局监听 type:1 中返回
  },

  // 5. 认证通过后，读取电量（结果在全局监听 type:2 中返回）
  readBattery() {
    veepooFeature.veepooReadElectricQuantityManager()
  },
})
```

跑通上面五步，就完成了最基本的对接骨架。

## 5. 接口调用顺序与通用前提

### 5.1 标准调用顺序

```
扫描设备 → 连接设备 → 订阅全局监听 → 密钥认证 → 调用各功能接口
```

- **全局监听必须在认证前注册**，否则可能漏收认证结果。
- **密钥认证必须通过**，功能接口才会生效；未认证直接调用功能接口会返回错误。
- BLE 扫描/连接/电量读取本身不需要认证；但读取数据类、控制类功能接口都需要。

### 5.2 通用前提（不再在每个接口重复）

- 除非特别说明，所有接口默认前提为：**手机蓝牙已开启、设备已连接、（功能接口）已通过密钥认证**。
- 时间参数格式若无特别说明，均为字符串 `"HH:mm"`；日期为 `"YYYY-MM-DD"`。

## 6. SDK 初始化 init

`init` 是 SDK 的初始化入口，支持自定义蓝牙传输实现，或注入已有连接信息以跳过 SDK 自带的连接流程。

```js
import { init } from '../../miniprogram_dist/index'

init({
  transport, // 可选，自定义 BLE 传输实现，替换默认 wx.* 调用
  bleDate,   // 可选，注入已有 BLE 连接信息，跳过 SDK 连接流程
})
```

| 参数        | 类型   | 说明                                                         |
| ----------- | ------ | ------------------------------------------------------------ |
| `transport` | object | 自定义蓝牙传输层实现。传入后将替换 SDK 内部所有 `wx.*` 蓝牙调用，便于在非标准环境或测试环境接入 |
| `bleDate`   | object | 已有的 BLE 连接信息（含 `deviceId` 等）。传入后 SDK 视为"已连接"，可直接调用功能接口，跳过扫描/连接流程 |

> 不调用 `init` 也能正常使用默认流程（扫描→连接）。`init` 仅在需要自定义传输或复用外部连接时使用

## **7.蓝牙连接模块 veepooBle**

### 7.1 接口总表

| 接口                                                         | 作用                                                         |    是否需要认证    |
| ------------------------------------------------------------ | ------------------------------------------------------------ | :----------------: |
| `veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice`     | **推荐** 一站式扫描（含初始化适配器+扫描+去重）              |         否         |
| `veepooWeiXinSDKStopSearchBleManager`                        | 停止扫描                                                     |         否         |
| `veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager` | **推荐** 一站式连接（连接+服务+特征值+保存）                 |         否         |
| `veepooWeiXinSDKConnectionDevice`                            | 生产级连接（含重试/超时/自动发起密钥认证）                   | 否（内部自动认证） |
| `veepooWeiXinSDKBleReconnectDeviceManager`                   | 重连设备                                                     |         否         |
| `veepooWeiXinSDKNotifyMonitorValueChange`                    | **核心** 订阅主服务数据监听                                  |         否         |
| `veepooWeiXinSDKBLECharacteristicValueChangeManager`         | 通用特征值数据监听（高级用法）                               |         否         |
| `veepooWeiXinSDKNotifyECGValueChange`                        | 订阅 ECG 测量特征                                            |         否         |
| `veepooWeiXinSDKBLEConnectionStateChangeManager`             | 监听蓝牙连接状态变化                                         |         否         |
| `veepooWeiXinSDKGetConnectedBleDeviceManager`                | 获取已连接的蓝牙设备                                         |         否         |
| `veepooWeiXinSDKloseBluetoothAdapterManager`                 | 断开设备连接                                                 |         否         |
| `veepooWeiXinSDKHandoverServiceManager`                      | 切换回主服务（ECG/表盘用完后切回）；如进行自行蓝牙连接操作，连接成功后必须调用此接口 |         否         |

### 7.2 扫描蓝牙

**前提**

确保手机系统蓝牙，定位开启的状态下，调用接口，返回找到的蓝牙设备，每一个设备一个回调值。

这个接口将微信蓝牙api中的初始化蓝牙，获取蓝牙适配器，开始搜寻蓝牙外围设备，获取蓝牙外围设备列表集成。

**接口**

```js
veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice
```

**传入参数**

无

**使用示例**

```js
import { veepooBle} from '../../miniprogram_dist/index'
// e表示当前扫描到设备返回的callback信息
veepooBle.veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice(function(res){
  console.log('res=>',res)
})
```

**回调**

场景：
成功返回：附近的蓝牙设备
错误返回：接口调用错误，一般是手机配置不符，如蓝牙，定位等没有打开，根据错误返回进行相关操作。

------



### 7.3 停止扫描

**前提**

当扫描到需要连接的蓝牙设备，或离开当前界面时，需要调用停止扫描接口，如果不调用停止扫描接口，会占用手机大量的资源。

**接口**

```
veepooWeiXinSDKStopSearchBleManager
```

**传入参数**

无

**使用示例**

```js
import { veepooBle } from '../../miniprogram_dist/index'

veepooBle.veepooWeiXinSDKStopSearchBleManager(function(res){
console.log("res=>",res)
})
```

**回调**

停止扫描设备成功或失败的回调

------



### 7.4 连接设备（推荐方式）

**前提**

确保手机蓝牙开启，且蓝牙初始化完成后，将需要连接的蓝牙设备mac作为参数传入。

**接口**

```js
veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager
```

**传入参数**

需要连接的设备mac

**使用示例**

```js
import { veepooBle } from '../../miniprogram_dist/index'
let value = {
deviceId:'设备的mac'
}
veepooBle.veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager(value,function(e){
console.log("e=>",e)
})
```

**回调**

连接设备成功或连接设备失败的回调。

**生产级连接（可选）：** 

```js
veepooWeiXinSDKConnectionDevice
```

带重试与总超时保护，并在连接成功后**自动发起密钥认证**，适合对稳定性要求高的场景。

**使用示例**

```js
veepooBle.veepooWeiXinSDKConnectionDevice({ deviceId }, e => {
  console.log('连接结果:', e) // { deviceId, connection, name? }
})
```

两者选其一即可。若使用 veepooWeiXinSDKConnectionDevice，它会自动触发认证，无需再手动调用密钥认证接口。

------



### 7.5 订阅监听（核心）

**前提**

确保手机蓝牙开启，并且初始化蓝牙，连接蓝牙后调用。必须认证前注册

**接口**

```js
veepooWeiXinSDKNotifyMonitorValueChange
```

**传入参数**

无

**使用示例**

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(function(e){
console.log("e=>",e)
})
```

**回调**

返回经过蓝牙解析的数据 

------



### 7.6 单独监听蓝牙数据返回
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

**接口**

```js
veepooWeiXinSDKBLECharacteristicValueChangeManager
```

**使用示例**

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKBLECharacteristicValueChangeManager(function(e){
console.log("e=>",e)
})
```
**回调**

返回经过解析的蓝牙数据

------



### 7.7 断开设备连接

**前提**

蓝牙初始化，已连接蓝牙设备

**接口**

```js
veepooWeiXinSDKloseBluetoothAdapterManager
```

接口名拼写为 `lose`（少一个 C），为既定导出名，**请原样使用，勿自行修正**。

**传入参数**

无

**使用示例**

```js
import { veepooBle } from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKloseBluetoothAdapterManager(function(e){
console.log("e=>",e)
})
```

**回调**

断开成功的回调

------



### 7.8 监听蓝牙断开

**前提**

蓝牙设备已连接

**接口**

```js
veepooWeiXinSDKBLEConnectionStateChangeManager
```

**使用示例**

```js
import { veepooBle } from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKBLEConnectionStateChangeManager(function(e){
console.log("e=>",e)
})
```

**回调**

返回蓝牙断开后的回调信息

------



### 7.9 获取已连接的蓝牙设备

**前提**

蓝牙设备已连接

**接口**

```js
veepooWeiXinSDKGetConnectedBleDeviceManager
```

**使用示例**

```js
import { veepooBle} from '../../miniprogram_dist/index'
veepooBle.veepooWeiXinSDKGetConnectedBleDeviceManager(function(e){
console.log("e=>",e)
})
```

**回调**

小程序已连接的蓝牙设备

------



## 8. 日志控制模块 veepooLogger

SDK 默认关闭日志，调试时可开启。

### 8.1 日志级别

| 级别  |  值  | 说明                       |
| ----- | :--: | -------------------------- |
| DEBUG |  0   | 显示所有日志               |
| INFO  |  1   | 显示 info/warn/error       |
| WARN  |  2   | 只显示 warn/error          |
| ERROR |  3   | 只显示 error               |
| NONE  |  4   | 不输出任何日志（**默认**） |

### 8.2 使用方法

```js
import { veepooLogger } from '../../miniprogram_dist/index'

veepooLogger.setLevel(veepooLogger.LEVEL.DEBUG)         // 调试期开启
veepooLogger.setLevel(veepooLogger.LEVEL.NONE)          // 上线前关闭
const level = veepooLogger.getLevel()                   // 获取当前级别
if (veepooLogger.isLevelEnabled(veepooLogger.LEVEL.DEBUG)) { /* DEBUG 已启用 */ }
```

**建议**：开发调试期用 `DEBUG`；正式上线前改回 `NONE` 或 `ERROR`，避免日志影响性能。

## 9.**功能接口模块 veepooFeature**

所有功能接口的前提：**已连接 + 已通过密钥认证**。返回数据统一走第 3 节的全局监听，按 `type` 区分。
文中每个接口标注的 `type` 即全局监听中的 `res.type`，

### 9.1 密钥认证(type=1)

**前提**

蓝牙设备已连接

**接口**

```js
veepooBlePasswordCheckManager
```

**传入参数**

| 参数   | 类型    | 备注                          |
| ------ | ------- | ----------------------------- |
| isPair | boolean | 配对模式 true 开启 false 关闭 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
 let data = {
     isPair: true
 }
veepooFeature.veepooBlePasswordCheckManager(data);
```

**补充说明**

1.  秘钥认证时一般不用开启配对操作，如没有特殊说明，建议将**'isPair'**设置为**false**;
2.  在进行ota固件升级之前，最好将**'isPair'**设置为**false**，否则固件升级操作会失败(在微信小程序的开发环境下使用ota,推荐使用**自动预览**进行)；

**回调**

```js
{
  name:"蓝牙密钥核准",
  type:1,// type 等于1 表示蓝牙密钥核准回调
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

回调值说明:

 值：VPDevicepassword

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
```

值：VPDeviceRaiseHand

```js
      // 开启，有效时间段为22：00-08：00
      return 'open'
      // 表示没有此功能
      return 'noThisFeature'
```

值：VPDeviceFindPhone ||  VPDeviceWearFlag

```js
      // 没有此功能
      return 'noThisFeature'
      // 开启功能
      return 'open'
      // 关闭功能
      return 'close'
```



------



#### 9.1.1 功能汇总（密钥认证回调中返回）

设备能力通过"功能汇总"字段返回，分为四包。**功能接口是否可用，需先对照这些字段判断设备是否支持。**

**第一包**

| 字段                     | 含义                                                         |
| ------------------------ | ------------------------------------------------------------ |
| drinkingAlcoholType      | 饮酒（0无；1旧饮酒判断方式；2新型饮酒判断方式）              |
| bloodPressureType        | 血压（0 无；1 有且默认带校准；2 自动评估；3 气泵无 ADC；4 同 1、设备端单独读取；5 气泵有 ADC） |
| healthTipsType           | 健康提醒（0 无；1 原久坐；2 健康提醒，与久坐互斥）           |
| skinColorType            | 肤色类型（0/1 肤色设置档位，只有1和2两个档位；2肤色设置有4个档位） |
| WechatCampaignType       | 微信运动（0无；1有微信运动；2有微信运动，针对部分产品无法在安卓端兼容的版本） |
| cameraType               | 拍照（0无；1App打开拍照界面后启动设备拍照页面；2拍照界面常驻设备中，iOS手机打开相机，设备通过HID调用拍照，Andriod可通过设备调用App上的相机，或者App主动打开相机界面调用设备拍照功能） |
| fatigueType              | 疲劳度                                                       |
| bloodOxygenType          | 血氧功能                                                     |
| heartRateAlarmType       | 心率报警(0默认支持心率功能；1不具备此功能)                   |
| brightScreenType         | 翻腕亮屏（0 无，APP 显示老的抬手亮屏；1 有；2 无且无抬手亮屏） |
| femaleType               | 女性项目（0 无；1 非中文推送中文；2 非中文推送英文；3 支持 12 国语言） |
| brightnessAdjustmentType | 屏幕亮度调节                                                 |
| highEndBloodPressureType | 高端血压                                                     |
| alarmClockType           | 闹钟类型（0无，但是有三组老闹钟；1~7都表示支持闹钟功能；254手表端彻底没有闹钟功能） |
| heartRateFunctionType    | 心率功能（0 支持，默认；1 不支持）                           |

**第二包**

| 字段                          | 含义                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| countdownTimeType             | 倒计时                                                       |
| dailyDataReadDayType          | 日常数据读取天数（0默认3天；1~7表示1~7的日常数据）           |
| HIDFunctionType               | HID 功能                                                     |
| modeOfMotionStorageNumberType | 运动模式存储次数                                             |
| UIStyleType                   | UI 风格类型（0表示不支持UI风格设置；1~n表示最大支持n种风格） |
| respiratoryRateFunctionType   | 呼吸率（0 不支持；1 血氧；2 ECG）                            |
| HRVType                       | HRV（0 不支持；1 血氧；2 ECG；3 全天 HRV）                   |
| weatherFunctionType           | 天气（0 不支持；1 开关可改、显示当天/明天温度；2 固定开；3 只显示当天/明天；4 只显示当前状态；6 显示紫外线） |
| screenDurationType            | 亮屏时长（0 无；1 有）                                       |
| sleepFlagBitType              | 睡眠标志位（1 精准睡眠；2 无睡眠）                           |
| clearDataBitsType             | 清除数据标志位                                               |
| ECGFunction                   | ECG（0 无；1 有）                                            |
| motionModeType                | 运动模式类型（0普通运动模式；1 10种多运动模式）              |

**第三包**

| 字段                        | 含义                                                         |
| --------------------------- | ------------------------------------------------------------ |
| dialNumberType              | 更多表盘和自定义数量                                         |
| addressBookType             | 通讯录类型                                                   |
| musicFunctionType           | 音乐功能                                                     |
| bodyTemperatureFunctionType | 体温（0 无；1 手动检测不在 App 展示；2 手动+自动；5 手动+自动、日常数据中） |
| lookupFunctionType          | 手机查找手环                                                 |
| AGPSFunctionType            | AGPS                                                         |
| GPSFunctionType             | GPS                                                          |
| geomagneticFunctionType     | 地磁                                                         |
| resetPasswordFunctionType   | 重设密码（0代表有密码设置；1App端不显示密码设置功能）        |
| testMicrophoneFunctionType  | 测麦                                                         |
| bloodGlucoseFunction        | 血糖（0 无；1 日常数据读取；3 仅私人模式；4 多校准；5 多校准+风险等级；8 同 4 设备端读取；9 同 5 设备端读取） |
| chipSeriesType              | 芯片系列                                                     |
| metaFunctionType            | 梅托（0无；1/2有梅脱功能）                                   |
| pressureFunctionType        | 压力（0无；1/2有压力功能）                                   |

**第四包**

| bloodComponentType         | 血液成分（0 无；1 血脂+尿酸；2 有）        |
| -------------------------- | ------------------------------------------ |
| bodyCompositionType        | 身体成分（0 无；1 有）                     |
| worldClockType             | 世界时钟                                   |
| bodyTemperatureAlarmType   | 体温报警（0 无；1 有过高过低提醒）         |
| walletType                 | 钱包（收款码，按 BIT：支付宝/微信/QQ）     |
| businessCardType           | 名片（按 BIT：微信/QQ/Facebook/Instagram） |
| gameFeatureType            | 游戏（0 无；1 有）                         |
| alQuestionAndAnswerType    | AI 问答（0 无；1 非大陆；2 大陆）          |
| alDialType                 | AI 表盘（0 无；1 非大陆；2 大陆）          |
| distanceAndCalorieType     | 距离与卡路里目标                           |
| videoDialType              | 视频表盘                                   |
| photoAlbumPhotosType       | 相册相片（0 不支持；1 支持）               |
| 4GFeatureType              | 4G（0 不支持；1 支持）                     |
| electronicBusinessCardType | 电子名片（与钱包/名片互斥）                |
| healthAssistanceType       | 健康辅助评估（0 不支持；>0 支持）          |
| microCheckType             | 微体检（0 不支持 App 端；1 支持）          |
| DAMotionContrlType         | 运动控制（0 不支持 ；1 支持）              |



------



### 9.2 读取电池电量(type=2)
注意⚠️:表盘传输和ota会有较大功耗，在进行表盘传输和ota时，需要增加电量限制，当发起表盘传输或者ota前，需要先读取电池电量，建议电池电量在30%以上，才允许进行传输或升级。

**前提**

设备已连接

**接口**

```js
veepooReadElectricQuantityManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooReadElectricQuantityManager();
```

**回调**

返回的电量信息

```js
{
      name:"电池电量读取",// 描述
      type:2,// type 等于2表示当前返回信息属于电量读取
      content: {
        VPDeviceIsPercent, // 电量是否显示百分百 true : false
        VPDeviceElectricPercent, // 当前设备电量，显示百分百出现
        VPDeviceElectricGrade, // 电量等级 显示等级出现
        VPDeviceElectricTypeIsLowVoltage // 是否低电，normal 正常，lowVoltage 低电
      }
}

```

------



### 9.3 同步个人信息(type=3)
注意：在使用女性功能前，需要先同步个人信息到手环设备，并且个人信息的身高体重会影响卡路里的计算。

**前提**

蓝牙设备已连接

**接口**

```js
veepooSynchronizingPersonalInformationManager
```

**传入参数**

| 参数   | 类型   | 备注               |
| ------ | ------ | ------------------ |
| height | string | 身高 单位为 cm            |
| weight | string | 体重 单位为 kg            |
| age    | string | 年龄               |
| sex    | string | 性别  0 女 1 男    |
| steps  | string | 目标步数           |
| sleep  | string | 目标睡眠  单位分钟 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
 let data = {
     height: '173',// 身高
     weight: '55',//体重
     age: '21',// 年龄
     sex: '1',// 性别
     steps: '8000',// 目标步数
     sleep: '420',// 目标睡眠分钟
  }     
veepooFeature.veepooSynchronizingPersonalInformationManager(data);
```

**回调**

返回同步成功的回调

```js
{
  name:"同步个人信息", //当前功能描述
  type:3,// type 等于3，表示当前回调是个人信息同步 
  content:{
    settingState:true;// 同步成功
  }
}
```

------



### 9.4 读取精准睡眠数据(type=4)

设备中睡眠数据保存三天，睡眠数据有单段或多段，入起夜再次入睡后，会产生第二段睡眠数据

**前提**

蓝牙设备已连接

**接口**

```js
veepooSendReadPreciseSleepManager
```

**传入参数**

| 参数 | 类型   | 备注                  |
| ---- | ------ | --------------------- |
| day  | number | 0 今天  1 昨天 2 前天 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day:0,// 0 今天 1 昨天 2 前天
}
veepooFeature.veepooSendReadPreciseSleepManager(data);
```

**回调**

返回读取精准睡眠成功的回调


```js
{
readDay:0,// 读取天数  0 今天  1 昨天  2 前天
Progress:100,// 读取进度 0-100,
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
          sleepQuality, //睡眠质量，0～4，对应G Band APP中的1～5🌟；
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

睡眠曲线：“111111111111111111111111111000000000000000000000000011111111111122222222211111111111114444411111111111111111114444”

曲线值含义：0深睡，1浅睡，2快速眼动，3失眠，4苏醒

如何使用：参考G Band（android，ios，HarmonyOS）取 0 1 2 4，小程序可使用canvas绘制睡眠曲线，在高度100，宽度自定义的画布绘制，每段25高度，使用不同颜色绘制区分曲线值。

------



### 9.5 读取日常数据（type=5）

日常数据保存三天时间，包含计步，运动量，脉率，血压，血氧，血糖，压力，血液，体温等信息。

**前提**

蓝牙设备已连接

**接口**

```js
veepooSendReadDailyDataManager
```

**传入参数**

| 参数    | 类型   | 备注                      |
| ------- | ------ | ------------------------- |
| day     | number | 读取天数  0 今天 1 昨天 2 前天  |
| package | number | 开始包 默认1 第一个包开始  |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day:0,
   package:1,
}
veepooFeature.veepooSendReadDailyDataManager(data);
```

**回调**

读取日常数据发送成功的回调


```js
{
Progress:100,// 读取进度 1-100%
name:"读取日常数据",
type:5,// type 等于5表示日常数据回调
content:{
  // 当前包的位数
  let currentPackageNum = 106,
  // 日期相关
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
         oxygens, //血氧
         apneaResults, //呼吸暂停次数
         isHypoxias, //呼吸暂停结果
         hypoxiaTimes, //低氧时间
         cardiacLoads, //心脏负荷
         corrects, //血氧矫正
  }
  //  睡眠活动相关   算法用到，应用层不做处理
  let sleepAmountActivity = ''
  //  睡眠状态量25个 算法用到，应用层不做处理
  let sleepStatus = ''
  //  复位 可不做处理
  let reset = ''
  let g5Series = ''
  //  血糖相关
  let bloodGlucose = ''  // 注意：血糖功能类型等于 5 与 9  格式  {bloodGlucose：5.43,level:1}   level 风险等级  1 低 2 中 3 高
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



### 9.6 体温测量(type=6/7)

#### 9.6.1 手动体温测量(type=6)

**前提**

蓝牙设备已连接，并且设备支持该功能

**接口**

```js
veepooSendTemperatureMeasurementSwitchManager
```

**传入参数**

| 参数   | 类型    | 备注                 |
| ------ | ------- | -------------------- |
| switch | boolean | true 开启  false关闭 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
switch:true,// true 开启 false  关闭
}
veepooFeature.veepooSendTemperatureMeasurementSwitchManager(data);
```

**回调**

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



#### 9.6.2 体温数据自动检测读取(type=7)

体温数据读取完成后，将数据保存到本地或者数据库中，下次读取可以根据上一次保存的数据包数，减少读取时间

在手环功能汇总，有体温类型

体温类型 0: 表示没有 1: 有体温但无自动测量 2/4/5: 有体温且有自动测量

**补充说明**

已经将体温数据自动自动读取整合在体温类型5的日常读取数据中的**bodyTemperature**字段中，不需要调用单独的接口去触发读。

**前提**

蓝牙设备已连接，设备支持该功能;

**接口**

```js
veepooReadAutoTemperatureMeasurementDataManager
```

**传入参数**

| 参数    | 类型   | 备注                           |
| ------- | ------ | ------------------------------ |
| day     | number | 读取天数  0 今天 1 昨天 2 前天 |
| package | number | 读取包数 默认1包开始，读取全部包 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
   day: 0,//读取天数 0 今天  1 昨天 2 前天
   package: 1, // 当前报数开始读取
}
veepooFeature.veepooReadAutoTemperatureMeasurementDataManager(data)  
```

**回调**

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

### 9.7 计步(type=8/9)

#### 9.7.1 读取计步数(type=8)

**前提**

设备已连接

**接口**

```js
veepooReadStepNumberManager
```

**传入参数**

| 参数 | 类型   | 备注                          |
| ---- | ------ | ----------------------------- |
| day  | number | 读取天数 0 今天 1 昨天 2 前天 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
 let data = {
        day: 0,// 0 今天 1 昨天 2 前提
     }
veepooFeature.veepooReadStepNumberManager(data);
```

**回调**


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

**day枚举**

```js
   day:'today',// 今天
   day:'yesterday',// 昨天
   day:'theDayBeforeYesterday',//前天
```

------



#### 9.7.2 读取实时计步数，卡路里，距离(type=9)

计步，卡路里，距离在本接口读取返回的数据是实时的，与日常数据的步数有差别，在日常数据中，每5分钟的汇总，存在滞后性。如果应用层需要同步获取设备端步数，需要在固定频率调用本接口获取数据

**前提**

蓝牙设备已连接

**接口**

```js
veepooReadStepCalorieDistanceManager
```

**传入参数**

| 参数 | 类型   | 备注                          |
| ---- | ------ | ----------------------------- |
| day  | number | 读取天数 0 今天 1 昨天 2 前天 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
 let data = {
        day: 0
     }
veepooFeature.veepooReadStepCalorieDistanceManager(data);
```

**回调**


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



### 9.8 天气功能(type=10)

#### 9.8.1 读取手环天气开关状态信息(type=10)

> 具体的实现请参考给出demo中的实现

**前提**

蓝牙设备已连接，并且支持该功能，应用层需要自行接入第三方天气数据，sdk内部只负责进行天气数据的传输

**接口**

```js
veepooSendReadWeatherForecastDataManager
```

**传入参数**

无

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadWeatherForecastDataManager();
```

**回调**


```js
{
  name:"读取手环天气信息",
  type:10,// type 等于10 表示天气功能回调
  content:{
    switch:true,// 天气开关
    unit:'摄氏度',//单位
    CrcL,// crcl 这个值不需要管
    CrcH,// crch 这个值不需要管
}
}
```

------



#### 9.8.2 手环天气功能开关(type=10)

> 在使用同步天气数据接口之前，优先调用此处的接口，并将 switch设置true，否则后续同步的天气数据无法在手环中进行查看

**前提**

蓝牙设备已连接，并且设备支持天气功能

**接口**

```js
veepooSendSettingWeatherForecastInfoManager
```

**传入参数**

| 参数   | 类型    | 注释                  |
| ------ | ------- | --------------------- |
| switch | boolean | 开关                  |
| unit   | number  | 单位 0摄氏度 1 华氏度 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
	switch:true,// 天气开关
	unit:0,// 气温单位 0 摄氏度 1 华氏度
}
veepooFeature.veepooSendSettingWeatherForecastInfoManager(data)
```

**回调**


```js
{
  name:"设置天气基本信息",
  type:10,// type 等于10 表示天气功能回调
  content:{
    switch:true,// 天气开关
    unit:'摄氏度',//单位
    CrcL,// crcl
    CrcH,// crch
}
}
```

------



#### 9.8.3 同步天气数据（type=10）

**前提**

蓝牙设备已连接，并且设备支持天气功能

**使用示例**

```js
veepooSendWeatherForecastDataManager
```

**参数**

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
    weatherStatus: 48,// 天气状态 中雨 具体的天气状态请查看下面的天气状态枚举
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
  dateTime:"2024-06-04",//时间
  maxFahrenheit:"80.40000000000001",// 最大华氏度  注意：需要将摄氏度转为华氏度
  minFahrenheit:"75.59999999999999",// 最华氏度
  ultravioletLight:2,// 紫外线强度
  weatherByDay:40,// 白天天气 具体的天气状态请查看下面的天气状态枚举
  weatherByNight:40,// 夜间天气 具体的天气状态请查看下面的天气状态枚举
}]
```

**天气状态(weatherStatus、weatherByDay 白天天气、weatherByNight 夜间天气)枚举：**

> VPWeatherServerHourlyModel
> 	 天气状态码对应天气状态关系 逐小时的状态与此关系一致
> 	 “()” 表示不包含
> 	 "[]" 表示包含

- [0,   4]          表示 - 晴天
- (4, 12]          表示 - 晴转多云
- (12, 16]        表示 - 阴天
- (16, 20]        表示 - 阵雨
- (20, 24]        表示 - 雷阵雨
- (24, 32]        表示 - 冰雹
- (32, 40]        表示 - 小雨
- (40, 48]        表示 - 中雨
- (48, 56]        表示 - 大雨
- (56, 72]        表示 - 暴雨
- (72, 84]        表示 - 小雪
- (84, 100]      表示 - 大雪
- (100, 155]    表示 - 多云

**紫外线强度(ultravioletLight)枚举:**

- [1,2]             表示 - 低
- [3,5]             表示 - 中等
- [6,7]             表示 - 高
- [8,10]           表示 - 很高

**使用示例**

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

**回调**


```js
{
  name:"同步天气信息",
  type:10,// type 等于10表示 天气功能相关
  error:"",// 同步成功或同步失败提示
}
```

------



### 9.9 单位设置(type=11)

**注意：**开关设置中的**心率**，**血压**，**血氧**，**科学睡眠**，**血糖**，**血液自动监测开关**等初始值和各个单位的初始值都是在“**公英制新增开关**”返回的包中获取



#### 9.9.1 读取公英制/单位/开关(type=11)

**前提**

蓝牙设备已连接

**接口**

```js
veepooSendReadDeviceUnitSettingDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadDeviceUnitSettingDataManager();
```

**回调**

 第一包

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
```

第二包

```js
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
    "VPSettingPressureFunctionSwitch": "noThisFeature",// 压力功能开关
    "VPSettingBloodGlucoseUnit": "mmol/L",// 血糖单位设置
    "VPSettingAutomaticBloodCompTest": "open",// 血液成分开关
    "VPSettingUricAcidUnit": "μmol/L",// 尿酸单位设置
    "VPSettingLipidUnit": "mmol/L"// 血脂单位设置
    "VPSettingFallWarning":"open",// 跌倒提醒开关
  }
}
```

**字段回调值说明：**

| 场景     | 取值                                                         |
| -------- | ------------------------------------------------------------ |
| 开关类   | `open` 开 | `close`关  | `noThisFeature` 无此功能            |
| 公英制   | `metricSystem` 公制（默认）| `english` 英制                  |
| 时间制   | `24`（默认）| `12`                                           |
| 体温单位 | `degreeCelsius` 摄氏度 | `fahrenheit` 华氏度                 |
| 血糖单位 | `mmol/L` | `mg/dl`                                           |
| 尿酸单位 | `μmol/L` | `mg/dl`                                           |
| 血脂单位 | `mmol/L` | `mg/dl`                                           |
| 设备控制 | `setup` 设置 | `read` 读取                                   |
| 肤色档位 | `1` 表示正常档位(白人) | `2` 表示皮肤偏黑的档位(该档位打开时佩戴检测关闭) |

------



#### 9.9.2 设置单位(type=11)

**前提**

蓝牙设备已连接

**接口**

```js
veepooSendUnitSettingDataManager
```

**传入参数**

| 参数                | 类型   | 备注 |
| ------------------- | ------ | ---- |
| unitLength          | string | 长度单位 metricSystem 公制 / english 英制 |
| unitBodyTemperature | string | 温度单位 degreeCelsius 摄氏度/ fahrenheit 华氏度 |
| unitBloodSugar      | string | 血糖单位 mmol/L / mg/dl |
| unitUricAcid        | string | 尿酸单位 μmol/L / mg/dl |
| unitBloodLipid      | string | 血脂单位 mmol/L / mg/dl |

**使用示例**

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

**回调**

```js

{
  name:"公英制新增开关",
  type:11,// type 等于11 表示公英制新增开关
  settingStatus:true,// 设置成功或设置失败布尔值
}

```

#### 9.9.3 自动测量开关设置(type=11)

注意：开关设置的初始值需要在公英制新增开关返回的两个包中获取
在全部的开关设置中，血氧自动监测开关，需要在自动监测接口设置

可以参考Demo中 /pages/switchSetup 的实现，如果读取到的开关状态为不支持，则表示对应设备不支持该开关控制，也有可能SDK暂未兼容

**前提**

设备设备已连接且支持开关设置功能

**接口**

设置接口

```js
veepooSendAutoTestSwitchDataManager
```

读取接口

```js
veepooSendReadDeviceUnitSettingDataManager
```

**传入参数**

| 参数            | 类型   | 备注         |
| --------------- | ------ | ------------ |
| heartRate       | string | 心率开关     |
| bloodPressure   | string | 血压开关     |
| scientificSleep | string | 科学睡眠     |
| bodyTemperature | string | 体温开关     |
| bloodGlucose    | string | 血糖开关     |
| bloodComponents | string | 血液成分开关 |
| pressure        | string | 压力开关     |
| fallWarning     | string | 跌倒提醒开关 |
| lowOxygen       | string | 低氧唤醒     |
| hrv             | string | HRV开关      |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  heartRate,//开启心率开关 start 开启  stop 关闭  
}

veepooFeature.veepooSendAutoTestSwitchDataManager(data)
```

**回调**

```js
{
  name:"公英制新增开关",
  type:11,// 表示公英制新增开关（开关设置）
  settingStatus:true,// 设置成功 || 设置失败
}
```

### 9.10 消息推送(ANCS)

**接口**

```
veepooSendANCSSwitchControlDataManager
```

设置各类消息推送开关。开关值统一为 `noThisFeature`（无此功能）/ `start`（开）/ `stop`（关）。

**第一包字段**

| 字段                | 含义      | 字段              | 含义    |
| ------------------- | --------- | ----------------- | ------- |
| VPSettingCall       | 来电      | VPSettingSMS      | 短信    |
| VPSettingWechat     | 微信      | VPSettingQQ       | QQ      |
| VPSettingFaceBook   | Facebook  | VPSettingTwitter  | Twitter |
| VPSettingwhatsapp   | WhatsApp  | VPSettingLine     | Line    |
| VPSettingInstagram  | Instagram | VPSettingSkype    | Skype   |
| VPSettingGMail      | Gmail     | VPSettingDingTalk | 钉钉    |
| VPSettingWeChatWork | 企业微信  | VPSettingOthers   | 其他    |

**第二包字段**

| 字段                 | 含义      | 字段                   | 含义      |
| -------------------- | --------- | ---------------------- | --------- |
| VPSettingOtherTikTok | TikTok    | VPSettingOtherTelegram | Telegram  |
| VPSettingKakaoTalk   | KakaoTalk | VPSettingMessenger     | Messenger |

**回调**

回调走全局监听

------



### 9.11 联系人 / SOS(type=12)



#### 9.11.1 读取联系人(type=12)

**注意：**因小程序使用低功耗蓝牙，**Android 不支持通话设置**；iOS 在弹出的配对框点击配对后可实现通话（在密钥认证中将**isPair:true**，开启配对模式）。

**前提**

蓝牙设备已连接，支持添加联系人，支持通话设置

接口

```js
veepooSendReadContactPersonDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadContactPersonDataManager()
```

**回调**


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



#### 9.11.2 设置或调整联系人(type=12)

联系人设置最多支持10人，sos设置最多支持5人

**前提**

蓝牙设备已连接，并且设备支持联系人设置

**接口**

```js
veepooSendSettingContactPersonDataManager
```

**传入参数**

| 参数          | 类型    | 备注           |
| ------------- | ------- | -------------- |
| isEdit        | boolean | 当前是否为编辑 |
| contactNumber | number  | 联系人id       |
| name          | string  | 联系人名称     |
| phone         | string  | 联系人手机号   |
| sos           | boolean | sos 状态       |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

// 设置联系人
let data = {
  isEdit:false,
  contactNumber: 4,// 联系人id
  name: "测试",// 联系人名称
  phone: '15289356892',// 手机号 这个是虚拟手机号
  sos:false,
}
veepooFeature.veepooSendSettingContactPersonDataManager(data)


// 编辑联系人
let data = {
  isEdit:true,
  contactNumber: 3,// 联系人id，需要-1，如id等于4的联系人，需要编辑，则传入3
  name: "测试",// 联系人名称
  phone: '15289356892',// 手机号 这个是虚拟手机号
  sos:false,
}
veepooFeature.veepooSendSettingContactPersonDataManager(data)

```

**回调**


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



#### 9.11.3 删除联系人(type=12)

**前提**

蓝牙设备已连接，且手表支持联系人功能

**接口**

```
veepooSendDeleteContactPersonDataManager
```

**传入参数**

| 参数  | 类型   | 备注     |
| ----- | ------ | -------- |
| sosId | number | 联系人id |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
  sosId: 1,// 联系人id，一般添加联系人的id是从1-10
}
veepooFeature.veepooSendDeleteContactPersonDataManager(data)
```

**回调**

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



#### 9.11.4 调整联系人(type=12)

**前提**

蓝牙设备已连接，且设备支持联系人功能，设备中联系人数量不小于1个

**接口**

```js
veepooSendAdjustContactPersonDataManager
```

**传入参数**

| 参数   | 类型   | 备注                 |
| ------ | ------ | -------------------- |
| fromId | number | 当前id               |
| toId   | number | 将当前id移动到目标id |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
    fromId: 1,// 当前联系人id
    toId: 2,// 目标联系人id
}

veepooFeature.veepooSendAdjustContactPersonDataManager(data)

```

**回调**

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



#### 9.11.5 读取sos(type=12)

**前提**

蓝牙设备已连接，且设备支持联系人功能

**接口**

```js
veepooSendReadSOSDataManager
```

**传入参数**

无

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

veepooFeature.veepooSendReadSOSDataManager();
```

**回调**

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



#### 9.11.6 设置SOS(type=12)

**前提**

蓝牙设备已连接，且设备支持联系人功能

**接口**

```js
veepooSendSettingSOSDataManager
```

**传入参数**

| 参数  | 类型   | 备注    |
| ----- | ------ | ------- |
| times | number | 范围1-3 |

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

let data = {
    times:3,
}
veepooFeature.veepooSendSettingSOSDataManager(data);
```

**回调**

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



### 9.12 文字闹钟功能(type=13)

文字闹钟运行在设备端进行操作开关，时间设置等，但无法输入文字
设备最多支持10组闹钟，应用层应增加限制闹钟个数逻辑，否则设备可能会出现异常



#### 9.12.1 读取文字闹钟(type=13)

**前提**

蓝牙设备已连接，且支持文字闹钟功能

**接口**

```js
veepooSendReadAlarmClockDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'

veepooFeature.veepooSendReadAlarmClockDataManager();
```

**回调**

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



#### 9.12.2 设置文字闹钟(type=13)

**前提**

蓝牙设备已连接，且设备支持文字闹钟功能

**接口**

```js
veepooSendSetAlarmClockDataManager
```

**传入参数**

| 参数        | 类型   | 备注                 |
| ----------- | ------ | -------------------- |
| alarmId     | number | 闹钟id，1开始递增    |
| switch      | BOOL   | 开关                 |
| time        | string | 时间                 |
| alarmRepeat | object | 重复天数，周一到周日 |
| name        | string | 闹钟标识             |

**使用示例**

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

**回调**

```js
{
  name:"设置文字闹钟",
  type:13,// type 等于13表示 文字闹钟功能回调
}

```

注意：更改闹钟只需要将原本数据更改周数，时间等，然后将数据传入设置接口即可

------



#### 9.12.3 删除文字闹钟(type=13)

删除文字闹钟，将需要删除的闹钟值传入删除接口即可

**前提**

蓝牙设备已连接，且设备支持文字闹钟功能

**接口**

```js

veepooSendDeleteAlarmClockDataManager

```

**传入参数**

| 参数        | 类型   | 备注                 |
| ----------- | ------ | -------------------- |
| alarmId     | number | 删除闹钟的id         |
| switch      | BOOL   | 开关                 |
| time        | string | 时间                 |
| alarmRepeat | object | 重复天数，周一到周日 |

**使用示例**

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

**回调**

```js
{
  name:"删除文字闹钟",
  type:13,// type 等于13表示 文字闹钟功能回调
}
```

------



### 9.13 运动功能(type=14/15/16)

#### 9.13.1 读取运动模式校验值(type=14)

最多存储3次运动模式校验值，超过三次的最新一次将往前覆盖

前提

蓝牙设备已连接，且设备支持运动模式功能

接口

```js
veepooSendAppStartMovementPatternD3DataManager
```

传入参数

无

使用示例

```js
import {veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendAppStartMovementPatternD3DataManager();
```

设备返回

| 参数    | 类型   | 备注                                            |
| ------- | ------ | ----------------------------------------------- |
| name    | string | 描述 (读取运动数据的CRC，主动上报运动数据的CRC) |
| type    | number | 类型描述 值14                                   |
| content | object | 三个校验值                                      |

content内容

```js
{
  name:"读取运动数据的CRC",
  type:14,
  
  //含有运动数据的content
  content：{
	CRC0,//第一个运动模式的校验值
	CRC1,//第二个运动模式的校验值
	CRC2,//第三个运动模式的校验值
  }

  //运动数据为0的content
  content:{
    deviceState:0,
    status:"successful"
  }

}
```

------



#### 9.13.2 开启或关闭运动模式(type=15)

目前设备默认普通运动模式

**前提**

蓝牙设备已连接，且设备支持运动模式功能

**接口**

```js
veepooSendAppStartMovementPatternD5DataManager
```

**传入参数**

| 参数   | 类型   | 备注                              |
| ------ | ------ | --------------------------------- |
| switch | string | 设备开关 开启： start 关闭 ：stop |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start'// start 开启 stop关闭
}
veepooFeature.veepooSendAppStartMovementPatternD5DataManager(value);
```

**回调**

```js
{
  name:"开启运动模式",
  status:"successful",
  type:15,/// type 等于15表示 运动模式功能

}
```

------



#### 9.13.3 读取运动模式数据(type=16)

读取运动模式数据，确保得到了crc后才能调用本接口

**前提**

蓝牙设备已连接，设备支持运动模式功能

**接口**

```js
veepooSendReadMovementPatternD4DataManager
```

**传入参数**

| 参数   | 类型   | 备注        |
| ------ | ------ | ----------- |
| module | number | 参数  1 2 3 |

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let value = {
	module:1// 1 2 3 三个参数 根据获取的运动校验值是否不等于0进行进行读取，如 crc0 不等于0，传入1获取crc0的运动数据
}
veepooFeature.veepooSendReadMovementPatternD4DataManager(value);
```

**回调**

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



### 9.14 手机查找手环(type=17)

需要判断设备是否支持手机查找设备功能，需要在 手环功能汇总 查找

**前提**

蓝牙设备已连接，且设备支持查找手环功能

**接口**

```js
veepooSendPhoneLookBraceletDataManager
```

**传入参数**

| 参数   | 类型   | 备注                |
| ------ | ------ | ------------------- |
| switch | string | start 开启 stop关闭 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendPhoneLookBraceletDataManager(value);
```

**回调**


```js
{
  name:"开始查找 || 停止查找",
  type:17,// type 等于17表示 手机查找手环功能回调
  content:"开始查找 || 停止查找"
}

```

------



###  9.15 血压功能(type=18/28)

#### 9.15.1 血压单项测量（通用血压 type=18）

**前提**

蓝牙设备已连接，且设备支持血压功能

**接口**

```js
veepooSendReadUniversalBloodPressureDataManager
```

**传入参数**

| 参数   | 类型   | 备注                  |
| ------ | ------ | --------------------- |
| switch | string | start  开启 stop 关闭 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendReadUniversalBloodPressureDataManager(value);
```

**回调**


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

**state枚举：**

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



#### 9.15.2 设置血压私人定制(type=28)

私人定制血压值没有开关量

**前提**

蓝牙设备已连接，且设备支持血压功能

**接口**

```js
veepooSendBloodPressurePrivateDataManager
```

**参数**

| 参数   | 类型   | 备注                  |
| ------ | ------ | ---------------------|
| switch | string | start  开启 stop 关闭 |
| bloodPressureHigh | string | 高压  |
| bloodPressureLow | string | 低压  |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
    bloodPressureHigh: 150,// 血压私人定制高压值
    bloodPressureLow: 89,// 血压私人定制低压值
}
veepooFeature.veepooSendBloodPressurePrivateDataManager(value);
```

**回调**


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



#### 9.15.3 血压私人定制测量(type=18)

需要先设置血压私人定制值，在进行血压私人定制测量

**前提**

蓝牙设备已连接，且设备支持血压私人功能

**接口**

```js
veepooSendPrivateBloodPressureStupDataManager

```

**传入参数**

| 参数   | 类型   | 备注                  |
| ------ | ------ | --------------------- |
| switch | string | start  开启 stop 关闭 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭
}
veepooFeature.veepooSendPrivateBloodPressureStupDataManager(value);
```

**回调**


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





### 9.16 心率(type=51 / 20)

#### 9.16.1 心率手动测量(type=51)

**前提**

设备已连接，且设备支持该功能

注意，心率测量开启时

> 1.设备如果正在充电或测量其它功能，会报设备正忙状态，并自动退出测试；
>
> 2.如果佩戴未通过，会报设备未佩戴通过状态，并自动退出测试；

正常条件下，心率开启测量后，会持续测量，设备不会主动结束，建议设置60秒定时器，到时间调用结束接口结束测量，并且遇到异常情况，清除定时器；

**接口**

```js
veepooSendHeartRateTestSwitchManager
```

**传入参数**

| 参数   | 类型    | 备注                |
| ------ | ------- | ------------------- |
| switch | boolean | true 开启 false 关闭 |

**使用示例**

可以参考DEMO中，/pages/heartRateTest 路径下的实现

```js
import { veepooFeature } from '../../miniprogram_dist/index'

// 开启心率测量
veepooFeature.veepooSendHeartRateTestSwitchManager({ switch: true })

// 关闭心率测量
veepooFeature.veepooSendHeartRateTestSwitchManager({ switch: false })
```

**回调**

| 参数    | 类型   | 备注     |
| ------- | ------ | -------- |
| name    | string | 描述     |
| type    | number | 类型描述 |
| content | object | 内容     |

content内容

```js
{
   type: 51,// type 等于51表示心率测量
   name: "心率测量",
   content: {
    heartRate,   // 心率值，有效范围为[30, 250]
    heartState,  // 心脏状态，【废弃字段】
    watchState,  // 手表状态，【废弃字段】
    deviceBusy,  // bool 为true时，表示设备正忙，优先判断
    notWear,     // bool 为false时，表示正常。为true时，表示佩戴检测未通过
  }
}
```

**字段说明**

heartRate 心率值，有效范围为[30, 250]，不在此范围内的结果输出，应该要过滤，请勿向用户显示0 bpm，非法范围值，显示 -- bmp。

另外，先判断设备是否正忙，再判断佩戴是否通过。

------




#### 9.16.2 心率报警功能(type=20)

**前提**

设备已连接，且设备支持该功能

**接口**

```js
veepooSendHeartRateAlarmIntervalDataManager
```

**传入参数**

| 参数         | 类型   | 备注     |
| ------------ | ------ | -------- |
| switch       | string | 开关     |
| maxHeartRate | string | 最大心率 |
| minHeartRate | string | 最小心率 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop 关闭 read 读取
	maxHeartRate:'150',
	mimHeartRate:'60',
}
veepooFeature.veepooSendHeartRateAlarmIntervalDataManager(value);
```

**回调**

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



### 9.17 血液成分(type=21)

血液成分功能支持校准逻辑，同血压校准类似

#### 9.17.1 血液成分单项测量 || 血液成分校准测量(type=21)

注意：使用血液成分校准测量前，需要先设置血液校准值

**前提**

设备已连接，且支持该功能

**接口**

```js
veepooSendBloodComponentDataManager
```

**传入参数**

| 参数   | 类型   | 备注        |
| ------ | ------ | ----------- |
| switch | string | start  stop |
| calibration | string | 是否使用校准值 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'start',// start 开启 stop关闭
  calibration:false,// true 不使用血液校准  false 使用校准
}
veepooFeature.veepooSendBloodComponentDataManager(value);
```

**回调**


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

**deviceAck枚举：**

-  usable：可用的;

- deviceLowVoltage： 设备低电;

- deviceBusy： 设备忙碌 pass;

- notPassTheWearing： 佩戴不通过;

------



#### 9.17.2 设置血液成分校准值(type=21)

血液校准值需要在特定范围内

**前提**

设备已连接

**接口**

```js
veepooSendBloodComponentCheckDataManager
```

**传入参数**

| 参数            | 类型   | 备注                   |
| --------------- | ------ | ---------------------- |
| deviceControl   | string | setup 设置 read 读取   |
| switch          | string | start 开启 stop 关闭   |
| uricAcidVal     | string | 尿酸 90-1000 u mol/L   |
| cholesterol     | string | 总胆固醇 0.01 - 20     |
| triacylglycerol | string | 甘油三脂 0.01 - 20     |
| highDensity     | string | 高密度脂蛋白 0.01 - 20 |
| lowDensity      | string | 低密度脂蛋白 0.01 - 20 |

**使用示例**

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

**回调**

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



### 9.18 血糖(type=22)

#### 9.18.1 血糖测量 || 血糖校准测量(type=22)

血糖测量跟血液测量类型

前提

设备已连接，并且设备支持血糖功能

接口

```js
veepooSendBloodGlucoseMeasurementDataManager
```

参数

| 参数   | 类型   | 备注                      |
| ------ | ------ | ------------------------- |
| switch | string | 开关 start 开启  stop关闭 |    
| calibration | string | 是否使用校准 |    

使用示例

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',
  calibration: false,// true 开启校准模式  false 关闭校准模式
}
veepooFeature.veepooSendBloodGlucoseMeasurementDataManager(data);
```

回调


```js
{
  name:"血糖测量",
  type:22,// type 类型等于22 表示血糖功能
  Progress:100,// 进度 0-100
  deviceAck:"",// 设备状态
  content:{
    bloodGlucose:"",// 血糖值   血糖功能类型等于 5 与 9   格式：{bloodGlucose：4.32,level:1} // level 1 低 2 中 3 高 
  }
}

```

**deviceAck枚举：**

- usable： 可用的；

- deviceLowVoltage： 设备低电；
- deviceBusy：设备忙碌 pass；
- notPassTheWearing： 佩戴不通过；

------



#### 9.18.2 血糖校准模式(type=22)

此功能会被6个血糖值覆盖（血糖私人模式）

**前提**

设备已连接

**接口**

```js
veepooSendBloodGlucoseCalibrateModuleDataManager
```

**传入参数**

| 参数              | 类型           | 备注       |
| ----------------- | -------------- | ---------- |
| switch            | string         | 开关       |
| bloodGlucoseValue | number\|string | 血糖校准值 |

**使用示例**

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

**回调**


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



#### 9.18.3 血糖6个值校准模式（血糖私人模式 type=22）

##### 9.18.3.1设置血糖6个校准值(type=22)

设置早餐、午餐、晚餐的餐前和餐后的校准值

**前提**

设备已连接，且设备支持血糖私人模式

**接口**

```js
veepooSendSixBloodGlucoseCalibrateValueDataManager
```

**传入参数**

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

| 六个参数Object子项 | 类型   | 备注                                                |
| ------------------ | ------ | --------------------------------------------------- |
| hour               | string | 小时                                                |
| minute             | string | 分钟                                                |
| bloodGlucoseValue  | string | 血糖值 **取值范围**：毫摩尔/升(默认) **[3.0,15.0]** |

**补充说明(重点)**

1. **餐前与餐后时间校验**
   在设置早餐、午餐、晚餐的餐前及餐后时间时，必须确保**餐前时间早于餐后时间**。若餐前时间晚于或等于餐后时间，系统将视为无效配置，无法正确记录时间参数及对应的校准值。

2. **血糖值单位与取值范围**
   接口统一要求血糖值以**毫摩尔/升（mmol/L）**为单位，且数值必须在 **[3.0, 15.0]** 范围内。

   若原始数据为毫克/分升（mg/dL），需先按公式 **mg/dL = mmol/L × 18** 进行换算，确保换算后的值落在 **[54, 270]** 范围内；

   换算完成后，**最终传入接口时，必须再次转换回 mmol/L 单位，并确保值在 [3.0, 15.0] 之间**。

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
 let data = {
  conSwitch: 'start', // start 开启  stop 关闭
  switch: 'setup', // setup 设置 read 读取
  beforeBreakfast: {
    hour: '08',
    minute: '00',
    bloodGlucoseValue: 5.5 // 取值范围：毫摩尔/升[3.0,15.0]
  },
  afterBreakfast: {
    hour: '09',
    minute: '00',
    bloodGlucoseValue: 7.5// 取值范围：毫摩尔/升 [3.0,15.0]
  },
  beforeLunch: {
    hour: '12',
    minute: '00',
    bloodGlucoseValue: 5.0// 取值范围：毫摩尔/升[3.0,15.0]
  },
  afterLunch: {
    hour: '13',
    minute: '00',
    bloodGlucoseValue: 7.5// 取值范围：毫摩尔/升 [3.0,15.0]
  },
  beforeDinner: {
    hour: '18',
    minute: '00',
    bloodGlucoseValue: 6.5// 取值范围：毫摩尔/升 [3.0,15.0]
  },
  afterDinner: {
    hour: '19',
    minute: '00',
    bloodGlucoseValue: 7.5// 取值范围：毫摩尔/升 [3.0,15.0]
  }
}
veepooFeature.veepooSendSixBloodGlucoseCalibrateValueDataManager(data);
```

**回调**

| 参数      | 类型   | 备注                 |
| --------- | ------ | -------------------- |
| name      | string | 描述                 |
| type      | number | 类型描述22           |
| deviceAck | string | 设置/读取状态        |
| switch    | string | setup 设置 read 读取 |


```js
{
  "name": "血糖6个校准模式",
  "type": 22, 
  "deviceAck": "successful",
  "switch": "setup"
}
```

------

##### 9.18.3.2 读取血糖6个校准值(type=22)

读取当前设备早餐、午餐、晚餐的餐前和餐后的校准值

**前提**

设备已连接，且设备支持血糖私人模式

**接口**

```js
veepooSendSixBloodGlucoseCalibrateValueDataManager
```

**传入参数**

| 参数      | 类型   | 备注                 |
| --------- | ------ | -------------------- |
| conSwitch | string | start 开启 stop 关闭 |
| switch    | string | setup 设置 read 读取 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
 let data = {
  conSwitch: 'start', // start 开启  stop 关闭
  switch: 'read', // setup 设置 read 读取
}
veepooFeature.veepooSendSixBloodGlucoseCalibrateValueDataManager(data);
```

**回调**

| 参数      | 类型     | 备注                 |
| --------- | -------- | -------------------- |
| name      | string   | 描述                 |
| type      | number   | 类型描述22           |
| deviceAck | string   | 设置/读取状态        |
| switch    | string   | setup 设置 read 读取 |
| content   | string[] | 内容                 |


```js
{
  "name": "血糖6个校准模式",
   "type": 22,
    "deviceAck": "successful",
     "switch": "read",
      "content": {
        "calibrationSwitch":"start",// start 开启 stop 关闭
         // 注意:回调数据返回的bloodGlucoseValue的数据格式是毫摩尔/升，若是要用毫克/方升则需要将获取到的数据乘以18
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



### 9.19 提醒类功能(type=23 / 24 / 25 / 26 / 19)

#### 9.19.1 久坐功能提醒(type=23)

**前提**

设备已连接，且设备支持久坐提醒功能


本接口无标志位判断设备是否支持久坐，要判断设备是否支持久坐，可以使用接口读取一遍信息，如果触发失败，则表示设备不支持本接口，需要到**健康提醒接口**获取

**接口**

```
veepooSendSetupSedentaryToastTimeDataManager
```

**传入参数**

| 参数         | 类型   | 备注                                |
| ------------ | ------ | ----------------------------------- |
| switch       | string | 开关 start 开启 stop 关闭 read 读取 |
| startTime    | string | 开启久坐时间                        |
| endTime      | string | 关闭久坐时间                        |
| intervalTime | number | 间隔时间                            |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// start 开启 stop 关闭 read 读取
  startTime: '12:10',// 开始时间
  endTime: '12:40',// 结束时间
  intervalTime: 30//间隔时间
}
veepooFeature.veepooSendSetupSedentaryToastTimeDataManager(data)
```

**读取示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'read',// start 开启 stop 关闭 read 读取
}
veepooFeature.veepooSendSetupSedentaryToastTimeDataManager(data)
```

**回调**

```js
{
  name:"久坐功能提醒",
  type:23,// type 等于23表示久坐功能提醒
  deviceAck:'Success',// 成功或失败回调 failure 失败; Success 成功; noThisFeature 没有该功能
  content: {
    startTime:'12:10',// 开始时间
    endTime:'12:40',// 结束时间
    intervalTime:30,// 间隔
    deviceControl：'stop',// 设备设置状态 stop 停止设置; start 开始设置; read 正在设置
    switchStatus:true,// 开关状态
}
}
```

------

#### 9.19.2 健康功能提醒(type=26)

手环功能汇总的健康功能提醒字段，当字段等于1，久坐功能需要在单独的接口获取，当字段等于2，久坐功能集成到健康功能提醒

**注意**

在使用此接口之前一定要确认在功能汇总返回的数据中，字段**healthTipsType**的数据，如果字段为**1**，则不支持当前的健康功能提醒接口，就只能使用久坐功能的接口；如果字段为**2**，就可以使用此接口。

**前提**

设备已连接

**接口**

```js
veepooSendHealthToastFeatureDataManager
```

**传入参数**

| 参数          | 类型   | 备注                              |
| ------------- | ------ | --------------------------------- |
| switch        | string | 开关 start 开启 stop关闭 read读取 |
| startTime     | string | 开始时间                          |
| endTime       | string | 结束时间                          |
| intervalTime  | number | 间隔时间                          |
| deviceControl | string | 控制 setup设置 read 读取          |
| deviceType    | string | 功能类型： 久坐 喝水              |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start'，// 开关 start 开启 stop 关闭 read 读取
  startTime: '12:10',// 开始时间
  endTime: '12:40',// 结束时间
  intervalTime: 30,//间隔时间
  deviceControl: 'setup',// 控制 setup 设置 read 读取
  deviceType:'久坐',// 功能类型  久坐 喝水等
}
veepooFeature.veepooSendHealthToastFeatureDataManager(data);
```

**读取使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  deviceControl: 'read',// 控制 setup 设置 read 读取
}
veepooFeature.veepooSendHealthToastFeatureDataManager(data);
```

**回调**


```js
{
  name:"健康功能提醒",
  type:26,// type 等于26表示 健康功能提醒
  deviceAck:"Success",// 读取或者设置状态
  totalPackage:2,// 总包  总共有多少个功能，每一个功能为一个包
  currentPackage:1,// 当前返回的包
  content: {
      startTime: '12:10',// 开始时间
      endTime: '12:40',// 结束时间
      deviceType:'久坐',// 功能类型
      intervalTime:30,//间隔时间
      deviceSwitch:stop//开关
  }
}
```

**deviceType(功能类型):**
久坐, 喝水, 远眺, 运动, 吃药, 看书, 出行, 洗手

**注意**：功能类型并不是每个表都支持，需要根据支持的类型进行设置

------



#### 9.19.3 拍照(type=24)

**前提**

设备已连接，且设备支持拍照功能

**接口**

```js
veepooSendTakeAPictureDataManager
```

**传入参数**

| 参数   | 类型   | 备注                        |
| ------ | ------ | --------------------------- |
| switch | string | start 进入拍照 stop退出拍照 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// start 进入拍照 stop 退出拍照
}
veepooFeature.veepooSendTakeAPictureDataManager(data);
```

**回调**


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



#### 9.19.4 抬手亮屏(type=25)

**前提**

设备已连接，且设备支持抬手亮屏功能

**接口**

```js
veepooSendTurnWristBrightScreenDataManger
```

**传入参数**

| 参数        | 类型   | 备注                          |
| ----------- | ------ | ----------------------------- |
| switch      | string | start 开启 stop关闭 read 读取 |
| startTime   | string | 开始时间                      |
| endTime     | string | 结束时间                      |
| deviceLevel | number | 等级 等级设置范围:[1,10]      |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',// 开关 start 开启 stop关闭 read 读取
  startTime: '12:10',// 开始时间
  endTime: '12:40',// 结束时间
  deviceLevel: 5,// 灵敏登记
}
veepooFeature.veepooSendTurnWristBrightScreenDataManger(data);
```

**回调**


```js
{
  name:"抬手亮屏",
  deviceAck:"Success",// 设置成功或失败的状态 Success 成功 failure 失败
  type:25,// type等于25 表示抬手亮屏功能
  content: {
    startTime:'12:10',// 开始时间
    endTime:'12:40',// 结束时间
    deviceSwitch:'start',// 开关 start 开启 stop 关闭
    deviceLevel:5,// 灵敏等级[1,10]
    defaultLevel:0,//默认等级 0 无翻弯等级设置功能
    deviceControl:'start',// 控制  start 开启 stop关闭  read 读取
  }
}
```

------



#### 9.19.4 屏幕亮度时长设置(type=19)

**前提**

设备已连接，且设备支持该功能

**接口**

```
veepooSendLightUpTimeDataManager
```

**传入参数**

| 参数     | 类型   | 备注                 |
| -------- | ------ | -------------------- |
| switch   | string | setup 设置 read 读取 |
| duration | string | 设置时间  3-60秒     |

**使用示例**

```js
import {  veepooFeature } from '../../miniprogram_dist/index'
let value = {
	switch:'setup',// setup 设置 read 读取
	duration:'20',// 单位 秒 3-60
}
veepooFeature.veepooSendLightUpTimeDataManager(value);
```

**回调**

```js
{
  name:"屏幕常亮时长",
  deviceControl:""setup",// 设置状态  setup 设置 read  读取
  type:19,// type 等于19表示屏幕亮度时长
  content: {
    currentDuration, // 当前设置亮屏时长 3-60秒
    recommend, // 推荐亮屏时长 3-60秒
    maxDuration, // 最大亮屏时长 3-60秒
    minDuration, // 最小亮屏时长 3-60秒
 }
}
```

------

### 9.20 血氧(type=29 / 31)

#### 9.20.1 设置/读取血氧自动监测(type=29)

**前提**

设备已连接，且设备支持全体血氧监测

**注意**：需要查看  **手环功能类型** 是否支持全天血氧检测

**接口**

```js
veepooSendBloodOxygenAutoTestDataManager
```

**传入参数**

| 参数          | 类型   | 备注                 |
| ------------- | ------ | -------------------- |
| switch        | string | start 开启 stop 关闭 |
| startTime     | string | 开始时间             |
| endTime       | string | 结束时间             |
| deviceControl | string | setup 设置 read 读取 |

注意：时间传入固定 开始时间22：00  结束时间：08:00

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch:'start',// start 开启 stop 关闭
  startTime:'12:10',// 开始时间
  endTime:'12:40',// 结束时间
  deviceControl:'setup'，// setup设置 read 读取
}
veepooFeature.veepooSendBloodOxygenAutoTestDataManager(data);
```

**回调**


```js
{
  name:"血氧自动检测",
  type:29,// type 等于29，表示血氧自动监测功能
  deviceAck:"Success",// 设置或读取状态
  content: {
    switch:'start',// 开关
    startTime:'12:10',//开始时间
    endTime:'12:40',//结束时间
  }
}
```

**补充说明(重点)**：当前已经将血氧全天自动检测处的数据整合进读取日常数据**（veepooSendReadDailyDataManager type=5）**中，请在该接口回调字段**bloodOxygen**中进行查看；

------



#### 9.20.2 血氧手动测量(type=31)

**前提**

设备已连接，且设备支持血氧手动测量功能

注意，血氧测量开启时

> 1.设备如果正在充电或测量其它功能，会报设备正忙状态，并自动退出测试；
>
> 2.如果佩戴未通过，会报设备未佩戴通过状态，并自动退出测试；

正常条件下，血氧开启测量后，会持续测量，设备不会主动结束，建议设置60秒定时器，到时间调用结束接口结束测量，并且遇到异常情况，清除定时器；

**接口**

```js
veepooSendBloodOxygenControlDataManager
```

**传入参数**

| 参数   | 类型   | 备注                |
| ------ | ------ | ------------------- |
| switch | string | start 开启 stop关闭 |

**使用示例**

可以参考DEMO中，/pages/bloodOxygen2 路径下的实现

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  switch: 'start',
}
veepooFeature.veepooSendBloodOxygenControlDataManager(data);
```

**回调**

注意：血氧自动检测值在日常数据读取

```js
{
    name: '血氧手动测量',
    type: 31,
    content: {
      bloodOxygen:97,  // 血氧值，有效范围 [70, 100]，非法值请勿显示具体值，以"--"代替
      deviceBusy:false,   // 设备是否正忙 true 设备正忙 false 设备空闲
      notWear:false       // 设备是否未佩戴 true 未正确佩戴设备 false 正确佩戴设备
    }
}
```

**字段说明**

bloodOxygen 血氧值，有效范围为[70, 100]，不在此范围内的结果输出，应该要过滤，请勿向用户显示0 %，非法范围值，显示 -- %。

另外，先判断设备是否正忙，再判断佩戴是否通过。

------



### 9.21 女性经期(type=33)

女性功能为SDK的限制功能，需要先与我司商务联系，进行商务对接。

在权限未开启情况下，相应接口的职能无法生效。

 女性经期功能较为复杂，需要结合sdk demo代码进行开发

**前提**

设备已连接且支持该功能

**接口**

```js
veepooSendFemaleInstructionsDataManager
```

**传入参数**

| 参数                 | 类型   | 备注               |
| -------------------- | ------ | ------------------ |
| deviceControl        | string | 设备模式           |
| menstruationTime     | string | 最后一次经期时间   |
| menstruationLength   | number | 月经时间 如5天     |
| menstruationInterval | number | 月经间隔 如28天    |
| babySex              | number | 孩子性别 1 男 2 女 |
| babyDateBirth        | string | 孩子出生日期       |

**deviceControl枚举**

- 00： 没有女性生理记录
- 01：只记经期
- 02：备孕期
- 03：怀孕期
- 04：辣妈
- 05：读取

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let data = {
  deviceControl: '04',// 类型
  menstruationTime: '2026-01-01',// 经期时间时间
  menstruationLength: 5,// 经期长度
  menstruationInterval: 30,// 经期间隔
  babySex: 1,// 婴儿性别 1 男 2 女
  babyDateBirth: '2026-10-10',// 婴儿出生日期，不为辣妈期值无效
}
veepooFeature.veepooSendFemaleInstructionsDataManager(data)
```

**回调**

```js
 {
  "name": "女性经期", 
  "type": 33, // type 等于32表示女性经期功能
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



### 9.22 设备管理(type=90 / 34)

#### 9.22.1 恢复出厂设置(type=90)

**前提**

设备已连接，且设备支持恢复出厂设置

**接口**

```js
veepooSendResettingTheDeviceDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
veepooFeature.veepooSendResettingTheDeviceDataManager()
```

**回调**

```js
{
  deviceAck:"Success",// 恢复出厂设置状态
  name:"恢复出厂设置",
  type:90,// type 等于90 表示出厂设置
}
```

------



#### 9.23.2 复位(软重启)

**前提**

设备已连接且支持复位功能

**接口**

```js
veepooSendResetDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
veepooFeature.veepooSendResetDataManager()
```

**回调**

无

------

#### 9.23.3 语言设置(type=34)

**前提**

设备已连接且支持语言设置功能

**接口**

```js
veepooSendLanguageSetupManager
```

**传入参数**

| 参数     | 类型   | 备注                  |
| -------- | ------ | --------------------- |
| language | number | 支持的语言编号 [1,11] |

**可选语言编号**

| 1    | 2    | 3    | 4    | 5    | 6    | 7        | 8        | 9    | 10     | 11       |
| ---- | ---- | ---- | ---- | ---- | ---- | -------- | -------- | ---- | ------ | -------- |
| 中文 | 英文 | 日语 | 韩语 | 德语 | 俄语 | 西班牙语 | 意大利语 | 法语 | 越南语 | 葡萄牙语 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index' 
let val = {
    language: 1 //中文
}
veepooFeature.veepooSendLanguageSetupManager(data)
```

**回调**

```js
{
  ack:1,// 恢复成功 0 设置失败 1 设置成功
  name:"语言设置",
  type:34,
}
```



------



### 9.24 肤色档位设置

**前提**

设备已连接

**接口**

```
veepooSendSkinToneSettingDataManager
```

**传入参数**

| 参数          | 类型   | 备注            |
| ------------- | ------ | --------------- |
| skinColorType | number | 肤色类型 0 与 2 |
| level         | number | 肤色档位        |

**使用示例**

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



### 9.25 ota升级/杰理表盘传输

OTA 与表盘传输基于独立的 **`jieli_sdk`** 模块（不在 `miniprogram_dist` 内），需单独引入：

```js
import { BleDataHandler } from '../../jieli_sdk/lib/ble-data-handler'
import {
  veepooJLAuthenticationManager, veepooJLOTAInITManager,
  veepooJLStartOTAManager, veepooJLOTAUnloadObserveManager,
  veepooJLGetDialListManager, veepooJLSetToCurrentUseManager,
  veepooJLGetDialVersionInfoManager, veepooJLDeleteDialManager,
  veepooJLAddDialTransferStartManager,
} from '../../jieli_sdk/index'
```

**OTA 流程：**

```js
onLoad() {
  BleDataHandler.init()            // 接收杰理数据初始化
  veepooJLOTAInITManager()         // OTA 初始化
}
auth() { veepooJLAuthenticationManager(device) }          // 杰理认证
startOTA() {
  veepooJLStartOTAManager({ updateFileData: this.otaData }, e => {
    console.log('OTA 进度:', e.otaProgressText)
  })
}
onUnload() { veepooJLOTAUnloadObserveManager() }          // 销毁
```

| 方法                                  | 参数                          | 说明         |
| ------------------------------------- | ----------------------------- | ------------ |
| `veepooJLAuthenticationManager`       | `device`                      | 杰理设备认证 |
| `veepooJLStartOTAManager`             | `{updateFileData}` + callback | 开始 OTA     |
| `veepooJLGetDialListManager`          | callback                      | 获取表盘列表 |
| `veepooJLSetToCurrentUseManager`      | `file` + callback             | 设置当前表盘 |
| `veepooJLGetDialVersionInfoManager`   | `file` + callback             | 获取表盘版本 |
| `veepooJLDeleteDialManager`           | `file` + callback             | 删除表盘     |
| `veepooJLAddDialTransferStartManager` | `fileData` + callback         | 传输表盘文件 |

> OTA 升级成功后建议恢复出厂设置，避免数据混乱。完整流程请参考 SDKDemo。

---



### 9.26 Android编码功能(来电/短信/应用通知)

安卓手机不具备通话功能，此接口可忽略，ios可实现以下功能

#### 9.26.1 通讯录来电通知

**前提**

设备已连接，且支持通话功能

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '01',// 类型
  phone: '',// 手机号
  name: '',// 名称
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 9.26.2 未知来电通知

**前提**

设备已连接，且设备支持通话功能

未知来电是指在手机通讯录没有存储该手机号码，调用接口前需要查看一遍通讯录是否存储有该手机号，如果有存储，则需要将存储的名称一起带上

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '02',// 类型
  phone: ''// 手机号
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 9.26.3 通讯录短信通知

**前提**

设备已连接，且支持通话功能

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '03',// 类型
  phone: '',// 手机号
  message:'',// 消息内容
  name: ''// 名称
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 9.26.4 未知短信通知

**前提**

设备已连接，且支持通话功能

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '04',// 类型
  phone: '',// 手机号
  message: '',// 消息内容
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

------



#### 9.26.5 应用通知

**前提**

设备已连接，且支持通话功能

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  type: '05',// 类型
  apply: '',// 应用类型
  message: '',// 消息内容
}
veepooFeature.veepooSendAndroidCodeDataManager(data);
```

apply 应用类型

```js
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

---

### 9.27 表盘 / UI风格 

#### 9.27.1 自定义表盘（UI风格）

蓝牙设备已连接，且设备支持自定义表盘功能



##### 9.27.1.1 设置自定义背景表盘（切换自定义背景表盘）

**前提**

设备已连接

**接口**

```
veepooSendSwitchCustomBGUIDialManager
```

**参数**

| 参数      | 类型   | 备注                                           |
| --------- | ------ | ---------------------------------------------- |
| control   | number | 控制类型 1 设置  2 读取  3 读取                |
| style     | number | 风格                                           |
| styleType | number | 表盘类型 0  默认表盘  1 表盘市场  2 自定义表盘 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
    control: 1,//control   1 设置  2 读取  3 读取
    style: 0,//风格 根据获取列表
    styleType: 1//styleType 0  默认表盘  1 表盘市场  2 自定义表盘
}
veepooFeature.veepooSendSwitchCustomBGUIDialManager(data)
```

------



##### 9.27.1.2 设置自定义背景样式(type=46)

前提

设备已连接

接口

```typescript
veepooSendSetupCustomBackgroundDialDataManager
```

参数

| 参数               | 类型          | 备注           |
| ------------------ | ------------- | -------------- |
| timePosition       | string        | 时间位置       |
| timeTopPosition    | string        | 时间顶部位置   |
| timeButtomPosition | string        | 时间底部位置   |
| isDefaultBg        | string        | 是否为默认背景 |
| isDefaultBg        | Array<number> | 文字颜色       |

使用示例

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

回调

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
```



##### 9.27.1.3 读取表盘信息(type=46)

**前提**

设备已连接

接口

```
veepooSendReadCustomBackgroundDailManager
```

**参数**

| 参数 | 类型   | 备注                         |
| ---- | ------ | ---------------------------- |
| type | number | 1 表盘市场  2 自定义背景表盘 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
    type:2// 自定义背景表盘
}
veepooFeature.veepooSendReadCustomBackgroundDailManager(data)
```

回调

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

##### 9.27.1.4 读取表盘ui风格 (type=46)

**前提**

设备已连接

**接口**

```
veepooSendReadUIStyleDataManager
```

**参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadUIStyleDataManager()
```

**回调**

```js
{
   "name": "读取ui风格",
   "type": 46, 
    "content": {
        "setupStatus": true
    }
}
```

##### 9.27.1.4 获取屏幕信息

接口

```
veepooSendGetCustomDialInfoManage
```

**传入参数**

| 参数 | 类型   | 备注                         |
| ---- | ------ | ---------------------------- |
| type | number | 1 表盘市场  2 自定义背景表盘 |

**使用示例**

```typescript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'
let value = {
  type// 表盘类型
}
veepooFeature.veepooSendGetCustomDialInfoManager(value, function (e: any) {})
```

**回调**

```typescript
 {
     "resolution": [240, 296],// 表盘分辨率大小
     "border": [172, 207],// 缩略图边框大小
     "thumbnails": [152, 187]// 缩略图大小
 }
```



------

#### 9.27.2 获取网络表盘列表

注意：小程序正式版本需要配置域名才能正常获取网络列表

域名：

```typescript
https://www.vphband.com
```

**前提**

设备已连接

**接口**

```typescript
veepooGetNetworDialManager
```

**传入参数**

| 参数      | 类型   | 备注             |
| --------- | ------ | ---------------- |
| version   | string | 设备版本         |
| dialInfo  | object | 表盘信息         |
| pageIndex | number | 当前页数         |
| pageSize  | number | 当前页数内容长度 |

 根据接口veepooSendReadCustomBackgroundDailManager  （读取自定义表盘背景）获取表盘信息

**使用示例**

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

**回调**

```typescript
{
    pageIndex: 1, // 当前页数
    pageSize: 24, // 一页的内容总数
    pageCount: 7, // 总页数
    counts: 160, // 设备列表适配的总数
    results: Array(24),// 表盘列表内容
}
```



**网络表盘传输流程：**

表盘功能中有详细接口

获取表盘=>下载表盘=>获取表盘信息=>  传输    传输前：查看设备市场表盘是否含有（传输完成，可将标志位保存在本地），含有，先删除，删除完成，在进行表盘传输，详细流程在demo 网络表盘有相关代码。

------



### 9.28 ECG测量功能(type=41 / 42)

#### 9.28.1 开启测量(type=42)

// 注意：疾病信息属于付费内容，如需要，需先与我司商务协商，未付费默认0

**前提**

设备已连接，且设备支持ECG功能

**接口**

```js
veepooSendECGmeasureStartDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendECGmeasureStartDataManager();
```

**回调**

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



#### 9.28.2 关闭测量

**前提**

设备已连接，且设备正在测量中

**接口**

```
veepooSendECGmeasureStopDataManager
```

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendECGmeasureStopDataManager();
```

------



#### 9.28.3 读取PTT测量波形数据

**前提**

设备已连接，且设备支持ptt功能

使用场景：在设备端开启ptt功能，设备上报，当返回的额type等于2000，表示设备端开启了ptt公，应用层需要调用切换并读取ptt数据接口

**使用示例**

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



#### 9.28.4 读取设备ECG数据ID(type=41)

**前提**

设备已连接，设备支持ECG功能，在设备端中保存有ecg数据

**接口**

```js
veepooSendReadTestSeavDataIdDataManager
```

**参数**

| 参数   |        | 备注      |
| ------ | ------ | --------- |
| IdType | string | 固定 02值 |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  IdType: '02'// 读取手动的ecg数据id
}
veepooFeature.veepooSendReadTestSeavDataIdDataManager(data);
```

**回调**


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



#### 9.28.5 根据读取到的ECG ID获取数据(type=42)

 注意：疾病信息属于付费内容，如需要，需先与我司商务协商，未付费默认0

**前提**

设备已连接，且设备支持ECG功能

**接口**

```js
veepooSendReadIdTestSeavDataManager();
```

**传入参数**

| 参数   | 类型   | 备注            |
| ------ | ------ | --------------- |
| dataId | number | 设备保存的ECGID |

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
let data = {
  dataId
}
veepooFeature.veepooSendReadIdTestSeavDataManager(data);
```

**回调**

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



#### 9.28.6 获取ECG基本信息文本

**前提**

该设备已开启ECG全部功能

**接口**

```
veepooGetDiseaseTextManager
```

**参数**

| 参数          | 类型     | 备注          |
| ------------- | -------- | ------------- |
| heartRate     | number   | 心率          |
| diseaseResult | number[] | ecg 8个诊断值 |

**使用示例**

```typescript
import {veepooFeature } from './veepoo_sdk/index'
let data = veepooFeature.veepooGetDiseaseTextManager({
  heartRate: 77,
  diseaseResult: [0, 0, 0, 0, 0, 0, 0, 0]
});
console.log('ecg文本data==>', data);
```

**返回类型**

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



### 9.29 身体成分(type=32)

#### 9.29.1 身体成分检测(type=32)

身体成分功能依赖于ECG，与ECG测量姿态一致，在手表正常佩戴情况下，进行手动测量。测量指令开启测量和设备端离线测量。

离线测量指该次测量结果存储在手表端中，跟ecg的设备测量一样，获取保存数据的id，在跟进id获取数据

**前提**

设备已连接，且设备支持身体成分检测

接口

```js
veepooSendBodyCompositionTestStartDataManager
```

**参数**

无

**使用示例**

```js
import {veepooFeature } from '../../miniprogram_dist/index'

// 开启测试
veepooFeature.veepooSendBodyCompositionTestStartDataManager();
// 关闭测试
veepooFeature.veepooSendBodyCompositionTestStopDataManager();
```

**回调**


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

**主要指标参考范围：**

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



#### 9.29.2 获取身体成分数据ID(type=32)

需要设备端进行身体成分测量，应用层再通过该接口获取测量的数据ID

**前提**

蓝牙设备已连接，且设备支持身体成分功能

**接口**

```js
veepooSendReadBodyCompositionTestIdDataManager
```

**传入参数**

无

**使用示例**

```js
import { veepooFeature } from '../../miniprogram_dist/index'
veepooFeature.veepooSendReadBodyCompositionTestIdDataManager()
```

**回调**

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



#### 9.29.3 根据身体成分数据ID获取数据(type=32)

**前提**

设备已连接，且设备支持身体成分功能

**接口**

```js
veepooSendBodyCompositionIdReadDataManager()
```

**传入参数**

| 参数   | 类型   | 备注       |
| ------ | ------ | ---------- |
| dataId | string | 身体成分ID |

**使用示例**

```js
let data = {
  dataId: deviceIdList.dataId
}
veepooFeature.veepooSendBodyCompositionIdReadDataManager(data)
```

**回调**


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



### 9.30 同步手环时间(type=47)

**前提**

设备已连接

**接口**

```js
veepooSendSyncTimeManager
```

**传入参数**

| 参数   | 类型               | 备注                         |
| ------ | ------------------ | ---------------------------- |
| year   | String \|\| Number | 年                           |
| month  | String             | 月                           |
| day    | String             | 日                           |
| hour   | String             | 时                           |
| minute | String             | 分                           |
| second | String             | 秒                           |
| format | Number             | 时间制 1 12小时制 2 24小时制 |

**使用示例**

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

**回调**

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





### 9.31 读取手动测量数据(type=35)

前提

设备已连接，且设备支持相关手动测量功能，目前只具备气泵血压

接口

```js
veepooSendManualMeasurementDataReadManager
```

传入参数

| 参数      | 类型   | 备注        |
| --------- | ------ | ----------- |
| timestamp | Number | 时间戳 秒级 |
| dataType  | Number | 数据类型    |

timestamp  时间戳秒级  如获取今天的全部手动测量数据 需传入当天0点01秒的时间戳

dataType 数据类型  0 血压 1 心率 2 血糖 3 压力 4 血氧 5 体温 6 梅拖 7 hrv 8 血液成分 9 微体检 10 情绪 11 疲劳度 12 皮电

使用

```js
let data = {
      timestamp: 1755313815,
      dataType: 0
    }
veepooFeature.veepooSendManualMeasurementDataReadManager(data)
```

回调

```js
{
	"name": "手动测量读取", 
	"type": 35, 
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



### 9.32 微体检测量(type=53)

**前提**

设备已连接，且设备支持微体检测量  (功能类型第4包)

**接口**

```
veepooSendMicroCheckDataManager
```

传入参数

| 参数   | 类型   | 备注                 |
| ------ | ------ | -------------------- |
| switch | string | start 开启 stop 关闭 |

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// start 开启  stop 关闭
veepooFeature.veepooSendMicroCheckDataManager({ 
    switch: 'start' 
});
```

**回调**

```js
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
 	"type": 36,
    "content": [48703, 48610, 48542, 48426, 48116, 48125, 48139, 48047, 48012, 48185, 48718, 49417, 49726, 50051, 50409, 50424, 50425, 50538, 50463, 50285, 50208, 50166, 50100, 49981, 50005]
 }
```

### 9.33 B3 自动测量(type=54)

#### 9.33.1 自动测量功能读取(type=54)

**前提**

设备已连接，且设备支持B3自动测量功能(功能类型第4包)

**接口**

```
veepooSendReadB3AutoTestFeatureDataManager
```

**传入参数**

无

**使用示例**

```
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index'

// 读取自动测量功能
veepooFeature.veepooSendReadB3AutoTestFeatureDataManager();
```

**回调**

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



#### 9.33.2 自动测量功能设置(type=54)

**前提**

设备已连接，且设备支持B3自动测量功能(功能类型第4包)

**接口**

```
veepooSendReadB3AutoTestFeatureDataManager
```

**传入参数**

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

**使用示例**

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

**回调**

```js
{
 	"name": "自动测量功能", 
 	"type": 54, 
 	"control": 1, // 1 设置 2 读取
}
```

### 9.34 压力测量(type=58)

**前提**

设备已连接，且支持压力测量

**接口**

```
veepooFeature.veepooSendPressureTestManager();
```

**传入参数**

| 参数   | 类型    | 备注                              |
| ------ | ------- | --------------------------------- |
| switch | boolean | 开关 true 开启测量 false 关闭测量 |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

let data = {
    switch:true
};
veepooFeature.veepooSendPressureTestManager(data)
```

**回调**

```typescript
{
      name: "压力测量",
      type: 58,
      control: 1,// 0 不支持此功能 1 开启 2 关闭
      ack: 0,// 0 可用 1 设备正在测量压力 2 设备处于低电 3 设备正在测量其他数据 4 设备佩戴检测未通过
      progress: 100,// 进度 0-100
      content: {
        pressure: 23 // 压力值 
      }
}
```



### 9.35 HRV / 洛伦兹散点图(type=52)

**注意：**传入的参数通过**日常数据(type=5)**获取，**rr50**字段，需根据 “**功能类型**” 返回  HRV数据类型字段值，如果是全天，那么那么截取全天数据，非全天，截取7小时数据

#### 9.35.1 获取洛伦兹散点图数据(type=52)

**前提**

设备支持HRV，且已开启HRV付费功能

**接口**

```
veepooGetLorentzScatterPlotData
```

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

let HrvData = [];// 日常数据返回的rr50
let drawArr = veepooFeature.veepooGetLorentzScatterPlotData(HrvData);
```

**回调**

```js
// 开启HRV付费权限
{
    type: 52,
    name: "洛伦兹散点图",
    content: [] 
}

// 未开启HRV付费权限
{
    type: 52,
    message: "没有此功能"
}
```





#### 9.35.2 获取洛伦兹星级(type=52)

**前提**

设备支持HRV，且已开启HRV付费功能

**接口**

```
veepooGetLorentzScatterPlotStarIndex
```

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

let HrvData = [];// 日常数据返回的rr50
let starIndexs = veepooFeature.veepooGetLorentzScatterPlotStarIndex(HrvData);
```

**回调**

```js
// 开启HRV付费权限
{
    type: 52,
    name: "洛伦兹星级",
    content:[{
      type: 1, // 心率变化
      starIndex: starObj.secondIndex, // 星级
      code: value.second_line //文本代码
    },
    {
      type: 2, // 心率突变
      starIndex: starObj.threeIndex,
      code: value.third_line
    },
    {
      type: 3, // 神经状态
      starIndex: starObj.fourIndex,
      code: value.fouth_line
    },
    {
      type: 4, // 心律变化
      starIndex: starObj.fiveIndex,
      code: value.fifth_line
    },
  ];
}

// 未开启HRV付费权限
{
    type: 52,
    message: "没有此功能"
}
```



#### 9.35.3 获取洛伦兹相似度(type=52)

注意：该功能只在内部使用

**前提**

设备支持HRV，且已开启HRV付费功能

**接口**

```
VeepooGetLorentzScatterPlotSimilarity
```

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

let HrvData = [];// 日常数据返回的rr50
let similarity = veepooFeature.VeepooGetLorentzScatterPlotSimilarity(HrvData);
```

**回调**

```js
// 开启HRV付费权限
{
    type: 52,
    name: "洛伦兹相似度",
    content: {
      luoentz_index: [],
      luoentz_pro: []
    }
}

// 未开启HRV付费权限
{
    type: 52,
    message: "没有此功能"
}
```



#### 9.35.4 获取心脏健康指数(type=52)

**前提**

设备支持HRV，且已开启HRV付费功能

**接口**

```
VeepooGetHrvHeartHealthScore
```

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

let HrvData = [];// 日常数据返回的rr50
let score = veepooFeature.VeepooGetHrvHeartHealthScore(HrvData);
```

**回调**

```js
// 开启HRV付费权限
{
    type: 52,
    name: "HRV心脏健康指数",
    content: {
      code: 88,// 心脏健康值 0-100
     }
}

// 未开启HRV付费权限
{
    type: 52,
    message: "没有此功能"
}
```

------

### 9.36 运动控制(type=60)

#### 9.36.1 设置运动控制（开启/暂停/继续/停止）

**前提**

设备支持世界时钟功能，且在功能汇总第四包中的**DAMotionContrlType**字段的数据为1

**接口**

```
veepooSendSportControlDataManager
```

**参数**

| 字段      | 类型   | 必填 | 说明                                     |
| --------- | ------ | ---- | ---------------------------------------- |
| switch    | string | 是   | setup 表示设置 read 表示读取             |
| sportMode | number | 是   | 0 =app运动，其他值=设备运动模式编号      |
| opCode    | number | 是   | 操作码： 1 =开启 2 =暂停 3 =继续 4 =停止 |

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data ={
  switch: 'setup',
  sportMode: 0,    // 运动模式：0=app运动，其他=设备运动模式
  opCode: 1        // 操作码：1=开启 2=暂停 3=继续 4=停止
}
veepooFeature.veepooSendSportControlDataManager(data)
```

**回调**

```json
{
  "name": "运动控制",
  "model": "setup",
  "state": "success",
  "type": 60
}
```

#### 9.36.2 读取运动信息

**前提**

1.设备支持世界时钟功能，且在功能汇总第四包中的**DAMotionContrlType**字段的数据为1;
2.当小程序设置到运动控制成功后再调用此处的接口，且每**3秒**调用一次；

**参数**

| 字段      | 类型   | 必填 | 说明                                |
| --------- | ------ | ---- | ----------------------------------- |
| switch    | string | 是   | setup 表示设置 read 表示读取        |
| sportMode | number | 是   | 0 =app运动，其他值=设备运动模式编号 |

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data={
  switch: 'read',
  sportMode: 0
}
veepooFeature.veepooSendSportControlDataManager(data)
```

**回调**

```js
{
  "name": "运动控制",
  "model": "read",
  "state": "success",
  "Progress": 100,
  "type": 60,
  "content": {
    "sportModel": 1,
    "opCode": 2,
    "runState": "NotStarted",
    "deviceState": "Charging",
    "exerciseTimeStamp": 1,
    "exerciseDistance": 0,
    "heartRate": 0,
    "calories": 0,
    "pace": 0,
    "speed": 0
  }
}
```

> 1.设备主动上报时 Content 只包含 sportModel 、 opCode 、 heartRate；
> 2.关于具体数据的单位换算，可以参考给出的demo;

**content 字段说明**

| 字段              | 类型   | 说明                                                   |
| ----------------- | ------ | ------------------------------------------------------ |
| sportModel        | number | 运动模式： 0 =app运动，其他=设备运动模式               |
| opCode            | number | 操作码                                                 |
| runState          | string | 运动状态（见下表）                                     |
| deviceState       | string | 设备状态（见下表）                                     |
| exerciseTimeStamp | number | 运动时间戳（秒）                                       |
| exerciseDistance  | number | 运动距离（米）                                         |
| heartRate         | number | 心率（次/分、bpm）                                     |
| calories          | number | 卡路里（卡）                                           |
| pace              | number | 配速（秒）具体单位转换可以参考demo                     |
| speed             | number | 速度（米/小时）具体单位转换可以参考demo                |
| gnssInfo          | object | GNSS信息： { isGnssType: boolean, gnssSignal: string } |

**runState 枚举：**

| 字符串     | 说明       |
| ---------- | ---------- |
| NotStarted | 未开始运动 |
| Exercising | 运动中     |
| Paused     | 暂停中     |

**deviceState 枚举：**

| 字符串             | 说明                           |
| ------------------ | ------------------------------ |
| Normal             | 设备正常                       |
| LowBattery         | 设备低电                       |
| Charging           | 设备充电中                     |
| MaxDurationReached | 设备单次运动时长已达到最大限制 |
| BatteryCritical    | 电量小于等于10%                |

**gnssSignal枚举：**

| 字符串       | 说明   |
| ------------ | ------ |
| NoSignal     | 无信号 |
| SignalWeak   | 弱     |
| SignalNormal | 一般   |
| SignalGood   | 良好   |
| SignalStrong | 强     |

------



### 9.37 世界时钟(type=61)

#### 9.37.1 添加世界时钟

**前提**

设备支持世界时钟功能，且在功能汇总第四包中的**worldClockType**字段的数据为1

**接口**

```js
veepooSendAddWorldClockDataManager
```

**参数**

| 字段     | 类型   | 说明                         |
| -------- | ------ | ---------------------------- |
| id       | number | 时钟id编号                   |
| timeZone | number | 相较 UTC（GMT） 的偏移分钟数 |
| city     | string | 城市名称                     |

**时区参数说明：**

SDK 中 timezone 字段表示 相较格林尼治时间（UTC，本初子午线）的偏移分钟数 ，规则如下：

| 城市   | 时区            | 偏移量（分钟） | 传入值 |
| ------ | --------------- | -------------- | ------ |
| 北京   | 东八区（+8:00） | 8 × 60 = 480   | 480    |
| 东京   | 东九区（+9:00） | 9 × 60 = 540   | 540    |
| 伦敦   | UTC±0（+0:00）  | 0              | 0      |
| 纽约   | 西五区（-5:00） | -5 × 60 = -300 | -300   |
| 洛杉矶 | 西八区（-8:00） | -8 × 60 = -480 | -480   |

> 偏移量必须是 15 的倍数。正为东、负为西，SDK 内部会自动换算为协议所需的编码格式。

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data = {
    id: 1, // 世界时钟id
    timezone: 480, // 时区的值 详情请查看 上述 timezone 时区参数说明 
    city: '北京'
};
veepooFeature.veepooSendAddWorldClockDataManager(data);
```

**回调**

```js
{
    "name": "添加世界时钟", 
    "type": 61, 
    "state": "success", // success 成功 failure 失败
    "CRC": 3849, 
}
```

------



#### 9.37.2 读取世界时钟

**前提**

设备支持世界时钟功能，且在功能汇总第四包中的**worldClockType**字段的数据为1

**接口**

```js
veepooSendReadWorldClockDataManager
```

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data = { 
    CRC: 0 // 上次读取设备返回的 CRC，传 0 表示强制全量读取 
};
veepooFeature.veepooSendReadWorldClockDataManager(data);
```

**回调**

```js
 {
     "name": "读取世界时钟",
      "type": 61,
      "state": "success",// success 成功 failure 失败
      "Progress": 100,
      "content": [
          {"id": 1, "timeZone": 32, "city": "北京"}, 
          {"id": 2, "timeZone": 16, "city": "迪拜"}
      ]
 }
```

------



#### 9.37.3 调整时钟顺序

**前提**

设备支持世界时钟功能，且在功能汇总第四包中的**worldClockType**字段的数据为1

**接口**

```js
veepooSendAdujstWorldClockDataManager
```

**参数**

| 字段   | 类型   | 必填 | 说明                     |
| ------ | ------ | ---- | ------------------------ |
| fromId | number | 是   | 被移动时钟的当前位置编号 |
| toId   | number | 是   | 目标位置编号             |

> 此处的ID是指当前时钟所在的位置(content链表上的位置)，链表排序id从1开始。

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data = {
    fromId: 1,
    toId: 2
};
veepooFeature.veepooSendAdujstWorldClockDataManager(data);
```

**回调**

```js
 {
     "name": "调整时钟顺序",
     "type": 61, 
     "state": "success",// success 成功 failure 失败
     "CRC": 2060,
 }
```

------



#### 9.37.4 删除世界时钟

**前提**

设备支持世界时钟功能，且在功能汇总第四包中的**worldClockType**字段的数据为1

**接口**

```js
veepooSendDeleteWorldClockDataManager
```

**参数**

| 字段         | 类型   | 必填 | 说明                 |
| ------------ | ------ | ---- | -------------------- |
| worldClockId | number | 是   | 要删除的时钟的id编号 |

**使用示例**

```js
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data = {
    worldClockId: 1,
};
veepooFeature.veepooSendDeleteWorldClockDataManager(data);
```

**回调**

```js
{
    "name": "删除世界时钟",
    "type": 61,
    "worldClockId": 1, 
    "state": "success",// success 成功 failure 失败
    "CRC": 2060,
}
```

------



### 10. type 回调对照总表（权威）

全局监听 `veepooWeiXinSDKNotifyMonitorValueChange` 中按 `res.type` 路由。下表为完整对照：

| type | 功能                           | 来源接口                                                 |
| :--: | ------------------------------ | -------------------------------------------------------- |
|  1   | 密钥认证                       | `veepooBlePasswordCheckManager`                          |
|  2   | 读取电池电量                   | `veepooReadElectricQuantityManager`                      |
|  3   | 同步个人信息                   | `veepooSynchronizingPersonalInformationManager`          |
|  4   | 读取精准睡眠数据               | `veepooSendReadPreciseSleepManager`                      |
|  5   | 读取日常数据                   | `veepooSendReadDailyDataManager`                         |
|  6   | 手动体温测量                   | `veepooSendTemperatureMeasurementSwitchManager`          |
|  7   | 体温数据自动检测读取           | `veepooReadAutoTemperatureMeasurementDataManager`        |
|  8   | 读取计步数                     | `veepooReadStepNumberManager`                            |
|  9   | 读取实时计步数，卡路里，距离   | `veepooReadStepCalorieDistanceManager`                   |
|  10  | 天气（读/设/同步）             | `veepooSendReadWeatherForecastDataManager` 等            |
|  11  | 公英制/单位/开关               | `veepooSendReadDeviceUnitSettingDataManager` 等          |
|  12  | 联系人 / SOS                   | `veepooSendReadContactPersonDataManager` 等              |
|  13  | 文字闹钟功能                   | `veepooSendReadAlarmClockDataManager` 等                 |
|  14  | 读取运动模式校验值             | `veepooSendAppStartMovementPatternD3DataManager`         |
|  15  | 开启或关闭运动模式             | `veepooSendAppStartMovementPatternD5DataManager`         |
|  16  | 读取运动模式数据               | `veepooSendReadMovementPatternD4DataManager`             |
|  17  | 手机查找手环                   | `veepooSendPhoneLookBraceletDataManager`                 |
|  18  | 血压                           | `veepooSendReadUniversalBloodPressureDataManager` 等     |
|  19  | 屏幕亮度时长                   | `veepooSendLightUpTimeDataManager`                       |
|  20  | 心率报警                       | `veepooSendHeartRateAlarmIntervalDataManager`            |
|  21  | 血液成分                       | `veepooSendBloodComponentDataManager` 等                 |
|  22  | 血糖                           | `veepooSendBloodGlucoseMeasurementDataManager` 等        |
|  23  | 久坐提醒                       | `veepooSendSetupSedentaryToastTimeDataManager`           |
|  24  | 拍照                           | `veepooSendTakeAPictureDataManager`                      |
|  25  | 抬手亮屏                       | `veepooSendTurnWristBrightScreenDataManger`              |
|  26  | 健康功能提醒                   | `veepooSendHealthToastFeatureDataManager`                |
|  28  | 血压私人定制设置               | `veepooSendBloodPressurePrivateDataManager`              |
|  29  | 血氧自动监测                   | `veepooSendBloodOxygenAutoTestDataManager`               |
|  31  | 血氧手动测量                   | `veepooSendBloodOxygenControlDataManager`                |
|  32  | 身体成分                       | `veepooSendFemaleInstructionsDataManager` / 身体成分系列 |
|  33  | 女性经期                       | `veepooSendFemaleInstructionsDataManager`                |
|  34  | 语言设置                       | `veepooSendLanguageSetupManager`                         |
|  35  | 读取手动测量数据               | `veepooSendManualMeasurementDataReadManager`             |
|  41  | ECG 数据 ID                    | `veepooSendReadTestSeavDataIdDataManager`                |
|  42  | ECG 测量（进度/波形/结束）     | `veepooSendECGmeasureStartDataManager` 等                |
|  45  | Android 编码（来电/短信/通知） | `veepooSendAndroidCodeDataManager`                       |
|  46  | UI 风格 / 表盘信息             | `veepooSendSetupCustomBackgroundDialDataManager` 等      |
|  47  | 同步手环时间                   | `veepooSendSyncTimeManager`                              |
|  50  | 产品信息                       | `veepooSendGetProductInfoManager`                        |
|  51  | 心率测量                       | `veepooSendHeartRateTestSwitchManager`                   |
|  52  | HRV / 洛伦兹                   | HRV 系列同步函数                                         |
|  53  | 微体检                         | `veepooSendMicroCheckDataManager`                        |
|  54  | B3 自动测量                    | `veepooSendReadB3AutoTestFeatureDataManager`             |
|  55  | 手动测量                       | `veepooSendManualMeasurementDataReadManager`             |
|  58  | 压力测量                       | `veepooSendPressureTestManager`                          |
|  60  | 运动控制                       | ` veepooSendSportControlDataManager`                     |
|  61  | 世界时钟                       | ` veepooSendAddWorldClockDataManager` 等                 |
|  90  | 恢复出厂设置                   | `veepooSendResettingTheDeviceDataManager`                |
| 2000 | PTT 测量开关                   | 设备主动上报                                             |



### 附录A：定制项目接口

#### A.1 JH58定制项目动态血压相关接口(type=55)



##### A.1.1 读取测量模式开关状态(type=55)

**前提**

设备已连接，且设备数据JH58定制项目

**接口**

```
veepooReadTestModeSwitchStateDataManager
```

**传入参数**

无

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

veepooFeature.veepooReadTestModeSwitchStateDataManager();
```

**回调**

```javascript
{
    name: "PPG测量模式开关状态",
    type: 55,
    control: 1,//  1  读取开关状态  2 设置开关状态
    content: {
      state: 2,// 1 全关  2 开启模式1  3 开启模式2
   }
 }

```



##### A.1.2 设置测量模式开关状态(type=55)

**前提**

设备已连接，且设备数据JH58定制项目

**接口**

```
veepooSetupTestModeOneSwitchStateDataManager
```

**传入参数**

| 参数  | 类型   | 备注                              |
| ----- | ------ | --------------------------------- |
| state | number | 1 全关  2 开启模式1  2  开启模式2 |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
    let data = {
      state: 2,
    }
veepooFeature.veepooSetupTestModeOneSwitchStateDataManager(data);
```

**回调**

```javascript
{
    name: "PPG测量模式开关状态",
    type: 54,
    control: 1,//  1  读取开关状态  2 设置开关状态
    content: {
      state: 2,// 1 全关  2 开启模式1  3 开启模式2
   }
 }

```



##### A.1.3 读取PPG原始数据(type=55)

**前提**

设备已连接，且设备数据JH58定制项目

**接口**

```
veepooReadTestModeOrigDataManager
```

**传入参数**

| 参数      | 类型   | 备注                                               |
| --------- | ------ | -------------------------------------------------- |
| mode      | number | 1 读取开启模式1  2  读取开启模式2                  |
| timeStamp | number | 时间戳，设备将按照该时间戳，上报该时间戳往后的数据 |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
    let data = {
      mode: 1,
      timeStamp: timestampInSeconds
    }
veepooFeature.veepooReadTestModeOrigDataManager(data);
```

**回调**

```javascript
{
    name: "PPG读取原始数据",
    type: 55,
    control: 2,//  2 读取
    mode: 1, // 1 模式1   2 模式2
    progress: 100, // 实现进度
    content:[
        {
            array:[
                {
                    acceleration：{
                    	x:[],// x轴
            			y:[],// y轴
            			z:[],// z轴
                 	}，// 加速度
               		ppgData:[],// 每秒的ppg原始数据
                }
            ],// 当前组的数据   模式1 一天最多96组，15分钟一组
            crc:38386,// crc 
            timeStamp:1765814400,// 当前数据时间
        }
    ]
}

```

##### A.1.4 实时测量PPG数据(type=55)

**前提**

设备已连接，且设备数据JH58定制项目

**接口**

```
veepooJH58RealTimeMeasureManager
```

**参数**

| 参数  | 类型   | 备注                                                    |
| ----- | ------ | ------------------------------------------------------- |
| state | number | 1 开启测量且实时传输   2  开启测量且断点传输  3关闭测量 |

补充：

state=2时，适用与蓝牙断连重连后，设备推送本次测量断联前5分钟数据后再衔接实时上报

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
    let data = {
      state: 1,// 1 开启测量且实时传输   2  开启测量且断点传输  3关闭测量
    }
veepooFeature.veepooJH58RealTimeMeasureManager(data);
```

**回调**

设置开关后的回调

```js
{
    name: "PPG实时测量开关控制",
    type: 55,
    control: 1,//  1开关控制模式 2 读取数据模式
    mode: 1, // 1 开启测量   2 开启断点传输  3关闭测量
    content:{
        state:'成功' //开关设置状态说明：1.成功 2.设备正在手动测量，设备正忙 3.设备处于低电状态
    }
}
```

读取数据回调

```javascript
{
    name: "PPG实时测量",
    type: 55,
    control: 2,// 1开关控制模式 2 读取数据模式
    mode: 3, // 3模式3
    content:{
        data:{
            acceleration：{
                x:[],// x轴
                y:[],// y轴
            	z:[],// z轴
            }，// 加速度
            ppgData:[],// 每秒的ppg原始数据
        }，
        crc:38386,// crc
        timeStamp:1765814400,// 当前数据时间戳
    }
}

```



#### A.2 ZT163常灭屏功能(type=56)

**前提**

设备已连接，且支持常灭屏功能

**接口**

```
veepooSetupZT163ScreenKillFunctionManager
```

**参数**

| 参数    | 类型   | 备注                                      |
| ------- | ------ | ----------------------------------------- |
| control | number | 1 开启常灭屏  2 关闭常灭屏   3 读取常灭屏 |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
let data = {
     control: 1,
   }
veepooFeature.veepooSetupZT163ScreenKillFunctionManager(data);
```

**回调**

```javascript
{
    name: "设备常灭屏",
    type: 56,
    control: 1,//  1 开启  2 关闭  3 读取
    content: {
      state: 1,//  control = 1 || control = 2 时，state = 1 设置成功 state = 2 设置失败     control = 3 时，state = 1 无此功能 state = 1 当前为亮屏状态 2 当前为灭屏状态
   }
 }

```



#### A.3 4G设备(type=57)

##### A.3.1 读取4G设备Service信息(type=57)

**前提**

设备已连接，且支持4G

**接口**

```
veepooRead4GServiceDataManager
```

**参数**

无

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

veepooFeature.veepooRead4GServiceDataManager();
```

**使用示例**

```javascript
{
    name: "4G服务信息",
    type: 57, 
    control: 2, // 1 设置 2 读取 3 信息核准成功 4 设备端变更主动上报 5 设备繁忙
    ack:1,//  0 失败 1 成功
    content: {
        ipAddress: "vphband.com", // IP地址
        port: 34421, // 端口
        userName: "13219170059",// 用户名 
        password: "PdbGqvN2BhOpYDtiCxiLNA==",// 密码 
        lastTimeStamp: 1767172170, // APP或设备最后一次同步服务器的时间戳，秒级
        switch: 0, // 4G开关 0 关闭 1 开启
        dataUploadSwitch: 0, // 数据上传开关 0 关闭 1 开启  4G开关为关，此字段应无效
        uploadInterval: 10, // 4G上报服务器的时间间隔，分钟级别
        restoreTimeStamp: 1767606251, // 设备最后一次恢复时间戳，作用是APP或服务器触发从0开始读取
        accountStatus: 1, // 0为无效，1为有效
    }
}
```



##### A.3.2 设置4G设备Service信息(type=57)

**前提**

设备已连接，且支持4G

**接口**

```
veepooFeature.veepooSetup4GServiceInfoManager();
```

**参数**

| 参数             | 类型   | 备注                        |
| ---------------- | ------ | --------------------------- |
| ipAddress        | string | IP地址                      |
| port             | number | 端口                        |
| userName         | string | 用户名                      |
| password         | string | 密码                        |
| switch           | number | 4G开关 0 关闭 1 开启        |
| dataUploadSwitch | number | 数据上传开关 0 关闭 1 开启  |
| uploadInterval   | number | 4G上传服务器间隔 分钟级别   |
| accountStatus    | number | 账号是否有效  0 无效 1 有效 |

所有参数可选，最低选择1个参数，最多全部参数，只能传输特定参数类型

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

// 参数可选，多参数
veepooFeature.veepooSetup4GServiceInfoManager({
  ipAddress: "vphband.com", // ip地址
  port: 34421, // 端口 
  userName: "13219170059", // 用户名
  password: "PdbGqvN2BhOpYDtiCxiLNA==", // 密码
});

// 参数可选，单参数
veepooFeature.veepooSetup4GServiceInfoManager({
    switch: 1, // 开关  0 关闭 1 开启
});
```

**回调**

```
{
    name: "4G服务信息",
    type: 57, 
    control: 1, // 1 设置 2 读取 3 信息核准成功 4 设备端变更主动上报 5 设备繁忙
    ack:1,//  0 失败 1 成功
}
```





#### A.4 YM28PRO项目相关接口(type=59)

##### A.4.1 读取设备当前数据情况(type=59)

**前提**

设备已连接，且设备支持YM28PRO项目

**接口**

```
veepooSetupSendYM28PROCommandManager
```

**参数**

| 参数   | 类型   | 备注                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| switch | String | 操作类型 read 读取当前设备数据 setup 下发数据  readSN 读取SN码 |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

    let data = {
      switch: 'read',
    }
veepooFeature.veepooSetupSendYM28PROCommandManager(data);
```

**回调**

```javascript
{
    name: "设置数据读取及下发",
    type: 58,
    control: 1,//  1 读取当前设备数据模式  2 下发数据模式 3 读取SN码模式 
    content: {
      authorizationStartTimestamp: 1780737576, //授权开始的时间戳
      bloodPressureSwitch: 0, // 血压开关：0: 开启 / 1: 关闭 
      dayTimeGap: 30 , // 白天间隔数（单位：分钟）：15/20/30/60
      nightTimeGap: 60, // 夜间间隔数（单位：分钟）：15/20/30/60
      gapMinValue: 10, //间隔范围最小值(单位：分钟)
      gapMaxValue: 180, //间隔范围最大值(单位：分钟)
      stepCount: 5, //步进数
      nightRangeEndTime: "23:30", // 夜间范围结束时间
      nightRangeStartTime: "17:00",// 夜间范围开始时间
   }
 }

```



##### A.4.2 下发数据(type=59)

**前提**

设备已连接，且设备支持YM28PRO项目

**接口**

```
veepooSetupSendYM28PROCommandManager
```

**参数**

| 参数                | 类型   | 备注                                                         |
| ------------------- | ------ | ------------------------------------------------------------ |
| switch              | string | 操作类型 read 读取当前设备数据 setup 下发数据  readSN 读取SN码 |
| bloodPressureSwitch | String | 血压开关：open 开启 close 关闭                               |
| dayTimeGap          | number | 白天间隔数（单位：分钟）：15/20/30/60                        |
| nightTimeGap        | number | 夜间间隔数（单位：分钟）：15/20/30/60                        |
| nightRangeStartTime | String | 夜间范围开始时间   "小时:分钟"                               |
| nightRangeEndTime   | String | 夜间范围结束时间   "小时:分钟"                               |

**使用示例**

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';
    let data = {
      switch: 'setup',
      content: {
        bloodPressureSwitch: 'close', // 血压开关：open 开启 close 关闭
        dayTimeGap: 30 , // 白天间隔数（单位：分钟）：15/20/30/60
        nightTimeGap: 60, // 夜间间隔数（单位：分钟）：15/20/30/60
        nightRangeEndTime: "23:30", // 夜间范围结束时间
        nightRangeStartTime: "17:00",// 夜间范围开始时间
      }
    }
veepooFeature.veepooSetupSendYM28PROCommandManager(data);
```

**回调**

```javascript
{
    name: "设置数据读取及下发",
    type: 58,
    control: 2,//  1 读取当前设备数据模式  2 下发数据模式 3 读取SN码模式 
    content: {
      authorizationStartTimestamp: 1780737576, //授权开始的时间戳
      bloodPressureSwitch: 0, // 血压开关：0 开启 / 1 关闭 
      dayTimeGap: 30 , // 白天间隔数（单位：分钟）：15/20/30/60
      nightTimeGap: 60, // 夜间间隔数（单位：分钟）：15/20/30/60
      nightRangeEndTime: "23:30", // 夜间范围结束时间
      nightRangeStartTime: "17:00",// 夜间范围开始时间
   }
 }
```



##### A.4.3 读取SN码(type=59)

前提

设备已连接，且设备支持YM28PRO项目

接口

```
veepooSetupSendYM28PROCommandManager
```

参数

| 参数   | 类型   | 备注                                                         |
| ------ | ------ | ------------------------------------------------------------ |
| switch | String | 操作类型    read 读取当前设备数据   setup 下发数据  readSN 读取SN码 |

使用示例

```javascript
import { veepooBle, veepooFeature } from '../../miniprogram_dist/index';

    let data = {
      switch: 'readSN',
    }
veepooFeature.veepooSetupSendYM28PROCommandManager(data);
```

回调

```javascript
{
    name: "设置数据读取及下发",
    type: 58,
    control: 3,//操作类型:  1 读取当前设备数据模式 / 2 下发数据模式 / 3 读取SN码模式 
    SNCode："BP3456789012",// 设备SN码
 }

```

### 附录B：接口命名与拼写注意事项

SDK 中部分接口名存在**既定的不规整拼写**，导出名已固定，**请原样复制使用，勿自行"修正"**，否则会报 `undefined is not a function`：

| 接口名                                            | 拼写注意                       |
| ------------------------------------------------- | ------------------------------ |
| `veepooWeiXinSDKloseBluetoothAdapterManager`      | `lose`（少 C，应为 Close）     |
| `veepooSendTurnWristBrightScreenDataManger`       | `Manger`（少 a，应为 Manager） |
| `veepooSendReadCustomBackgroundDailManager`       | `Dail`（应为 Dial）            |
| `VeepooGetLorentzScatterPlotSimilarity`           | 首字母大写 `V`                 |
| `VeepooGetHrvHeartHealthScore`                    | 首字母大写 `V`                 |
| `veepooReadAutoTemperatureMeasurementDataManager` | 注意带 `Manager` 后缀          |
| `veepooSendSettingWeatherForecastInfoManager`     | 注意带 `Manager` 后缀          |

#### 底层封装接口完整列表（一般无需直接调用）

下列接口已被"一站式"接口封装集成，仅在自行组装蓝牙流程时使用：

```
veepooWeiXinSDKGetSettingManager              // 获取手机设置
veepooWeiXinSDKOpenBluetoothAdapterManager    // 初始化蓝牙适配器
veepooWeiXinSDKStartBluetoothDevicesDiscoveryManager  // 开始搜索
veepooWeiXinSDKBluetoothDeviceFoundManager    // 搜索结果监听（逐个）
veepooWeiXinSDKGetBluetoothDevicesManager     // 一次性获取已搜索设备（返回 Promise）
veepooWeiXinSDKBlueConnectionManager          // 连接蓝牙
veepooWeiXinSDKGetDeviceServicesManager       // 获取服务
veepooWeiXinSDKGetDeviceCharacteristicsManager // 获取特征值
veepooWeiXinSDKOpenNotifyManager              // 订阅特征值
veepooWeiXinSDKWriteBLECharacteristicValueManager           // 写入数据
veepooWeiXinSDKWriteBLECharacteristicValueLengthManager     // 写入（不限长）
veepooWeiXinSDKWriteDeviceDialBLECharacteristicValueManager // 写入表盘服务
veepooWeiXinSDKBLECharacteristicValueChangeManager          // 通用数据监听
veepooWeiXinSDKNotifyECGValueChange                         // ECG 特征监听
veepooWeiXinSDKNotifyADCValueChange                         // ADC 特征监听
veepooWeiXinSDKUpdateECGServiceManager                      // 切到 ECG 服务
veepooWeiXinSDKUpdateDeviceDialServiceManager               // 切到表盘服务
```

#### 状态与多订阅 API（调试/重连场景）

| 接口                                                         | 作用                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `getBleState()`                                              | 获取当前蓝牙状态快照（bleDate/connected/deviceId/passwordVerify） |
| `onBleStateChange(cb)`                                       | 订阅蓝牙状态变化，返回取消订阅函数                           |
| `addBleNotificationListener(characteristicId, cb)`           | 多监听器注册，返回 listenerId                                |
| `removeBleNotificationListener(listenerId)`                  | 移除监听器                                                   |
| `addConnectionStateListener(cb)` / `removeConnectionStateListener(cb)` | 连接状态多订阅                                               |

### 附录C：版本与更新记录

| 版本 | 日期       | 说明                                                         |
| ---- | ---------- | ------------------------------------------------------------ |
| v2   | 2026-08-18 | 文档重构：新增数据接收模型、Quick Start、init、type 总表、错误枚举总表；修复接口名示例错误；定制项目移入附录；修复type值重复问题 |
| v1   | —          | 初版                                                         |

