// pages/function_test/dial_operate/dial_add_background/index.ts

import { bmpConvert } from "../../../../jieli_sdk/jl_lib/jl_bmpConvert_1.0.0";
import { veepooFeature } from '../../../../miniprogram_dist/index'

var lastTouchPoint = { x: 0, y: 0 };
var oldDist = 0;
var eventChannel: WechatMiniprogram.EventChannel;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devScreenWidth: 240,
    devScreenHeight: 280,
    srcImagePath: '',
    ArrayValue: [],
    stats: true
  },
  //  默认数据
  devScreenWidth: 240,
  devScreenHeight: 280,
  smallDevScreenWidth: 172,
  smallDevScreenHeight: 207,
  devSmallBgWidth: 152,
  devSmallBgHeight: 187,
  devScale: 1,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    this.imagePath = option.imagePath!
    eventChannel = this.getOpenerEventChannel()
    //开发板  width = 454, height = 454
    //Z8 width = 320, height = 385
    // this.devScreenWidth = 454
    // this.devScreenHeight = 454

    this.devScreenWidth = parseInt(option.width!)//new Number(option.width!).valueOf()
    this.devScreenHeight = parseInt(option.height!)//new Number(option.height!).valueOf()
    console.log("devScreenWidth : " + this.devScreenWidth);
    console.log("devScreenHeight : " + this.devScreenHeight);

    this.setData(({
      devScreenWidth: this.devScreenWidth,
      devScreenHeight: this.devScreenHeight,
      // devScreenWidth: this.devScreenWidth,
      // devScreenHeight: this.devScreenHeight,
    }))
  },
  getDialInfo() {
    let self = this;
    // 在ui风格部分获取到
    let type = wx.getStorageSync('customType');
    let value = {
      type
    }
    // 跟进设备类型，获取屏幕信息
    veepooFeature.veepooSendGetCustomDialInfoManager(value, function (e: any) {
      console.log("屏幕信息=》", e)
      self.devScreenWidth = e.resolution[0]
      self.devScreenHeight = e.resolution[1]
      self.smallDevScreenWidth = e.border[0]
      self.smallDevScreenHeight = e.border[1]
      self.devSmallBgWidth = e.thumbnails[0]
      self.devSmallBgHeight = e.thumbnails[1]

      self.setData({
        devScreenWidth: e.resolution[0],
        devScreenHeight: e.resolution[1],
        smallDevScreenWidth: e.border[0],
        smallDevScreenHeight: e.border[0]
      })

    })
  },
  canvasHeight: 0,
  canvasWidth: 0,
  dpr: 1,
  onReady() {
    this.screenWidth = wx.getSystemInfoSync().windowWidth;
    this.dpr = wx.getWindowInfo().pixelRatio
    wx.getImageInfo({
      src: this.imagePath, success: (e) => {
        this.baseWidth = e.width
        this.baseHeight = e.height
        this.imgLoad()
      }
    })
  },

  // 获取到的图片load
  imgLoad() {
    const query = wx.createSelectorQuery();
    query.select('#test').boundingClientRect((res) => {
      console.log("this.canvasWidth " + res.width);

      this.devScale = (0.64 * res.width) / this.devScreenWidth
      this.canvasHeight = res.height / this.devScale
      this.canvasWidth = res.width / this.devScale
      this.boxWidth = this.devScreenWidth
      this.boxHeight = this.devScreenHeight
      //对canvas进行scale

      if (this.baseHeight > this.baseWidth) {//图片原始高度大于宽度
        this.multiple = this.baseWidth / this.boxWidth // 计算原图和默认显示的倍数
        this.initHeight = this.baseHeight / this.multiple
        this.initWidth = this.boxWidth
        this.transferOffset.x = (this.canvasWidth - this.boxWidth) / 2
        this.transferOffset.y = -(this.initHeight - this.canvasHeight) / 2
      } else {//图片原始宽度大于高度
        this.multiple = this.baseHeight / this.boxHeight // 计算原图和默认显示的倍数
        this.initHeight = this.boxHeight
        this.initWidth = this.baseWidth / this.multiple
        this.transferOffset.x = -(this.initWidth - this.canvasWidth) / 2
        this.transferOffset.y = (this.canvasHeight - this.boxHeight) / 2
      }
      this.scaleHeight = this.initHeight
      this.scaleWidth = this.initWidth
      this.createImage(this.transferOffset)
    }).exec()
  },

  // 创建图片
  createImage(transfer: { x: number, y: number }) {
    //判断越界
    const boxMarginHorizontal = (this.canvasWidth - this.boxWidth) / 2; //水平边距
    const boxMarginVertical = (this.canvasHeight - this.boxHeight) / 2; //竖直边距
    const ctx = wx.createCanvasContext('shareFrends')
    // ctx.restore()
    ctx.scale(this.devScale, this.devScale)
    let translateX = 0
    let translateY = 0
    let rotateAngle = 0
    //旋转,保持中心的东西一直在中心
    switch (this.direction) {
      case 0://不变

        break;
      case 1://逆时针90度
        //旋转第一种情况
        translateX = 0.5 * (this.canvasWidth - this.canvasHeight)
        translateY = 0.5 * (this.canvasHeight + this.canvasWidth)
        rotateAngle = -90
        break;
      case 2://逆时针180度
        //旋转第2种情况
        translateX = this.canvasWidth
        translateY = this.canvasHeight
        rotateAngle = -180
        break;
      case 3:
        //逆时针270度
        translateX = 0.5 * (this.canvasHeight + this.canvasWidth)
        translateY = 0.5 * (this.canvasHeight - this.canvasWidth)
        rotateAngle = -270
        break;
      default:
        break;
    }

    ctx.translate(translateX, translateY);
    ctx.rotate(rotateAngle * Math.PI / 180)

    console.log("transfer.x : " + transfer.x);
    console.log("transfer.y : " + transfer.y);
    // if (transfer.x > boxMarginHorizontal) {
    //     transfer.x = boxMarginHorizontal
    // } else if (transfer.x < (boxMarginHorizontal - this.scaleWidth + this.boxWidth)) {
    //     transfer.x = (boxMarginHorizontal - this.scaleWidth + this.boxWidth)
    // }
    // if (transfer.y > boxMarginVertical) {
    //     transfer.y = boxMarginVertical
    // } else if (transfer.y < (boxMarginVertical - this.scaleHeight + this.boxWidth)) {
    //     transfer.y = (boxMarginVertical - this.scaleHeight + this.boxWidth)
    // }
    ctx.globalAlpha = 1
    ctx.drawImage(this.imagePath, transfer.x, transfer.y, this.scaleWidth, this.scaleHeight);

    //还原ctx角度
    ctx.rotate(-rotateAngle * Math.PI / 180)
    ctx.translate(-translateX, -translateY);

    ctx.drawImage('/image/img_bg_line.png', boxMarginHorizontal, boxMarginVertical, this.boxWidth, this.boxHeight);
    ctx.globalAlpha = 0.25
    ctx.drawImage('/image/gray.png', 0, 0, this.canvasWidth, boxMarginVertical);
    ctx.drawImage('/image/gray.png', 0, boxMarginVertical, boxMarginHorizontal, this.boxHeight);
    ctx.drawImage('/image/gray.png', boxMarginHorizontal + this.boxWidth, boxMarginVertical, boxMarginHorizontal, this.boxHeight);
    ctx.drawImage('/image/gray.png', 0, boxMarginVertical + this.boxHeight, this.canvasWidth, boxMarginVertical);
    ctx.draw()

    //翻转好像是把一整个canvas画的方向进行改变
  },
  touchstart(e: WechatMiniprogram.TouchEvent) {
    console.log("开始点击" + e.touches[0].clientX + " , " + e.touches[0].clientY);
    lastTouchPoint = { x: 0, y: 0 }
    if (e.touches.length > 1) {
      oldDist = this._spacing(e)
      //计算中心点
      var centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      //根据中心点计算出，图片的中心点，然后保持中心点位置不变
      //canvas宽高不变
      console.log("centerX : " + centerX + ", centerY: " + centerY);
      this.lastTouchDetailArray = e.touches
    }
  },
  ni: 0,
  direction: 0, //方向
  imagePath: '', //图片路径
  transferOffset: { x: 0, y: 0 }, //偏移位置
  scale: 1, //缩放比例
  screenWidth: 100, //屏幕宽度
  multiple: 1, // 计算原图和默认显示的倍数
  baseWidth: 100, // 图片实际宽度
  baseHeight: 100, // 图片实际高度
  initWidth: 100, // 图片默认显示宽度
  initHeight: 100, // 图片默认显示高度
  scaleWidth: 100, // 图片缩放后的宽度
  scaleHeight: 100, // 图片缩放后的高度
  boxWidth: 100, // 取景框的宽度
  boxHeight: 100, // 取景框的高度
  lastTouchDetailArray: new Array<WechatMiniprogram.TouchDetail>(),//上次双指移动的位置
  touchmove(e: WechatMiniprogram.TouchEvent) {
    // console.log("拖动");
    this.ni++
    switch (e.touches.length) {
      case 1://单指只有拖动
        if (lastTouchPoint.x == 0 && lastTouchPoint.y == 0) {
          lastTouchPoint.x = e.touches[0].clientX
          lastTouchPoint.y = e.touches[0].clientY
        } else {
          var xOffset = e.touches[0].clientX - lastTouchPoint.x
          var yOffset = e.touches[0].clientY - lastTouchPoint.y
          lastTouchPoint.x = e.touches[0].clientX
          lastTouchPoint.y = e.touches[0].clientY
          switch (this.direction) {
            case 0://不变
              this.transferOffset.x += xOffset
              this.transferOffset.y += yOffset
              break;
            case 1://逆时针90度
              //旋转第一种情况
              this.transferOffset.x += -yOffset
              this.transferOffset.y += xOffset
              break;
            case 2://逆时针180度
              //旋转第2种情况
              this.transferOffset.x += -xOffset
              this.transferOffset.y += -yOffset
              break;
            case 3:
              //逆时针270度
              this.transferOffset.x += yOffset
              this.transferOffset.y += -xOffset
              break;
            default:
              break;
          }
          this.createImage(this.transferOffset)
          // console.log("lastTouchPoint ", this.transferOffset);
        }
        break;
      case 2://双指有拖动和放大缩小
        //需要区分当前动作是放大缩小还是拖动
        const dValueX0 = e.touches[0].clientX - this.lastTouchDetailArray[0].clientX
        const dValueY0 = e.touches[0].clientY - this.lastTouchDetailArray[0].clientY
        const dValueX1 = e.touches[1].clientX - this.lastTouchDetailArray[1].clientX
        const dValueY1 = e.touches[1].clientY - this.lastTouchDetailArray[1].clientY
        this.lastTouchDetailArray = e.touches
        const isSameDirectionX = (dValueX0 <= 0 && dValueX1 <= 0) || (dValueX0 >= 0 && dValueX1 >= 0) //|| (Math.abs(dValueX0 - dValueX1) < 5) // || (dValueX0 == 0 && dValueX1 == 0)
        const isSameDirectionY = (dValueY0 <= 0 && dValueY1 <= 0) || (dValueY0 >= 0 && dValueY1 >= 0) //|| (Math.abs(dValueY0 - dValueY1) < 5)// || (dValueY0 == 0 && dValueY1 == 0)
        // console.log("dValueX0 ：", dValueX0);
        // console.log("dValueY0 ：", dValueY0);
        // console.log("dValueX1 ：", dValueX1);
        // console.log("dValueY1 ：", dValueY1);
        let type = 1//0:拖动，1：放大缩小
        if ((dValueX0 == 0 && dValueY0 == 0) || (dValueX1 == 0 && dValueY1 == 0)) {//有一根手指保持静止认为放大缩小

        } else if (isSameDirectionX && isSameDirectionY) {//移动方向相同
          type = 0
        }
        console.log("type ：", type);

        if (type == 1) {//放大缩小
          let distance = this._spacing(e);
          // 计算移动的过程中实际移动了多少的距离
          let distanceDiff = distance - oldDist;
          let newScale = this.scale + 0.0005 * distanceDiff;
          console.log(" newScale " + newScale);
          console.log(" multiple " + this.multiple);
          if (newScale >= this.multiple && this.multiple > 2) { // 原图比较大情况
            newScale = this.multiple;
            console.log(" 原图比较大情况 ");
          } else if (this.multiple < 2 && newScale >= 2) { // 原图较小情况
            newScale = 2; // 最大2倍
            console.log(" 最大2倍 ");
          };
          // // 最小缩放到1
          if (newScale <= 1) {
            newScale = 1;
          };
          this.scale = newScale
          this.scaleWidth = newScale * this.initWidth;
          this.scaleHeight = newScale * this.initHeight;
          this.createImage(this.transferOffset)
        } else {//拖动
          let xOffset = dValueX1
          let yOffset = dValueY1//选最大的
          if (Math.abs(dValueX0) > Math.abs(dValueX1)) {//选绝对值最大的
            xOffset = dValueX0
          }
          if (Math.abs(dValueY0) > Math.abs(dValueY1)) {//选绝对值最大的
            yOffset = dValueY0
          }
          switch (this.direction) {
            case 0://不变
              this.transferOffset.x += xOffset
              this.transferOffset.y += yOffset
              break;
            case 1://逆时针90度
              //旋转第一种情况
              this.transferOffset.x += -yOffset
              this.transferOffset.y += xOffset
              break;
            case 2://逆时针180度
              //旋转第2种情况
              this.transferOffset.x += -xOffset
              this.transferOffset.y += -yOffset
              break;
            case 3:
              //逆时针270度
              this.transferOffset.x += yOffset
              this.transferOffset.y += -xOffset
              break;
            default:
              break;
          }
          this.createImage(this.transferOffset)
        }
        break;
      default:
        break;
    }
  },
  touchend(_e: WechatMiniprogram.TouchEvent) {
    console.log("拖动结束");
  },
  clickCancel(_e: WechatMiniprogram.BaseEvent) {
    wx.navigateBack()
  },
  clickOverturn() {
    this.direction = (this.direction + 1) % 4
    this.createImage(this.transferOffset)
  },

  // 选取图片
  clickSelect() {
    let self = this
    const transfer = this.transferOffset
    const boxMarginHorizontal = (this.canvasWidth - this.boxWidth) / 2//水平边距
    const boxMarginVertical = (this.canvasHeight - this.boxHeight) / 2//竖直边距
    const ctx = wx.createCanvasContext('shareFrends')
    // ctx.restore()//调用ctx.restore()会导致canvasGetImageData异常
    ctx.scale(this.devScale, this.devScale)

    let translateX = 0
    let translateY = 0
    let rotateAngle = 0
    //旋转,保持中心的东西一直在中心
    switch (this.direction) {
      case 0://不变

        break;
      case 1://逆时针90度
        //旋转第一种情况
        translateX = 0.5 * (this.canvasWidth - this.canvasHeight)
        translateY = 0.5 * (this.canvasHeight + this.canvasWidth)
        rotateAngle = -90
        break;
      case 2://逆时针180度
        //旋转第2种情况
        translateX = this.canvasWidth
        translateY = this.canvasHeight
        rotateAngle = -180
        break;
      case 3:
        //逆时针270度
        translateX = 0.5 * (this.canvasHeight + this.canvasWidth)
        translateY = 0.5 * (this.canvasHeight - this.canvasWidth)
        rotateAngle = -270
        break;
      default:
        break;
    }

    ctx.translate(translateX, translateY);
    ctx.rotate(rotateAngle * Math.PI / 180)

    console.log("transfer.x : " + transfer.x);
    console.log("transfer.y : " + transfer.y);

    ctx.globalAlpha = 1
    ctx.drawImage(this.imagePath, transfer.x, transfer.y, this.scaleWidth, this.scaleHeight);
    console.log("transfer==>", transfer)
    console.log(' this.scaleWidth==>', this.scaleWidth)
    console.log(' this.scaleHeight==>', this.scaleHeight)

    //还原ctx角度
    ctx.rotate(-rotateAngle * Math.PI / 180)
    ctx.translate(-translateX, -translateY);

    ctx.drawImage('/image/black.png', 0, 0, this.canvasWidth, boxMarginVertical);
    ctx.drawImage('/image/black.png', 0, boxMarginVertical, boxMarginHorizontal, this.boxHeight);
    ctx.drawImage('/image/black.png', boxMarginHorizontal + this.boxWidth, boxMarginVertical, boxMarginHorizontal, this.boxHeight);
    ctx.drawImage('/image/black.png', 0, boxMarginVertical + this.boxHeight, this.canvasWidth, boxMarginVertical);
    ctx.draw()
    //用另一个canvas放大图片获取
    let translateX2 = 0
    let translateY2 = 0
    let rotateAngle2 = 0
    switch (this.direction) {
      case 0://不变

        break;
      case 1://逆时针90度
        //旋转第一种情况
        translateX2 = 0.5 * (this.devScreenWidth - this.devScreenHeight)
        translateY2 = 0.5 * (this.devScreenHeight + this.devScreenWidth)
        rotateAngle2 = -90
        break;
      case 2://逆时针180度
        //旋转第2种情况
        translateX2 = this.devScreenWidth
        translateY2 = this.devScreenHeight
        rotateAngle2 = -180
        break;
      case 3:
        //逆时针270度
        translateX2 = 0.5 * (this.devScreenHeight + this.devScreenWidth)
        translateY2 = 0.5 * (this.devScreenHeight - this.devScreenWidth)
        rotateAngle2 = -270
        break;
      default:
        break;
    }
    const ctx2 = wx.createCanvasContext('shareFrends2')
    ctx2.scale(this.devScale, this.devScale)
    ctx2.translate(translateX2, translateY2);
    ctx2.rotate(rotateAngle2 * Math.PI / 180)
    switch (this.direction) {
      case 0:
        ctx2.drawImage(this.imagePath, ((transfer.x - boxMarginHorizontal) / (this.devScale)), ((transfer.y - boxMarginVertical) / (this.devScale)), (this.scaleWidth / (this.devScale)), (this.scaleHeight / (this.devScale)));
        break;
      case 1:
        ctx2.drawImage(this.imagePath, ((transfer.x) / (this.devScale)), 0, (this.scaleWidth / (this.devScale)), (this.scaleHeight / (this.devScale)));
        break;
      // case 2:
      //     ctx2.drawImage(this.imagePath, ((transfer.x- boxMarginHorizontal) /(this.devScale)), ((transfer.y) / (this.devScale)), (this.scaleWidth / (this.devScale)), (this.scaleHeight / (this.devScale)));
      //     break;
      default:
        ctx2.drawImage(this.imagePath, ((transfer.x) / (this.devScale)), ((transfer.y) / (this.devScale)), (this.scaleWidth / (this.devScale)), (this.scaleHeight / (this.devScale)));
        break;
    }
    //ctx2.drawImage(this.imagePath,((transfer.x-boxMarginHorizontal)/(this.devScale)), ((transfer.y-boxMarginVertical)/(this.devScale)), (this.scaleWidth/(this.devScale)), (this.scaleHeight/(this.devScale)));

    ctx2.draw()
    setTimeout(() => {

      let arr: any = []

      // //调用ctx.restore()会导致canvasGetImageData异常
      // 大图
      wx.canvasGetImageData({
        canvasId: 'shareFrends2',
        x: 0,
        y: 0,
        width: this.devScreenWidth,
        height: this.devScreenHeight,
        success: (res) => {
          const tempData = res.data
          console.log("tempData=>", tempData)
          const data = new Uint8Array(tempData.byteLength)
          for (let index = 0; index < tempData.byteLength; index += 4) {
            const r = tempData[index];
            const g = tempData[index + 1];
            const b = tempData[index + 2];
            const a = tempData[index + 3];
            data[index] = b
            data[index + 1] = g
            data[index + 2] = r
            data[index + 3] = a
          }
          let val = {
            data2: data,
            devScreenWidth: this.devScreenWidth,
            devScreenHeight: this.devScreenHeight
          }
          arr[0] = val
          return
        }, fail: (error) => {
          console.error("canvasGetImageData fail :", error);
        }
      })

      // 获取缩略图Uint8Array数据
      wx.canvasToTempFilePath({
        canvasId: 'shareFrends2',
        x: 0,
        y: 0,
        width: this.devScreenWidth,
        height: this.devScreenHeight,
        destWidth: this.devSmallBgWidth,
        destHeight: this.devSmallBgHeight,
        success(res) {
          console.log(" 导出成功缩略图内容 ： ", res);
          // wx.saveImageToPhotosAlbum({
          //   filePath: res.tempFilePath
          // })
          // 背景图  这里默认杰里 背景 240*296 部分，其他的屏幕根据获取屏幕信息接口得到的数据进行兼容适配，相关的边框在dial_image文件 
          let back = '../../../../image/555.png';
          // 缩略图内容
          let pic = res.tempFilePath

          // 将缩略图与边框合并
          self.frame(back, pic, arr)

          return
        }
      })
    }, 150);
  },

  // 将两个图片合并
  frame(back: string, pic: string, arr: any) {
    let self = this;
    wx.createSelectorQuery().select("#myCanvas").fields({
      node: true,
      size: true
    }).exec(res => {
      if (!res[0]) {
        console.error('无法获取canvas节点');
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      // 缩略图边框大小，跟进获取到的边框大小传入
      canvas.width = 172;
      canvas.height = 207;
      // 绘制缩略图
      const backImg = canvas.createImage();
      backImg.src = pic;
      backImg.onload = () => {
        ctx.drawImage(backImg, 0, 0, 172, 207);
        const Img = canvas.createImage();
        Img.src = back;
        Img.onload = () => {
          // 保存当前状态  
          ctx.save();
          // 计算上层图片的居中位置  
          const imgX = (canvas.width - Img.width) / 2;
          const imgY = (canvas.height - Img.height) / 2;
          ctx.drawImage(Img, imgX, imgY, Img.width, Img.height);
          // 恢复状态  
          ctx.restore();
          // 转换为临时文件路径
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: ress => {
              console.log("临时文件路径：", ress);
              // 在这里可以调用上传图片的方法，使用ress.tempFilePath作为上传的图片路径  
              self.smallData(ress.tempFilePath, arr);
              // wx.saveImageToPhotosAlbum({
              //   filePath: ress.tempFilePath
              // })
            },
            fail: err => {
              console.error('转换图片失败：', err);
            }
          });
        };
      };
    });
  },

  // 缩略图数据
  smallData(tempFilePath: any, arr: any) {
    let self = this;
    console.log("tempFilePath=>", tempFilePath)
    const ctx = wx.createCanvasContext('shareFrends3');
    ctx.drawImage(tempFilePath, 0, 0, self.smallDevScreenWidth, self.smallDevScreenHeight);
    ctx.draw();

    self.setData({
      stats: false
    })
    wx.canvasGetImageData({
      canvasId: 'shareFrends3',
      x: 0,
      y: 0,
      width: self.smallDevScreenWidth,
      height: self.smallDevScreenHeight,
      success: (res) => {
        const tempData = res.data
        console.log("res====>", res)
        const data = new Uint8Array(tempData.byteLength)
        for (let index = 0; index < tempData.byteLength; index += 4) {
          const r = tempData[index];
          const g = tempData[index + 1];
          const b = tempData[index + 2];
          const a = tempData[index + 3];
          data[index] = b
          data[index + 1] = g
          data[index + 2] = r
          data[index + 3] = a
        }
        let val = {
          data1: data,
          smallDevScreenWidth: self.smallDevScreenWidth,
          smallDevScreenHeight: self.smallDevScreenHeight
        }
        arr[1] = val

        self._bmpConvert(arr)
      }, fail: (error) => {
        console.error("canvasGetImageData fail :", error);
      }
    })
  },





  // 
  crc16WithBigData(data: any) {
    const crc16_tab = data; // 这里应该是CRC16的查找表，一个包含256个元素的数组  
    let crc16 = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      const uIndex = (crc16 & 0xFF) ^ data[i];
      crc16 = ((crc16 >>> 8) & 0xFF) ^ crc16_tab[uIndex];
    }
    return crc16;
  },



  uint8ArrayToHex(uInt8Array: any) {
    console.log("uint8array=>", uInt8Array)
    return uInt8Array.map((byte: any) => byte.toString(16).padStart(2, '0')).join('');
  },
  uint8arrayToBinary(u8Array: any) {
    let binaryString = '';
    for (let i = 0; i < u8Array.length; i++) {
      binaryString += u8Array[i].toString(2); // 用 2 进制表示每个字节
    }
    return binaryString;
  },

  _bmpConvert(val: any) {
    // _bmpConvert(data: Uint8Array, witdh: number, height: number) {
    let self = this;
    let obj: any = {}

    val.forEach((item: any, index: number) => {
      if (item.data1) {
        const result1 = bmpConvert(1, item.data1, Math.floor(item.smallDevScreenWidth), Math.floor(item.smallDevScreenHeight))//宽高向下取整
        obj.data1 = result1
      } else {
        console.log("data2")
        const result2 = bmpConvert(1, item.data2, Math.floor(item.devScreenWidth), Math.floor(item.devScreenHeight))//宽高向下取整
        obj.data2 = result2
      }
    })
    console.log("obj=======>", obj)
    eventChannel.emit('onDialBgData', { data: obj });
    wx.navigateBack()

  },


  /**
  * 计算两指间距
  */
  _spacing(event: WechatMiniprogram.TouchEvent) {
    var x = event.touches[0].clientX - event.touches[1].clientX;
    var y = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(x * x + y * y);
  },
})