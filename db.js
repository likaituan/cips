/**
 * Created by likaituan on 27/09/2017.
 */

var mongodb = require('./mongodb');

exports.mg = function (ops) {
	return function (data) {
		console.log({ops, data});
		return mongodb.connect().then(
			db => {
				var tb = db.collection(ops.tb);
				if (ops.action === 'add') {
					return tb.insertOne(data);
				}
				if (ops.action === 'list') {
					return tb.find(data).toArray();
				}
			}
		).close();
	};
};