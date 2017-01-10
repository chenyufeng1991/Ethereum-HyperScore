/**
 * 该模块测试在nodejs中使用MD5散列
 *
 */
var crypto = require('crypto');

console.log(crypto.createHash('md5').update("chen").digest('hex'));

var md5 = crypto.createHash('md5');
var afterCrypto = md5.update("chen").digest('hex');
console.log(afterCrypto);

