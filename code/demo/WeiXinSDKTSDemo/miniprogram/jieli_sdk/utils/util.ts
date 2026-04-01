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
export const showActionSheet = function (config:any) {
  if (config.itemList.length > 6) {
    var myConfig :any= {};
    for (var i in config) { //for in 会遍历对象的属性，包括实例中和原型中的属性。（需要可访问，可枚举属性）
      myConfig[i] = config[i];
    }
    myConfig.page = 1;
    myConfig.itemListBak = config.itemList;
    myConfig.itemList = [];
    var successFun = config.success;
    myConfig.success = function (res:any) {
      if (res.tapIndex == 5) {//下一页
        myConfig.page++;
        showActionSheet(myConfig);
      } else {
        res.tapIndex = res.tapIndex + 5 * (myConfig.page-1);
        successFun(res);
      }
    }
    showActionSheet(myConfig);
    return ;
  }
  if (!config.page) {
    wx.showActionSheet(config);
  }else{
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
export const incrementMacAddress = function (macAddress: any) {
  // 将mac地址分割为数组
  let macArray = macAddress.split(':');
  
  // 获取最后一组的值并加1
  let lastGroup = parseInt(macArray[5], 16);
  lastGroup++;
  
  // 将新的值转换成十六进制，并添加到数组中
  macArray[5] = lastGroup.toString(16).padStart(2, '0').toUpperCase();
  
  // 将数组重新组合成新的mac地址，并以大写形式返回
  let newMacAddress = macArray.join(':').toUpperCase();
  
  return newMacAddress;
}
