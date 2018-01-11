/**
 * Created by likaituan on 11/05/2017.
 */

// 转为字符串
exports.string = function (key) {
    return this.data[key];
};

// 转为数字(广义上的)
exports.numeral = function (key) {
	return this.data[key];
};

// 转为数字(量化)
exports.number = function (key) {
    return +this.data[key];
};

// 转为布尔值
exports.boolean = function (key) {
	let v = this.data[key];
    return v === 'false' ? false : !!v;
};

// 转为日期字符串
exports.date = function (key) {
    return this.data[key];
};

// 转为毫秒数
exports.dateTime = function (key) {
    return this.data[key];
};

// 转为json
exports.json = function (key) {
	let val = this.data[key];
    return val && JSON.parse(val) || '';
};

// 转为Json字符串
exports.jsonString = function (key) {
	return this.data[key];
};

// 转为object
exports.object = function (key) {
	return this.data[key];
};

// 转为枚举
exports.enum = function (key) {
    return this.data[key];
};

Object.keys(module.exports).forEach(key => {
	exports['_'+key] = exports[key];
});



// 格式
exports.format = function () {
	return this;
};

// 长度
exports.len = function () {
	return this;
};

// 位数
exports.bit = function () {
	return this;
};

// 阈值
exports.range = function () {
	return this;
};