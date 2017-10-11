/**
 * Created by likaituan on 28/09/2017.
 */

var Redis = require('ioredis');
var genUuid = require("node-uuid");
var redis;

exports.prefix = '';
const ex = exports.expireTime = 60 * 60 * 24 * 7; //过期时间: 7 days

exports.start = function (ops, args) {
	if (typeof ops !== 'object') {
		ops = {config: ops};
	}
	var file = require('path').resolve(ops.config);
	var config = require(file);
	if (config.default_env) {
		var env = ops.env || config.default_env;
		config = config[env];
		if (!config) {
			console.log(`the redis env [${env}] is no exist!`);
			process.exit();
		}
	}
	if (typeof config === 'function') {
		config = config(args);
	}

	var cluster1 = config.clusters[0];
	redis = new Redis.Cluster(config.clusters);
	// redis错误处理
	redis.on('error', function(err) {
		console.log('ioRedis Error =' + err);
	});
	console.log(`Redis IsRunAt [${env}] env: ${cluster1.host}:${cluster1.port}(first)`);
};

// 获取(返回promise)
exports.get = function(token) {
	return redis.get(this.prefix + token).then(
		ret => {
			var json = ret && JSON.parse(ret);
			return Promise.resolve(json);
		},
		err => Promise.reject(err)
	);
};

exports.getToken = function(userId, token) {
	if (userId) {
		return this.get(userId).then(
			ret => {
				if (ret.token === token) {
					return Promise.resolve(ret);
				}
			},
			err => Promise.reject(err)
		)
	} else {
		return Promise.reject('no userId')
	}
};

// 添加
exports.add = function(json, expireTime) {
	var token = genUuid.v4();
	json.token = token;
	this.set(token, json, expireTime);
	return token;
};

// 设置
exports.set = function(token, json, expireTime) {
	json = JSON.stringify(json);
	return redis.set(this.prefix + token, json, 'EX', expireTime || ex);
};

// 删除
exports.del = function(token) {
	redis.del(this.prefix + token);
};

// 续期
exports.renewal = function(token, json) {
	json.token = token;
	this.set(json.userId, json);
};