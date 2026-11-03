# WeChat_Mini_Program_Ble_SDK

微信小程序蓝牙 SDK

## 1. 概述

小程序 SDK 由深圳维亿魄科技有限公司（以下简称"本公司"）开发，专门为本公司智能穿戴类产品提供微信小程序蓝牙控制开发平台，覆盖设备扫描、连接、健康数据读取与设备控制等能力。

> 本仓库为公版 SDK，使用范围限于本公司智能穿戴产品；设备兼容性确认及定制需求，请联系本公司商务对接。
>

### 1.1 运行环境

| 类别       | 范围                                        | 备注                 |
| ---------- | ------------------------------------------- | -------------------- |
| 微信客户端 | Android，iOS，HarmonyOS 4.0，HarmonyOS Next | 支持 BLE 功能        |
| 开发平台   | 微信开发者工具                              | 建议使用最新版本开发 |

注意：SDK 基于小程序原生开发，支持在原生 + TypeScript 项目中使用。由于 mpvue、uni-app、Taro 等框架会对代码进行二次编译与运行时改写，可能破坏 SDK 原有的模块结构与执行上下文，因此不推荐在此类框架中接入 SDK。SDK 仅支持真机调试，微信开发者工具模拟器不支持蓝牙。

### 1.2 能力边界

| 模块                  | 职责                                                     |
| --------------------- | -------------------------------------------------------- |
| `libs/vp_sdk`         | 核心 SDK：扫描、连接、订阅监听、协议解析、健康数据与设备控制 |
| `libs/jieli_sdk`      | 杰理（Jieli）能力：OTA 升级、表盘传输等                   |

表盘传输、OTA 等功能目前只支持杰里类型设备，其他设备暂不支持。

### 1.3 接入前提

- 手机系统蓝牙已开启；
- Android 扫描设备需开启系统定位服务，并授予微信蓝牙/位置权限。

> **重要提示：** 小程序正式版如需使用「网络表盘」或 SDK 中的付费功能，必须在微信公众平台后台配置域名 `https://www.vphband.com`，否则相关功能不可用。

## 2. 快速开始

### 2.1 引入 SDK

将 `libs/vp_sdk` 下的 `index.js`、`index.d.ts` 放入小程序项目（demo 中对应 `code/demo/WeiXinSDKTSDemo/miniprogram/miniprogram_dist/`），然后引入：

```js
import { veepooBle, veepooFeature, veepooLogger } from './miniprogram_dist/index'
```

> 引入路径按 SDK 文件在项目中的实际位置调整。

### 2.2 最小接入流程

标准顺序为：**扫描设备 >> 连接设备 >> 注册全局监听 >> 密钥认证 >> 调用功能接口**。下面是从扫描到读取电量的最小示例(具体实现请参考demo)：

```js
import { veepooBle, veepooFeature } from './miniprogram_dist/index'

Page({
  onUnload() {
    // 离开页面时停止扫描，释放资源
    veepooBle.veepooWeiXinSDKStopSearchBleManager(() => {})
  },

  start() {
    // 1. 注册全局监听（必须在认证前注册）
    veepooBle.veepooWeiXinSDKNotifyMonitorValueChange(res => {
      switch (res.type) {
        case 1: // 密钥认证结果
          if (res.content?.VPDevicepassword === 'successfulVerification') {
            this.readBattery() // 认证通过后再调用功能接口
          }
          break
        case 2: // 电池电量
          console.log('电量:', res.content)
          break
      }
    })

    // 2. 扫描设备（每发现一个设备回调一次）
    veepooBle.veepooWeiXinSDKStartScanDeviceAndReceiveScanningDevice(res => {
      console.log('扫描到设备:', res)
      // 选中目标设备后调用 connect(res.deviceId)
    })
  },

  // 3. 连接设备（deviceId 为扫描到的设备标识）
  connect(deviceId) {
    veepooBle.veepooWeiXinSDKStopSearchBleManager(() => {})
    veepooBle.veepooWeiXinSDKBleConnectionServicesCharacteristicsNotifyManager({ deviceId }, () => {
      // 4. 连接成功后进行密钥认证
      veepooFeature.veepooBlePasswordCheckManager()
    })
  },

  // 5. 认证通过后读取电量，结果仍从全局监听 type=2 返回
  readBattery() {
    veepooFeature.veepooReadElectricQuantityManager()
  },
})
```

### 2.3 关键说明

