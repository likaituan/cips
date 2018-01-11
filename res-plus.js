/**
 * Created by likaituan on 03/03/2017.
 */

// 输出JSON字符串
exports.print = function(json) {
	json.code *= 1;
    json.success = json.code === 200;
    json.message = json.message || '';
	json.data = json.data || null;

	if (Array.isArray(json.data) === false) {
		let data1 = json.data || {};
		let data2 = this.dataPlus || {};
		let newData = Object.assign({}, data1, data2);
		if (Object.keys(newData).length > 0) {
			json.data = newData;
		}
	}

	this.returnData = json;
	this.dataPlus = {};
    this.json(json);
};

// 返回成功数据
exports.okJson = function(val) {
	let json = {
		code: 200
	};
	if (typeof val === 'object') {
		json.data = val;
	}
	else {
		json.message = val || 'ok';
	}
	return json;
};

// 返回失败数据
exports.errJson = function (val) {
	let json = {
		code: -3
	};
	if (arguments.length === 2) {
		json.code = arguments[0];
		json.message = arguments[1];
	}
	else if (typeof val === "object") {
		json = val;
	}
	else if (typeof val === "number") {
		json.code = val;
	}
	else if (typeof val === 'string') {
		json.message = val;
	}
	return json;
};

// 输出成功
exports.printOk = function() {
	let json = exports.okJson(...arguments);
    exports.print.call(this, json);
};

// 输出错误
exports.printErr = function() {
	let json = exports.errJson(...arguments);
    exports.print.call(this, json);
};