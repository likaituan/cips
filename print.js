/**
 * Created by likaituan on 03/03/2017.
 */

// 输出JSON字符串
exports.print = function(res, json) {
    json.success = json.code == 200;
    json.message = json.message || "";
    res.json(json);
    /*
     res.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' });
     // res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
     var jsonStr = JSON.stringify(json);
     res.end(jsonStr);
     */
};

// 输出成功
exports.printOk = function(res, json) {
    if (typeof(json) == "string") {
        json = {
            message: json
        };
    } else if (typeof(json) == "object" && !json.message && !json.data) {
        json = {
            data: json
        };
    }
    json.data = json.data || null;
    json.code = 200;
    exports.print(res, json);
};

// 输出错误
exports.printErr = function(res, json) {
    if (typeof(json) == "number") {
        json = {
            code: json
        };
    } else if (typeof(json) == "string") {
        json = {
            message: json
        };
    }
    json.code = json.code || -3;
    exports.print(res, json);
};

// 输出字符串
exports.printText = function(res, jsonStr) {
    if (typeof jsonStr == "object") {
        jsonStr = JSON.stringify(jsonStr);
    }
    res.end(jsonStr);
};