

Page({
  data: {
    list: [139, 148, 158, 168, 176, 183, 190, 196, 201, 204, 204, 203, 198, 192, 182, 170, 156, 139, 120, 101, 80, 59, 37, 16, -4, -25, -44, -63, -81, -98, -112, -124, -135, -144, -151, -157, -161, -165, -168, -172, -176, -179, -182, -184, -186, -187, -187, -185, -183, -180, -177, -174, -171, -168, -165, -162, -160, -157, -154, -151, -147, -144, -141, -139, -137, -135, -133, -132, -132, -131, -130, -128, -126, -124, -122, -119, -116, -112, -109, -106, -102, -98, -94, -89, -84, -79, -74, -68, -63, -58, -53, -50, -48, -47, -47, -48, -51, -54, -58, -61, -64, -66, -68, -69, -69, -69, -71, -74, -78, -84, -89, -96, -103, -109, -111, -110, -103, -239, -145, -9, 160, 347, 533, 693, 805, 857, 846, 773, 643, 471, 276, 86, -72, -187, -225, -206, -187, -173, -163, -159, -162, -164, -161, -155, -147, -137, -129, -119, -103, -89, -79, -71, -66, -61, -52, -44, -38, -32, -24, -15, -3, 7, 16, 25, 34, 43, 54, 64, 74, 84, 96, 109, 123, 138, 152, 166, 181, 195, 209, 222, 233, 243, 251, 257, 261, 262, 260, 256, 249, 240, 227, 212, 195, 176, 156, 134, 111, 88, 67, 46, 27, 8, -8, -24, -37, -50, -61, -71, -80, -88, -94, -98, -101, -103, -105, -107, -107, -107, -107, -107, -106, -106, -104, -102, -99, -97, -94, -91, -87, -84, -81, -78, -75, -72, -69, -66, -63, -61, -59, -57, -56, -54, -53, -52, -52, -51, -50, -49, -47, -45, -44, -42, -40, -37, -35, -32],
    height: 300,
    width: 175,
    centerY: 150 // y轴中心作为绘画点，
  },

  onLoad: function () {
    // 获取canvas的上下文

    this.drawCurve();
    this.drawSmallGrid()
    let rr50 = [];
    for (let i = 0; i < hrvData.length; i++) {
      const val = hrvData[i];
      if (val >= 30 && val <= 210) {
        const object = val * 10;
        rr50.push(object);
      }
    }

    let r1Data = this.getRR1Data(rr50, 2);
    let score = this.getHRVScore(r1Data);
    console.log('score==>', score);
  },

  drawSmallGrid() {

    const ctx = wx.createCanvasContext('ecg')

    // 设置线条样式
    ctx.setStrokeStyle('#ececec') //
    ctx.setLineWidth(1) // 线条宽度

    // 将内容绘制到canvas上
    for (var x = 0.5; x < 375; x += 10) {
      ctx.moveTo(x, 0)
      // 结束点
      ctx.lineTo(x, 375)
      // 描边，不调用stroke则看不到画的内容
      ctx.stroke()
    }
    for (var y = 0.5; y < 375; y += 10) {
      ctx.moveTo(0, y)
      // 结束点
      ctx.lineTo(375, y)
      // 描边，不调用stroke则看不到画的内容
      ctx.stroke()   
    }
    ctx.draw()
    return;
  },

  drawCurve: function () {
    let ctx = wx.createCanvasContext('myCanvas', this)
    let list = this.data.list;
    let centerY = this.data.centerY;
    let width = this.data.width;
    let xScale = width / (list.length - 1); // 计算每个数据点占据的宽度
    let yScale = centerY / (Math.max(...list) - Math.min(...list))
    let x = 0;
    let y = centerY / 2 - (list[0] * yScale)
    ctx.beginPath();// 开始绘制
    ctx.moveTo(x, y);
    ctx.setStrokeStyle('#000000'); // 设置线条颜色
    ctx.setLineWidth(2); // 设置线条宽度
    for (let i = 1; i < list.length; i++) {
      let x = i * xScale;
      let y = centerY / 2 - ((list[i] / 2) * yScale); // 负数在中心下方，正数在中心上方
      ctx.lineTo(x, y);
    }


    ctx.stroke(); // 绘制线条
    ctx.draw(false); // 绘制到canvas上，不需要等待上一步绘制完成
  },

  //  hrv

  getHRVScore(rr2data: number[] | null): number {
    if (!rr2data || rr2data.length === 0) {
      return 0;
    }

    const hrvLength = rr2data.length - 1;
    if (hrvLength === 0) {
      return 0;
    }

    const hrvDiff: number[] = new Array(hrvLength);
    let validCount = 0;

    for (let i = 0; i < hrvLength; i++) {
      hrvDiff[i] = Math.abs(rr2data[i + 1] - rr2data[i]);
      if (hrvDiff[i] >= 7 && hrvDiff[i] <= 180) {
        validCount++;
      }
    }
    const score = Math.floor((validCount * 100) / hrvLength);
    return score;
  },

  getRR1Data(data: number[], averageLength: number) {
    if (averageLength > data.length) {
      return null;
    }

    const filterLength = data.length - averageLength + 1;
    const filterData: number[] = new Array(filterLength);

    for (let i = 0; i < filterLength; i++) {
      const sum = Math.floor(data[i]) + Math.floor(data[i + 1]);
      filterData[i] = sum >> 1; // 右移1位等于除以2（整数平均值）
    }

    return filterData;
  }
})
