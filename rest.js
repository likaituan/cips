/**
 * Created by likaituan on 27/09/2017.
 */

var {get, post, put, postJson, putJson} = require('restler');

let { getNow } = require('./utils');

var getPromise = function (url, method, parseFun) {
	var defaultOptions = {
		timeout: 60000
	};
	return function (data, options) {
		return new Promise((resolve, reject) => {
			data = data || {};
			options = Object.assign(options || {}, defaultOptions);
			// url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
			// console.log(`\n=================== ${getNow()} =======================`);
			console.log(`\n---- rest start ---->`);
			console.log(`method: ${method}`);
			console.log(`url: ${url}`);
			console.log(`data: ${JSON.stringify(data, null, 4)}`);
			// console.log(`Options: ${JSON.stringify(options, null, 4)}`);
			var RestRequest = parseFun(url, data, options);
			// console.log(`Headers: ${JSON.stringify(RestRequest.headers, null, 4)}`);
			RestRequest/*.on('error', err => {
				console.log({err});
				reject(500);
			})*/.on('timeout', ms => {
				console.log(`Timeout: ${ms} ms`);
				reject({
					success: false,
					code: 504,
					message: 'timeout'
				});
			}).on('complete', (ret, res) => {
				if (ret instanceof Error) {
					console.log('Error:', ret.message);
					return reject(500);
				}
				// console.log({ret, res});
				console.log(`statusCode: ${res.statusCode}`);
				console.log(`result: ${JSON.stringify(ret, null, 4)}`);
				console.log(`<----- rest end -----\n`);
				if (res.statusCode === 504) {
					return reject({
						success: false,
						code: 504,
						message: 'timeout'
					});
				}
				if (ret && ret.code && ret.message && ret.code!=200) {
					return reject(`Rest ErrorCode: ${ret.code}`);
				}
				if (ret && ret.status && ret.message && ret.status!=0) {
					return reject(`Rest ErrorStatus: ${ret.status}`);
				}
				resolve(ret);
			});
		});
	};
};

var parseConfig = function(ops, args) {
	if (typeof ops !== 'object') {
		ops = {config: ops};
	}
	var file = require('path').resolve(ops.config);
	var config = require(file);
	if (config.default_env) {
		var env = ops.env || config.default_env;
		config = config[env];
		if (!config) {
			console.log(`the mongodb env [${env}] is no exist!`);
			process.exit();
		}
	}
	if (typeof config === 'function') {
		config = config(args);
	}
	console.log(`Rest[${ops.name}] Is Running At ${config}`);
	Rest.api[ops.name] = config;
};

var Rest = function (apiName) {
	// console.log(Rest.api, apiName);
	this.prefix = Rest.api[apiName];
};

Rest.api = {};

Rest.config = (ops, args) => {
	if (ops[0]) {
		return ops.forEach(item => parseConfig(item, args));
	}
	parseConfig(ops, args);
};

Rest.prototype.get = function (url) {
	return getPromise(this.prefix + url, 'get', (url, data, options) => {
		let query = require('querystring').stringify(data);
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		return get(`${url}?${query}`, options);
	});
};

Rest.prototype.post = function (url) {
	return getPromise(this.prefix + url, 'post', (url, data, options) => {
		options.data = data;
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		// console.log({options});
		return post(url, options);
	});
};

Rest.prototype.put = function (url) {
	return getPromise(this.prefix + url, 'put', (url, data, options) => {
		options.data = data;
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		return put(url, options);
	});
};

Rest.prototype.postJson = function (url) {
	return getPromise(this.prefix + url, 'postJson', (url, data, options) => {
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		return postJson(url, data.json || data, options);
	});
};

Rest.prototype.putJson = function (url) {
	return getPromise(this.prefix + url, 'putJson', (url, data, options) => {
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		return putJson(url, data.json || data, options);
	});
};

module.exports = Rest;