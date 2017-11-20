/**
 * Created by likaituan on 03/11/2017.
 */

// 获取当前事件
exports.getNow = () => {
	return new Date().toISOString().replace('T',' ').replace(/\..+$/,'');
};