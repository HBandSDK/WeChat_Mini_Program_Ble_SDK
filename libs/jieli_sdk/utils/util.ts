export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}


/***
 * 扩展系统自带的showActionSheet，解决选项超过6个时无法使用问题
 */
export const showActionSheet = function (config: any) {
  if (config.itemList.length > 6) {
    var myConfig: any = {};
    for (var i in config) { //for in 会遍历对象的属性，包括实例中和原型中的属性。（需要可访问，可枚举属性）
      myConfig[i] = config[i];
    }
    myConfig.page = 1;
    myConfig.itemListBak = config.itemList;
    myConfig.itemList = [];
    var successFun = config.success;
    myConfig.success = function (res: any) {
      if (res.tapIndex == 5) {//下一页
        myConfig.page++;
        showActionSheet(myConfig);
      } else {
        res.tapIndex = res.tapIndex + 5 * (myConfig.page - 1);
        successFun(res);
      }
    }
    showActionSheet(myConfig);
    return;
  }
  if (!config.page) {
    wx.showActionSheet(config);
  } else {
    var page = config.page;
    var itemListBak = config.itemListBak;
    var itemList = [];
    //@ts-ignore
    for (var i = 5 * (page - 1); i < 5 * page && i < itemListBak.length; i++) {
      itemList.push(itemListBak[i]);
    }
    if (5 * page < itemListBak.length) {
      itemList.push('下一页');
    }
    config.itemList = itemList;
    wx.showActionSheet(config);
  }
}

// 广播包转
export const getDeviceDataMac = function (device: any) {
  let uint8Array = new Uint8Array(device.advertisData); // 将其转换为Uint8Array

  // 如果你想将其转换为一个普通的数字数组
  let normalArray = Array.from(uint8Array);
  let hexValue = normalArray.map(value => value.toString(16).toUpperCase().padStart(2, '0'));
  let mac = '';
  for (let i = 0; i < hexValue.length; i++) {
    if (hexValue[i] + hexValue[i + 1] == 'F8F8') {
      let hexMac = hexValue.splice(i + 2, 6).reverse();
      for (let j = 0; j < hexMac.length; j++) {
        if (j == hexMac.length - 1) {
          mac = mac ? mac + hexMac[j] : hexMac[j]
        } else {
          mac = mac ? mac + hexMac[j] + ':' : hexMac[j] + ':'
        }
      }
    }
  }


  return mac;
}

// mac+1
export const incrementMacAddress = function (mac: string): string {
  // 按冒号切割并转成数字
  let parts = mac.split(":").map(p => parseInt(p, 16));

  // 从最后一位开始加 1，处理进位
  for (let i = parts.length - 1; i >= 0; i--) {
    parts[i]++;
    if (parts[i] <= 0xFF) {
      break; // 没有溢出就结束
    } else {
      parts[i] = 0; // 溢出清零，进位到前一位
    }
  }

  // 格式化成两位十六进制并大写
  return parts.map(p => p.toString(16).padStart(2, "0").toUpperCase()).join(":");
}
