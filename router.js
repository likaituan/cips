/**
 * Created by likaituan on 28/09/2017.
 */

var fs = require('fs');
var redis = require('./redis');
var reqPlus = require('./req-plus');
var resPlus = require('./res-plus');
let Path = require('path');
let { getNow } = require('./utils');
let { getClientIp } = require('ifun/ip');

var showErr = (res, routePath, interfaceErr) => {
	console.log(`${routePath}:\n`, {interfaceErr});
	let err = interfaceErr;
	if (err.hasOwnProperty('code') && err.hasOwnProperty('message') && err.hasOwnProperty('success')) {
		return res.status(200).json(err);
	}
	res.status(500).end();
	console.log(`N-Status: ${res.statusCode}`);
};

let isPromise = function (x) {
	return typeof x === 'object' && x.promiseState !== undefined;
};

let setAlias = function (alias, routes) {
	Object.keys(alias).forEach(aliasUrl => {
		let originUrl = alias[aliasUrl];
		let item = routes.filter(x=>x.path===originUrl)[0];
		if (item) {
			let newItem = {
				path: aliasUrl,
				fun: item.fun,
				isAlias: true
			};
			routes.push(newItem);
		}
	});
};

let getRoutesByFile = (routePath, file) => {
	let methods = require(file);
	if (typeof(methods) == 'function') {
		return [{
			path: routePath,
			fun: methods
		}];
	}
	return Object.keys(methods).map(methodName => {
		return {
			path: `${routePath}/${methodName}`,
			fun: methods[methodName]
		};
	});
};

let getRoutes = (routePath, filePath, routes = []) => {
	fs.readdirSync(filePath).forEach(item => {
		var subRoutePath = `${routePath}/${item}`;
		var subFilePath = `${filePath}/${item}`;
		var isDirectory = fs.statSync(subFilePath).isDirectory();
		if (isDirectory) {
			return getRoutes(subRoutePath, subFilePath, routes);
		}
		subRoutePath = subRoutePath.replace('.js','').replace(/\./g, '/');
		let routeItems = getRoutesByFile(subRoutePath, subFilePath);
		routes = routes.concat(routeItems);
	});
	return routes;
};


exports.parse = (ops, app, OPS) => {
	ops = ops || {};
	if (typeof(ops) != 'object') {
		ops = {dir: ops};
	}
	let routePath = ops.prefix || '';
	let alias = ops.alias || {};
	let needLoginMaps = ops.needLogin && require(Path.resolve(ops.needLogin)) || {};
	let myResPlus = ops.resPlus && require(Path.resolve(ops.resPlus)) || {};

	let filePath = ops.dir || ops.file;
	if (!fs.existsSync(filePath)){
		throw `${filePath} is no exist!`;
	}
	let routes = ops.dir && getRoutes(routePath, ops.dir) || ops.file && getRoutesByFile(routePath, ops.file);
	setAlias(alias, routes);
	var arr_routes = [];
	routes.forEach(item => {
		var routePath = item.path;
		arr_routes.push(routePath);
		app.all(routePath, async (req, res) => {
			var method = req.method.toLowerCase();
			req.data = req._data = method == 'get' && req.params || method == 'post' && req.body;
			// console.log({url:req.url, headers:req.headers, data:req.data, query:req.query});
			Object.assign(req.data, req.query);
			if (ops.onTest) {
				return ops.onTest(req, res);
			}

			let token = req.headers.token || req.data.token;            // 为了兼容form提交
			req.session = OPS.redis && await redis.getToken(token) || {};
			let isToken = token && token === req.session.token;
			// console.log({params:req.data, token, isToken, session:req.session});
			let needLogin = needLoginMaps[routePath] === true || needLoginMaps[routePath] !== false && ops.needLoginDefault;
			if (!isToken && needLogin) {
				return res.status(403).end('no auth');
			}
			Object.keys(reqPlus).forEach(x => req[x] = reqPlus[x].bind(req));
			Object.keys(resPlus).forEach(x => res[x] = resPlus[x].bind(res));
			Object.keys(myResPlus).forEach(x => res[x] = myResPlus[x].bind(res));
			ops.onRequest && ops.onRequest(req, res);
			let headers = {
				ip: getClientIp(req)
			};
			console.log(`\n=================== ${getNow()} =======================`);
			console.log(`Method: ${method}`);
			console.log(`URL: ${req.url}`);
			console.log(`Params: ${JSON.stringify(req.data,null,4)}`);
			console.log(`Headers: ${JSON.stringify(headers,null,4)}`);
			try {
				var asyncRet = await item.fun(req, res);
				if (isPromise(asyncRet)){
					asyncRet.catch(interfaceErr => {
						showErr(res, routePath, interfaceErr);
					});
				} else {
					console.log(`Status: ${res.statusCode}`);
					console.log(`Result: ${JSON.stringify(res.returnData, null, 4)}`);
					ops.onResponse && ops.onResponse(res, req);
				}
			} catch(interfaceErr) {
				showErr(res, routePath, interfaceErr);
			}
		});
	});
	return arr_routes;
};