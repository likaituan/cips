/**
 * Created by likaituan on 28/09/2017.
 */

var fs = require('fs');
var redis = require('./redis');

var showErr = (res, routePath, interfaceErr) => {
	console.log(`${routePath}:\n`, {interfaceErr});
	res.status(500).end();
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

exports.parse = (path, dir, maps, app) => {
	var routes = this.getRoutes(path, dir);
	var arr_routes = [];
	routes.forEach(item => {
		var routePath = maps[item.path] || item.path;
		arr_routes.push(routePath);
		app.all(routePath, async (req, res) => {
			var method = req.method.toLowerCase();
			req.session = await redis.get(req.headers.token) || {};
			// console.log({token: req.headers.token, session:req.session});
			req.data = method == 'get' && req.params || method == 'post' && req.body;
			try {
				var asyncRet = item.fun(req, res);
				asyncRet && asyncRet.catch(interfaceErr => {
					showErr(res, routePath, interfaceErr);
				});
			} catch(interfaceErr) {
				showErr(res, routePath, interfaceErr);
			}
		});
	});
	return arr_routes;
};