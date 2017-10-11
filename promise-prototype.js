/**
 * Created by likaituan on 20/04/2017.
 */

var {printOk, printErr} = require('./print');

// 结束
Promise.prototype.end = function (res, successRet, errRet) {
    return this//.catch(err=>log({err}))
        .then(
        ret =>  printOk(res, successRet || ret),
        err => printErr(res, errRet || err)
    );
};

// 显示OK
Promise.prototype.printOk = function (res, message) {
    return this.then(
        ret =>  printOk(res, message || ret)
    );
};
