"use strict";
const e = "杰理-OTA";

function t(t) {
  let R = new Date;
  const _ = R.getFullYear(),
    i = R.getMonth() + 1,
    a = R.getDate(),
    s = R.getHours(),
    E = R.getMinutes(),
    n = R.getSeconds(),
    o = R.getMilliseconds();
  return `${[_,i,a].map(r).join("/")} ${[s,E,n,o].map(r).join(":")}` + ":" + e + "--\x3e" + t
}
const r = e => (e = e.toString())[1] ? e : `0${e}`;
var R, _ = 1;
var i, a = new Map;

function s(e) {
  let t = a.get(e);
  return t || !0
}

function E(e, r) {
  r && !s(r) || _ <= 3 && null != R && R.logi(t(e))
}

function n(e, r) {
  r && !s(r) || _ <= 5 && null != R && R.loge(t(e))
}
class o {}

function O(e, t) {
  let r = "";
  switch (e) {
    case o.ERROR_UNKNOWN:
      r = "Unknown error.";
      break;
    case o.ERROR_NONE:
      r = "Success";
      break;
    case o.ERROR_INVALID_PARAM:
      r = "Invalid parameter.";
      break;
    case o.ERROR_DATA_FORMAT:
      r = "Data formatting error.";
      break;
    case o.ERROR_NOT_FOUND_RESOURCE:
      r = "No resources found.";
      break;
    case o.ERROR_UNKNOWN_DEVICE:
      r = "Unknown device.";
      break;
    case o.ERROR_DEVICE_OFFLINE:
      r = "Device went offline.";
      break;
    case o.ERROR_IO_EXCEPTION:
      r = "I/O exceptions occur.";
      break;
    case o.ERROR_REPEAT_STATUS:
      r = "Repeat state.";
      break;
    case o.ERROR_RESPONSE_TIMEOUT:
      r = "Waiting for reply command timed out.";
      break;
    case o.ERROR_REPLY_BAD_STATUS:
      r = "Device returned a bad status.";
      break;
    case o.ERROR_REPLY_BAD_RESULT:
      r = "Device returned an error result.";
      break;
    case o.ERROR_NONE_PARSER:
      r = "There is no associated parser.";
      break;
    case o.ERROR_OTA_LOW_POWER:
      r = "Low power of equipment.";
      break;
    case o.ERROR_OTA_UPDATE_FILE:
      r = "Upgrading firmware information is error.";
      break;
    case o.ERROR_OTA_FIRMWARE_VERSION_NO_CHANGE:
      r = "Upgrade File version must be consistent with the firmware version.";
      break;
    case o.ERROR_OTA_TWS_NOT_CONNECT:
      r = "TWS is disconnect.";
      break;
    case o.ERROR_OTA_HEADSET_NOT_IN_CHARGING_BIN:
      r = "The earphone is not in the charging bin.";
      break;
    case o.ERROR_OTA_DATA_CHECK_ERROR:
      r = "Check upgrade data error.";
      break;
    case o.ERROR_OTA_FAIL:
      r = "ota failed.";
      break;
    case o.ERROR_OTA_ENCRYPTED_KEY_NOT_MATCH:
      r = "The encryption key does not match";
      break;
    case o.ERROR_OTA_UPGRADE_FILE_ERROR:
      r = "The upgrade file is damaged.";
      break;
    case o.ERROR_OTA_UPGRADE_TYPE_ERROR:
      r = "Upgrade type error.";
      break;
    case o.ERROR_OTA_LENGTH_OVER:
      r = "A length error occurred during upgrade.";
      break;
    case o.ERROR_OTA_FLASH_IO_EXCEPTION:
      r = "Flash read/write errors occur.";
      break;
    case o.ERROR_OTA_CMD_TIMEOUT:
      r = "Device timed out waiting for a command.";
      break;
    case o.ERROR_OTA_IN_PROGRESS:
      r = "OTA is in progress.";
      break;
    case o.ERROR_OTA_COMMAND_TIMEOUT:
      r = "SDK timed out waiting for a command.";
      break;
    case o.ERROR_OTA_RECONNECT_DEVICE_TIMEOUT:
      r = "Waiting for reconnect device timeout.";
      break;
    case o.ERROR_OTA_USE_CANCEL:
      r = "Canceling the upgrade";
      break;
    case o.ERROR_OTA_SAME_FILE:
      r = "Same upgrade file."
  }
  return null == t || 0 == t.length ? r : r + "\n" + t
}
o.ERROR_UNKNOWN = -1, o.ERROR_NONE = 0, o.ERROR_INVALID_PARAM = -2, o.ERROR_DATA_FORMAT = -3, o.ERROR_NOT_FOUND_RESOURCE = -4, o.ERROR_UNKNOWN_DEVICE = -32, o.ERROR_DEVICE_OFFLINE = -33, o.ERROR_IO_EXCEPTION = -35, o.ERROR_REPEAT_STATUS = -36, o.ERROR_RESPONSE_TIMEOUT = -64, o.ERROR_REPLY_BAD_STATUS = -65, o.ERROR_REPLY_BAD_RESULT = -66, o.ERROR_NONE_PARSER = -67, o.ERROR_OTA_LOW_POWER = -97, o.ERROR_OTA_UPDATE_FILE = -98, o.ERROR_OTA_FIRMWARE_VERSION_NO_CHANGE = -99, o.ERROR_OTA_TWS_NOT_CONNECT = -100, o.ERROR_OTA_HEADSET_NOT_IN_CHARGING_BIN = -101, o.ERROR_OTA_DATA_CHECK_ERROR = -102, o.ERROR_OTA_FAIL = -103, o.ERROR_OTA_ENCRYPTED_KEY_NOT_MATCH = -104, o.ERROR_OTA_UPGRADE_FILE_ERROR = -105, o.ERROR_OTA_UPGRADE_TYPE_ERROR = -106, o.ERROR_OTA_LENGTH_OVER = -107, o.ERROR_OTA_FLASH_IO_EXCEPTION = -108, o.ERROR_OTA_CMD_TIMEOUT = -109, o.ERROR_OTA_IN_PROGRESS = -110, o.ERROR_OTA_COMMAND_TIMEOUT = -111, o.ERROR_OTA_RECONNECT_DEVICE_TIMEOUT = -112, o.ERROR_OTA_USE_CANCEL = -113, o.ERROR_OTA_SAME_FILE = -114, exports.UpgradeType = void 0, (i = exports.UpgradeType || (exports.UpgradeType = {}))[i.UPGRADE_TYPE_UNKNOWN = -1] = "UPGRADE_TYPE_UNKNOWN", i[i.UPGRADE_TYPE_CHECK_FILE = 0] = "UPGRADE_TYPE_CHECK_FILE", i[i.UPGRADE_TYPE_FIRMWARE = 1] = "UPGRADE_TYPE_FIRMWARE";
class T {
  constructor() {
    this.communicationWay = T.COMMUNICATION_WAY_BLE, this.isSupportNewRebootWay = !1
  }
  toString() {
    return "OTAConfig{communicationWay=" + this.communicationWay + ", isSupportNewRebootWay=" + this.isSupportNewRebootWay + ", updateFileDataSize=" + this.updateFileData?.length + "}"
  }
}
T.COMMUNICATION_WAY_BLE = 0, T.COMMUNICATION_WAY_SPP = 1, T.COMMUNICATION_WAY_USB = 2;
class c {
  copy() {
    const e = new c;
    return e.isSupportNewReconnectADV = this.isSupportNewReconnectADV, e
  }
  toString() {
    return "ReConnectMsg{ isSupportNewReconnectADV=" + this.isSupportNewReconnectADV + "}"
  }
}
class l {
  release() {
    this.callback = null
  }
  onStartOTA() {
    this.cbUpgradeEvent({
      onCallback: e => {
        e.onStartOTA()
      }
    })
  }
  onNeedReconnect(e) {
    this.cbUpgradeEvent({
      onCallback: t => {
        t.onNeedReconnect(e)
      }
    })
  }
  onProgress(e, t) {
    this.cbUpgradeEvent({
      onCallback: r => {
        r.onProgress(e, t)
      }
    })
  }
  onStopOTA() {
    this.cbUpgradeEvent({
      onCallback: e => {
        e.onStopOTA()
      }
    })
  }
  onCancelOTA() {
    this.cbUpgradeEvent({
      onCallback: e => {
        e.onCancelOTA()
      }
    })
  }
  onError(e, t) {
    this.cbUpgradeEvent({
      onCallback: r => {
        r.onError(e, t)
      }
    })
  }
  cbUpgradeEvent(e) {
    null != this.callback && e.onCallback(this.callback)
  }
}
class A {
  constructor(e) {
    this.mUpgradeDataBuf = null, this.mTotalOTaSize = 0, this.mCurrentOtaSize = 0, this.mOTAConfig = null, this.mReConnectMsg = null, this.mDeviceUpgradeInfo = null, this.mTaskTimer = null, this.mReconnectTimer = null, this.mWaitDeviceOffLineTimer = null, this.mIOTAOp = e, this.mUpgradeCbHelper = new l
  }
  release() {
    n("release >>> OTA"), this.isOTA() && (this.cancelOTA(), this._setOTAConfig(null)), this._resetOTAParam(), this.mUpgradeCbHelper.release()
  }
  isOTA() {
    return null != this.mOTAConfig
  }
  startOTA(e, t) {
    if (null == e || null == e.updateFileData || null != e.updateFileData && 0 == e.updateFileData.length) {
      const e = o.ERROR_INVALID_PARAM;
      null != t && t.onError(e, O(e, ""))
    } else if (this.mIOTAOp.isDeviceConnected())
      if (this.isOTA()) {
        const e = o.ERROR_OTA_IN_PROGRESS;
        null != t && t.onError(e, O(e, "OTA is in progress. Please stop ota at first."))
      } else this._setOTAConfig(e), this.mUpgradeCbHelper.callback = t, this._callbackOTAStart(), null != e.updateFileData && e.updateFileData.length > 0 ? this._upgradePrePare(e.updateFileData) : this._callbackOTAError(o.ERROR_OTA_UPGRADE_FILE_ERROR, "startOTA : updateFileData is null or size is 0");
    else {
      const e = o.ERROR_DEVICE_OFFLINE;
      null != t && t.onError(e, O(e, ""))
    }
  }
  cancelOTA() {
    if (this._checkIsNotOTA("cancelOTA")) return !1;
    if (!this.mIOTAOp.isDeviceConnected()) {
      const e = o.ERROR_DEVICE_OFFLINE;
      return this._callbackOTAError(e, O(e, "")), !1
    }
    if (null != this.mDeviceUpgradeInfo && this.mDeviceUpgradeInfo.isSupportDoubleBackup) {
      const e = this,
        t = {
          onResult() {
            e._callbackOTACancel()
          },
          onError(t, r) {
            e._callbackOTAError(t, r)
          }
        };
      return this.mIOTAOp.exitUpdateMode(t), !0
    }
    return n("cancelOTA : device is single flash ota, so ota progress cannot be interrupted."), !1
  }
  onDeviceInit(e, t) {
    t && null != e && (this.mDeviceUpgradeInfo = e), this.isOTA() && null != this.mReconnectTimer && (t && null != e ? (this._stopReConnectDeviceTimeout(), e.isMandatoryUpgrade ? (this._callbackTypeAndProgress(exports.UpgradeType.UPGRADE_TYPE_FIRMWARE, 0), this._enterUpdateMode()) : this._callbackOTAStop()) : this._callbackOTAError(o.ERROR_IO_EXCEPTION, O(o.ERROR_IO_EXCEPTION, "init device failed.")))
  }
  onDeviceDisconnect() {
    this.isOTA() && (null != this.mReConnectMsg ? (E("device is offline. ready to reconnect device"), this._stopWaitDeviceOffLineTimeOut(), null == this.mReconnectTimer && this._startWaitDeviceOffLineTimeOut(300)) : this._callbackOTAError(o.ERROR_DEVICE_OFFLINE, O(o.ERROR_DEVICE_OFFLINE, "")))
  }
  notifyUpgradeSize(e, t) {
    n("设备通知文件大小,totalSize : " + e + " currentSize: " + t), this.mTotalOTaSize = e, this.mCurrentOtaSize = t, this._callbackProgress(this._getCurrentProgress(e, t))
  }
  gainFileBlock(e, t) {
    this._stopTimeoutTask();
    const r = this._readBlockData(e, t),
      R = this,
      _ = {
        onResult() {
          if (0 == e && 0 == t) R._queryUpgradeResult();
          else {
            if (R.mTotalOTaSize > 0) {
              let e = R.mCurrentOtaSize;
              e += t, R.mCurrentOtaSize = e, R._callbackProgress(R._getCurrentProgress(R.mTotalOTaSize, R.mCurrentOtaSize))
            }
            R._startTimeoutTask()
          }
        },
        onError(e, t) {
          R._callbackOTAError(e, t)
        }
      };
    this.mIOTAOp.receiveFileBlock(e, t, r, _)
  }
  _setOTAConfig(e) {
    this.mOTAConfig = e
  }
  _upgradePrePare(e) {
    if (this.mUpgradeDataBuf = e, this.mIOTAOp.isDeviceConnected()) this._readUpgradeFileFlag();
    else {
      const e = o.ERROR_DEVICE_OFFLINE;
      this._callbackOTAError(e, O(e, ""))
    }
  }
  _readUpgradeFileFlag() {
    if (this._checkIsNotOTA("_readUpgradeFileFlag")) return;
    const e = this,
      t = {
        onResult(t) {
          let r;
          if (0 == t.offset && 0 == t.len) {
            r = new Uint8Array(1);
            const t = e.mOTAConfig?.communicationWay;
            r[0] = null != t ? t : 0
          } else r = e._readBlockData(t.offset, t.len);
          0 != r.length ? e._inquiryDeviceCanOTA(r) : this.onError(o.ERROR_INVALID_PARAM, "Read Data over Limit. offset = " + t.offset + ", len = " + t.len)
        },
        onError(t, r) {
          e._callbackOTAError(t, r)
        }
      };
    e.mIOTAOp.readUpgradeFileFlag(t)
  }
  _inquiryDeviceCanOTA(e) {
    if (this._checkIsNotOTA("_inquiryDeviceCanOTA")) return;
    E("inquiryDeviceCanOTA : >>>>>>>>>>>>");
    const t = this,
      r = {
        onResult(e) {
          if (E("inquiryDeviceCanOTA : onResult :  result = " + e), e == u.RESULT_CAN_UPDATE) return void t._checkUpdateEnvironment();
          let r, R = "";
          switch (e) {
            case u.RESULT_DEVICE_LOW_VOLTAGE_EQUIPMENT:
              r = o.ERROR_OTA_LOW_POWER;
              break;
            case u.RESULT_FIRMWARE_INFO_ERROR:
              r = o.ERROR_OTA_UPDATE_FILE;
              break;
            case u.RESULT_FIRMWARE_VERSION_NO_CHANGE:
              r = o.ERROR_OTA_FIRMWARE_VERSION_NO_CHANGE;
              break;
            case u.RESULT_TWS_NOT_CONNECT:
              r = o.ERROR_OTA_TWS_NOT_CONNECT;
              break;
            case u.RESULT_HEADSET_NOT_IN_CHARGING_BIN:
              r = o.ERROR_OTA_HEADSET_NOT_IN_CHARGING_BIN;
              break;
            default:
              r = o.ERROR_UNKNOWN, R = "" + e
          }
          this.onError(r, O(r, R))
        },
        onError(e, r) {
          t._callbackOTAError(e, r)
        }
      };
    t.mIOTAOp.inquiryDeviceCanOTA(e, r)
  }
  _checkUpdateEnvironment() {
    this._checkIsNotOTA("_checkUpdateEnvironment") || (null != this.mDeviceUpgradeInfo ? this.mDeviceUpgradeInfo.isSupportDoubleBackup ? (this._setReConnectMsg(null), this._enterUpdateMode()) : this.mDeviceUpgradeInfo.isNeedBootLoader ? (this.mIOTAOp.changeReceiveMtu(), this._startTimeoutTask()) : this.mDeviceUpgradeInfo.isMandatoryUpgrade ? this._enterUpdateMode() : this._readyToReconnectDevice() : this._callbackOTAError(o.ERROR_DEVICE_OFFLINE, O(o.ERROR_DEVICE_OFFLINE, "")))
  }
  _readBlockData(e, t) {
    if (null != this.mUpgradeDataBuf && this.mUpgradeDataBuf.length > 0 && e + t <= this.mUpgradeDataBuf.length) {
      const r = new Uint8Array(t);
      return r.set(this.mUpgradeDataBuf.slice(e, e + t)), r
    }
    return new Uint8Array(0)
  }
  _queryUpgradeResult() {
    if (this._checkIsNotOTA("queryUpdateResult")) return;
    E("queryUpdateResult : >>>>>>>>>>>>");
    const e = this,
      t = {
        onResult(t) {
          E("queryUpdateResult : onResult :  result = " + t);
          let r = 0,
            R = "";
          switch (t) {
            case p.UPGRADE_RESULT_COMPLETE:
              return e.mIOTAOp.rebootDevice(null), void setTimeout((() => {
                e._callbackOTAStop()
              }), 100);
            case p.UPGRADE_RESULT_DOWNLOAD_BOOT_LOADER_SUCCESS:
              return void e._readyToReconnectDevice();
            case p.UPGRADE_RESULT_DATA_CHECK_ERROR:
              r = o.ERROR_OTA_DATA_CHECK_ERROR;
              break;
            case p.UPGRADE_RESULT_FAIL:
              r = o.ERROR_OTA_FAIL;
              break;
            case p.UPGRADE_RESULT_ENCRYPTED_KEY_NOT_MATCH:
              r = o.ERROR_OTA_ENCRYPTED_KEY_NOT_MATCH;
              break;
            case p.UPGRADE_RESULT_UPGRADE_FILE_ERROR:
              r = o.ERROR_OTA_UPGRADE_FILE_ERROR;
              break;
            case p.UPGRADE_RESULT_UPGRADE_TYPE_ERROR:
              r = o.ERROR_OTA_UPGRADE_TYPE_ERROR;
              break;
            case p.UPGRADE_RESULT_ERROR_LENGTH:
              r = o.ERROR_OTA_LENGTH_OVER;
              break;
            case p.UPGRADE_RESULT_FLASH_READ:
              r = o.ERROR_OTA_FLASH_IO_EXCEPTION;
              break;
            case p.UPGRADE_RESULT_CMD_TIMEOUT:
              r = o.ERROR_OTA_CMD_TIMEOUT;
              break;
            case p.UPGRADE_RESULT_SAME_FILE:
              r = o.ERROR_OTA_SAME_FILE;
              break;
            default:
              r = o.ERROR_UNKNOWN, R = "" + t
          }
          this.onError(r, O(r, R))
        },
        onError(t, r) {
          e._callbackOTAError(t, r)
        }
      };
    this.mIOTAOp.queryUpdateResult(t)
  }
  _enterUpdateMode() {
    if (this._checkIsNotOTA("enterUpdateMode")) return;
    const e = this,
      t = {
        onResult(t) {
          if (0 == t) e._startTimeoutTask();
          else {
            const e = o.ERROR_REPLY_BAD_RESULT;
            this.onError(e, O(e, "" + t))
          }
        },
        onError(t, r) {
          e._callbackOTAError(t, r)
        }
      };
    this.mIOTAOp.enterUpdateMode(t)
  }
  _readyToReconnectDevice() {
    if (this._checkIsNotOTA("readyToReconnectDevice")) return;
    if (null == this.mOTAConfig) return void this._callbackOTAError(o.ERROR_OTA_FAIL, " readyToReconnectDevice found OTACofig is null");
    const e = new c;
    this._setReConnectMsg(e), this._startWaitDeviceOffLineTimeOut(A.WAITING_DEVICE_OFFLINE_TIMEOUT);
    const t = this,
      r = {
        onResult(e) {
          null != t.mReConnectMsg && (t.mReConnectMsg.isSupportNewReconnectADV = 0 != e)
        },
        onError(e, r) {
          t._callbackOTAError(e, r)
        }
      };
    this.mIOTAOp.changeCommunicationWay(this.mOTAConfig.communicationWay, this.mOTAConfig.isSupportNewRebootWay, r)
  }
  _checkIsNotOTA(e) {
    return !this.isOTA() && (n(e + ": Ota progress has not started yet."), !0)
  }
  _setReConnectMsg(e) {
    this.mReConnectMsg = e
  }
  _resetOTAParam() {
    this.mTotalOTaSize = 0, this.mCurrentOtaSize = 0, this._setReConnectMsg(null), this._removeAllTimer()
  }
  _removeAllTimer() {
    this._stopReConnectDeviceTimeout(), this._stopTimeoutTask(), this._stopWaitDeviceOffLineTimeOut()
  }
  _startWaitDeviceOffLineTimeOut(e) {
    this._stopWaitDeviceOffLineTimeOut();
    const t = this;
    this.mWaitDeviceOffLineTimer = setTimeout((() => {
      if (this.mWaitDeviceOffLineTimer = null, n("MSG_WAIT_DEVICE_OFFLINE : timeout. isOTA = " + t.isOTA() + ", " + t.mReConnectMsg), null != t.mReConnectMsg && t.isOTA() && (n("MSG_RECONNECT_DEVICE : start reconnect >>>> isOTA = " + t.isOTA() + ", " + t.mReConnectMsg), t.isOTA() && null != t.mReConnectMsg)) {
        t.mTotalOTaSize = 0, t.mCurrentOtaSize = 0;
        const e = t.mReConnectMsg.copy();
        t._callbackReConnectDevice(e), t._startReConnectDeviceTimeout(e)
      }
    }), e)
  }
  _stopWaitDeviceOffLineTimeOut() {
    null != this.mWaitDeviceOffLineTimer && (clearTimeout(this.mWaitDeviceOffLineTimer), this.mWaitDeviceOffLineTimer = null)
  }
  _startTimeoutTask() {
    this._stopTimeoutTask(), this.mTaskTimer = setTimeout((() => {
      if (this.mTaskTimer = null, this.isOTA()) {
        const e = o.ERROR_OTA_COMMAND_TIMEOUT;
        this._callbackOTAError(e, O(e, ""))
      }
    }), A.WAITING_CMD_TIMEOUT)
  }
  _stopTimeoutTask() {
    null != this.mTaskTimer && (clearTimeout(this.mTaskTimer), this.mTaskTimer = null)
  }
  _startReConnectDeviceTimeout(e) {
    this._stopReConnectDeviceTimeout(), this.mReconnectTimer = setTimeout((() => {
      if (this.mReconnectTimer = null, this.isOTA()) {
        const e = o.ERROR_OTA_RECONNECT_DEVICE_TIMEOUT;
        this._callbackOTAError(e, O(e, ""))
      }
    }), A.RECONNECT_DEVICE_TIMEOUT)
  }
  _stopReConnectDeviceTimeout() {
    null != this.mReconnectTimer && (clearTimeout(this.mReconnectTimer), this.mReconnectTimer = null)
  }
  _callbackOTAStart() {
    this.mUpgradeCbHelper.onStartOTA()
  }
  _callbackProgress(e) {
    const t = null == this.mDeviceUpgradeInfo || this.mDeviceUpgradeInfo.isNeedBootLoader ? 0 : 1;
    this._callbackTypeAndProgress(this._getUpgradeTypeByCode(t), e)
  }
  _callbackTypeAndProgress(e, t) {
    this.mUpgradeCbHelper.onProgress(e, t)
  }
  _callbackReConnectDevice(e) {
    this.mUpgradeCbHelper.onNeedReconnect(e)
  }
  _callbackOTAStop() {
    this._setOTAConfig(null), this._callbackProgress(100), this._resetOTAParam(), n("_callbackOTAStop "), this.mUpgradeCbHelper.onStopOTA(), this.mUpgradeCbHelper.callback = null
  }
  _callbackOTACancel() {
    this._setOTAConfig(null), this._resetOTAParam(), n("_callbackOTACancel "), this.mUpgradeCbHelper.onCancelOTA(), this.mUpgradeCbHelper.callback = null
  }
  _callbackOTAError(e, t) {
    this._setOTAConfig(null), this._resetOTAParam(), n("callbackOTAError :  has an exception, code = " + e + ", " + t), this.mUpgradeCbHelper.onError(e, t), this.mUpgradeCbHelper.callback = null
  }
  _getCurrentProgress(e, t) {
    if (e <= 0) return 0;
    let r = 100 * t / e;
    return r >= 100 && (r = 99.9), r
  }
  _getUpgradeTypeByCode(e) {
    let t;
    switch (e) {
      case 0:
        t = exports.UpgradeType.UPGRADE_TYPE_CHECK_FILE;
        break;
      case 1:
        t = exports.UpgradeType.UPGRADE_TYPE_FIRMWARE;
        break;
      default:
        t = exports.UpgradeType.UPGRADE_TYPE_UNKNOWN
    }
    return t
  }
}
A.WAITING_CMD_TIMEOUT = 2e4, A.WAITING_DEVICE_OFFLINE_TIMEOUT = 6e3, A.RECONNECT_DEVICE_DELAY = 1e3, A.RECONNECT_DEVICE_TIMEOUT = 8e4;
class u {}
u.RESULT_CAN_UPDATE = 0, u.RESULT_DEVICE_LOW_VOLTAGE_EQUIPMENT = 1, u.RESULT_FIRMWARE_INFO_ERROR = 2, u.RESULT_FIRMWARE_VERSION_NO_CHANGE = 3, u.RESULT_TWS_NOT_CONNECT = 4, u.RESULT_HEADSET_NOT_IN_CHARGING_BIN = 5;
class p {}
p.UPGRADE_RESULT_COMPLETE = 0, p.UPGRADE_RESULT_DATA_CHECK_ERROR = 1, p.UPGRADE_RESULT_FAIL = 2, p.UPGRADE_RESULT_ENCRYPTED_KEY_NOT_MATCH = 3, p.UPGRADE_RESULT_UPGRADE_FILE_ERROR = 4, p.UPGRADE_RESULT_UPGRADE_TYPE_ERROR = 5, p.UPGRADE_RESULT_ERROR_LENGTH = 6, p.UPGRADE_RESULT_FLASH_READ = 7, p.UPGRADE_RESULT_CMD_TIMEOUT = 8, p.UPGRADE_RESULT_SAME_FILE = 9, p.UPGRADE_RESULT_DOWNLOAD_BOOT_LOADER_SUCCESS = 128, exports.DeviceUpgradeInfo = class {
  constructor(e, t, r) {
    this.isSupportDoubleBackup = !1, this.isNeedBootLoader = !1, this.isMandatoryUpgrade = !1, this.isSupportDoubleBackup = e, this.isNeedBootLoader = t, this.isMandatoryUpgrade = r
  }
}, exports.FileOffset = class {
  constructor(e, t) {
    this.offset = 0, this.len = 0, null != e && (this.offset = e), null != t && (this.len = t)
  }
  toString() {
    return "FileOffset{offset=" + this.offset + ", len=" + this.len + "}"
  }
}, exports.OTAConfig = T, exports.OTAError = o, exports.OTAImpl = A, exports.ReConnectMsg = c, exports.getErrorDesc = O, exports.logd = function (e, r) {
  r && !s(r) || _ <= 2 && null != R && R.logd(t(e))
}, exports.loge = n, exports.logi = E, exports.logv = function (e, r) {
  r && !s(r) || _ <= 1 && null != R && R.logv(t(e))
}, exports.logw = function (e, r) {
  r && !s(r) || _ <= 4 && null != R && R.logw(t(e))
}, exports.setLogGrade = function (e) {
  _ = e
}, exports.setLogger = function (e) {
  R = e
}, exports.setTagEnable = function (e, t) {
  a.set(e, t)
};