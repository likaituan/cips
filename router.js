/**
 * Created by likaituan on 28/09/2017.
 */

var fs = require('fs');
var redis = require('./redis');
var reqPlus = require('./req-plus');
var resPlus = require('./res-plus');
let Path = require('path');
let { getNow } = require('./utils');

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

exports.getRoutes = (path, dir, routes = []) => {
	fs.readdirSync(dir).forEach(item => {
		var newPath = `${path}/${item}`;
		var newDir = `${dir}/${item}`;
		var isDirectory = fs.statSync(newDir).isDirectory();
		if (isDirectory) {
			return this.getRoutes(newPath, newDir, routes);
		}
		newPath = newPath.replace('.js','').replace(/\./g, '/');
		var file = require(newDir);
		if (typeof(file) == 'function') {
			return routes.push({path:newPath, fun:file});
		}
		Object.keys(file).forEach(key => {
			routes.push({path: `${newPath}/${key}`, fun: file[key]});
		});
	});
	return routes;
};


exports.parse = (ops, app) => {
	ops = ops || {};
	if (typeof(ops) != 'object') {
		ops = {dir: ops};
	}
	let path = ops.prefix || '';
	let dir = ops.dir || Path.resolve('./interfaces');
	let alias = ops.alias || {};
	let auth = ops.auth && require(Path.resolve(ops.auth)) || {};
	let myResPlus = ops.resPlus && require(Path.resolve(ops.resPlus)) || {};
	var routes = this.getRoutes(path, dir);
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

			let token = req.headers.token || req.data.token;            // 为了兼容form提交
			req.session = await redis.getToken(token) || {};
			let isToken = token && token === req.session.token;
			// console.log({params:req.data, token, isToken, session:req.session});
			if (auth[routePath] && !isToken) {
				return res.status(403).end('no auth');
			}

			Object.keys(reqPlus).forEach(x => req[x] = reqPlus[x].bind(req));
			Object.keys(resPlus).forEach(x => res[x] = resPlus[x].bind(res));
			Object.keys(myResPlus).forEach(x => res[x] = myResPlus[x].bind(res));
			ops.onRequest && ops.onRequest(req, res);
			console.log(`\n=================== ${getNow()} =======================`);
			console.log(`Method: ${method}`);
			console.log(`URL: ${req.url}`);
			console.log(`Params: ${JSON.stringify(req.data,null,4)}`);
			// console.log(`Headers: ${JSON.stringify(req.headers,null,4)}`);
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