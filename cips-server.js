/**
 * Created by likaituan on 27/09/2017.
 */

/* find log position
console.log = a => {
	if (a=='dev') ass;
};
*/

var express = require('express');
var router = require('./router');
require('./promise-prototype');

var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));

var ops = {
	port: 8080,
	prefix: '',
	routeMaps: {},
	dir: require('path').resolve('./interfaces')
};

exports.config = options => {
	Object.assign(ops, options);
};

exports.start = port => {
	ops.redis && require('./redis').start(ops.redis, ops.args);
	ops.mongodb && require('./mongodb').config(ops.mongodb, ops.args);
	ops.rest && require('./rest').config(ops.rest, ops.args);

	port = port || ops.port;
	var routes = router.parse(ops.prefix, ops.dir, ops.routeMaps, app);
	app.listen(port, err => {
		console.log(err || `Node Is Running At http://localhost:${port} by cips`);
		console.log(`\ntotal interfaces: ${routes.length}\n${routes.join('\n')}`);
	});
};