- 功能接口采用「发指令 + 全局监听」模式：接口调用本身不返回业务数据，结果统一从 `veepooWeiXinSDKNotifyMonitorValueChange` 回调，通过 `res.type` 区分功能。
- 全局监听必须在密钥认证前注册，且认证通过后才能调用数据类、控制类功能接口。
- 默认流程无需调用 `init`；仅在自定义蓝牙传输或复用已有连接时需要，详见使用文档第 6 节。
- 使用 OTA、表盘传输时，还需按使用文档 9.25 节引入 `libs/jieli_sdk`。

完整初始化、接口参数与回调结构，请阅读 **[VeepooWeiXinSDK使用文档](docs/VeepooWeiXinSDK使用文档.md)**。其中第 3 节「数据接收模型」为对接必读。

## 3. 功能概览

| 分类         | 主要能力                                                                                             | 参考章节              |
| ------------ | ---------------------------------------------------------------------------------------------------- | --------------------- |
| 设备连接     | 扫描、连接、重连、断开、连接状态监听、获取已连接设备                                                 | 文档第 7 章           |
| 基础信息     | 密钥认证、电池电量、个人信息同步、时间同步、单位/语言设置                                            | 9.1 ~ 9.3、9.9、9.22 ~ 9.23、9.30 |
| 健康数据     | 精准睡眠、日常数据、体温、计步、心率、血氧、血压、血糖、血液成分、身体成分、ECG、HRV/洛伦兹、压力、微体检、手动测量、B3 自动测量、女性经期 | 9.4 ~ 9.7、9.15 ~ 9.18、9.20 ~ 9.21、9.28 ~ 9.35 |
| 提醒与通知   | 天气、联系人/SOS、文字闹钟、消息推送（ANCS/Android 编码）、久坐/健康提醒、拍照、抬手亮屏、屏幕亮度 | 9.8、9.10 ~ 9.12、9.19、9.26 |
| 运动         | 运动模式、运动数据、运动控制、世界时钟                                                               | 9.13、9.36、9.37      |
| 表盘与 OTA   | 自定义/网络表盘、UI 风格、杰理 OTA 与表盘传输（仅杰理设备）                                          | 9.25、9.27            |
| 定制项目     | JH58、ZT163、YM28PRO、4G 服务等                                                                       | 文档附录 A            |
| 日志         | 控制 SDK 内部日志输出，便于调试                                                                      | 文档第 8 章           |

各功能的调用方式、参数与返回结构见使用文档对应章节，demo 中也提供了主要功能的示例页面。

## 4. Demo

使用微信开发者工具导入 `code/demo/WeiXinSDKTSDemo`，填入 AppID 后使用真机预览调试。主要功能均提供示例页面，开发具体功能前建议先参考 demo。

## 5. 目录结构

```
├── code
│   └── demo
│       └── WeiXinSDKTSDemo        # 演示小程序
│           └── miniprogram
│               └── miniprogram_dist  # 可直接运行的 SDK 产物
├── docs
│   ├── txt                        # hrv、睡眠、相似度文本
│   │   ├── hrv_font_tips.js
│   │   ├── similarity_tips.js
│   │   └── sleep_text.txt
│   ├── VeepooWeiXinSDK使用文档.md
│   └── 照片表盘传输简易流程图.pdf
├── libs                           # 核心库
│   ├── jieli_sdk                  # 杰理 OTA/表盘 TS 源码
│   └── vp_sdk                     # SDK （index.js）
├── LICENSE                        # Apache-2.0
└── README.md
```

## 6. 常见问题

| 问题                         | 排查方向                                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| 搜不到设备                   | 确认使用真机、蓝牙已开启；Android 需开启系统定位并授予微信位置权限      |
| 密钥认证不通过               | 确认全局监听在认证前注册，且设备已成功连接                               |
| 调用接口后没有数据           | 功能结果从全局监听 `res.type` 返回，不是接口返回值                       |
| 网络表盘或付费功能不可用     | 正式版需配置域名 `https://www.vphband.com`                               |
| OTA、表盘传输不可用          | 该能力仅支持杰理类型设备，且需引入 `libs/jieli_sdk`                      |
| 页面退出后仍占用蓝牙资源     | 离开页面时调用 `veepooWeiXinSDKStopSearchBleManager`，必要时断开连接     |

## 7. 当前版本

| 项目                      | 版本         | 发布日期   |
| ------------------------- | ------------ | ---------- |
| WeiXin_SDK                | **V1.1.27** | 2026/11/3 |
| VeepooWeiXinSDK 使用文档   | **V2.0.6**   | 2026/11/3 |

## 8. 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证开源。
