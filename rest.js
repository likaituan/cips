/**
 * Created by likaituan on 27/09/2017.
 */

var {get, post, put, postJson, putJson} = require('restler');

var getNow = () => {
	return new Date().toISOString().replace('T',' ').replace(/\..+$/,'');
};

var getPromise = function (url, method, parseFun) {
	var defaultOptions = {
		timeout: 60000
	};
	return function (data, options) {
		url = url.replace(/\{(.+?)\}/g, (_,key) => data[key]);
		options = Object.assign(options || {}, defaultOptions);

		return new Promise((resolve, reject) => {
			console.log(`\n=================== ${getNow()} =======================`);
			console.log(`Method: ${method}`);
			console.log(`Url: ${url}`);
			console.log(`Data: ${JSON.stringify(data, null, 4)}`);
			console.log(`Options: ${JSON.stringify(options, null, 4)}`);
			var RestRequest = parseFun(url, data, options);
			console.log(`Headers: ${JSON.stringify(RestRequest.headers, null, 4)}`);
			RestRequest.on('complete', ret => {
				console.log(`Result: ${JSON.stringify(ret, null, 4)}`);
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
		return get(`${url}?${query}`, options);
	});
};

Rest.prototype.post = function (url) {
	return getPromise(this.prefix + url, 'post', (url, data, options) => {
		options.data = data;
		// console.log({options});
		return post(url, options);
	});
};

Rest.prototype.put = function (url) {
	return getPromise(this.prefix + url, 'put', (url, data, options) => {
		options.data = data;
		return put(url, options);
	});
};

Rest.prototype.postJson = function (url) {
	return getPromise(this.prefix + url, 'postJson', (url, data, options) => postJson(url, data.json || data, options));
};

Rest.prototype.putJson = function (url) {
	return getPromise(this.prefix + url, 'putJson', (url, data, options) => putJson(url, data.json || data, options));
};

module.exports = Rest;