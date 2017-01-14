/**
 * 该模块为测试模块，主要用于测试椭圆曲线算法生成公私钥，以及签名验证；
 * 以及ethereumjs-util 这个官方的工具类的使用
 */
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var ethereumjs_util = require('ethereumjs-util');

/**
 * 使用椭圆曲线加密算法生成公私钥(secp256k1)
 *
 * @type {Buffer}
 */
//需要加密的消息，用string初始化buffer
var msg = new Buffer(32);
msg.fill("消息");

//生成32字节私钥，返回为buffer
var privKey = crypto.randomBytes(32);
console.log(privKey.toString('hex'));

//生成公钥，第二个参数表示是否使用压缩模式，返回为buffer
var pubKey = secp256k1.publicKeyCreate(privKey, false);
console.log(pubKey.toString('hex'));

// 签名消息
var sigObj = secp256k1.sign(msg, privKey);

// 验证签名
console.log(secp256k1.verify(msg, sigObj.signature, pubKey));

/**
 *
 * ethereumjs-util 工具类使用
 */
//bufferToHex:前面默认加上0x
console.log("公钥：" + ethereumjs_util.bufferToHex(pubKey));
console.log("私钥：" + ethereumjs_util.bufferToHex(privKey));

//importPublic:公钥转换成Ethereum格式
console.log("把公钥转换成Ethereum格式：" + ethereumjs_util.bufferToHex(ethereumjs_util.importPublic(pubKey)));

//isValidPublic:判断是否是有效的公私钥,并且公钥是否满足Ethereum格式
console.log("公钥是否有效：" + ethereumjs_util.isValidPublic(ethereumjs_util.importPublic(pubKey)));
console.log("私钥是否有效：" + ethereumjs_util.isValidPrivate(privKey));

//privateToAddress:把私钥转换成对应账户的Ethereum地址
console.log(ethereumjs_util.bufferToHex(ethereumjs_util.privateToAddress(privKey)));
//pubToAddress:把公钥转换成对应账户的Ethereum地址
console.log(ethereumjs_util.bufferToHex(ethereumjs_util.pubToAddress(pubKey, true)));

//toBuffer:把其他数据类型转换成buffer
console.log(ethereumjs_util.toBuffer("123456"));

//stripHexPrefix：移除十六进制前缀0x
console.log("移除0x:" + ethereumjs_util.stripHexPrefix(ethereumjs_util.bufferToHex(ethereumjs_util.pubToAddress(pubKey, true))));

//从私钥计算公钥(符合Ethereum格式)
console.log("从私钥计算公钥：" + ethereumjs_util.bufferToHex(ethereumjs_util.privateToPublic(privKey)));