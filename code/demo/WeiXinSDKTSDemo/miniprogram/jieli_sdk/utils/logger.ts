const canIUseLogManage = wx.canIUse("getLogManager");
const logger = canIUseLogManage ? wx.getLogManager({ level: 1 }) : null;

var logGrade: number = 1;
export function getLogger() {
    const log = {
        logv: (log: string) => {
            logv(log)
        },
        logd: (log: string) => {
            logd(log)
        },
        logi: (log: string) => {
            logi(log)
        },
        logw: (log: string) => {
            logw(log)
        },
        loge: (log: string) => {
            loge(log)
        },
    }
    return log
}
export function setLogGrade(grade: number) {//设置的上传的等级限制
    logGrade = grade
}

function logv(msg: string) {
    console.log(msg);
    if (logGrade <= 1) {
        if (canIUseLogManage && logger != null) {
            logger.log(msg);
        }
    }
}
function logd(msg: string) {
    console.debug(msg);
    if (logGrade <= 2) {
        if (canIUseLogManage && logger != null) {
            logger.debug(msg);
        }
    }
}
function logi(msg: string) {
    console.info(msg);
    if (logGrade <= 3) {
        if (canIUseLogManage && logger != null) {
            logger.info(msg);
        }
    }
}
function logw(msg: string) {
    console.warn(msg);
    if (logGrade <= 4) {
        if (canIUseLogManage && logger != null) {
            logger.warn(msg);
        }
    }
}
function loge(msg: string) {
    console.error(msg);
    if (logGrade <= 5) {
        if (canIUseLogManage && logger != null) {//LogManager没有error方法，只能用warn代替
            logger.warn(msg);
        }
    }
}