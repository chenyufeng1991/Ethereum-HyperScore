var crypto = require('crypto');
var ethereumjs_util = require('ethereumjs-util');
var LOG = require('../commonUtils/LOG');

/**
 曲线类型：
 sect163k1 (1), sect163r1 (2),sect163r2 (3),
 sect193r1 (4), sect193r2 (5),sect233k1 (6),
 sect233r1 (7), sect239k1 (8),sect283k1 (9),
 sect283r1 (10), sect409k1 (11),sect409r1 (12),
 sect571k1 (13), sect571r1 (14),secp160k1 (15),
 secp160r1 (16), secp160r2 (17),secp192k1 (18),
 secp192r1 (19), secp224k1 (20),secp224r1 (21),
 secp256k1 (22), secp256r1 (23),secp384r1 (24),
 secp521r1 (25),
 *
 * 以太坊中是默认使用secp256k1
 */

module.exports.generateKeys = function generateKeys() {
    //公私钥对需要保存在数据库中
    var privateKey = crypto.randomBytes(32);
    var publicKey = ethereumjs_util.privateToPublic(privateKey);
    var accountAddress = ethereumjs_util.privateToAddress(privateKey);
    console.log(LOG.ETH_ECC_PUBLIC_KEY + ":" + ethereumjs_util.bufferToHex(publicKey));
    console.log(LOG.ETH_ECC_PRIVATE_KEY + ":" + ethereumjs_util.bufferToHex(privateKey));
    console.log(LOG.ETH_ECC_ACCOUNT + ":" + ethereumjs_util.bufferToHex(accountAddress));

    var keys = {
        publicKey: ethereumjs_util.bufferToHex(publicKey),
        privateKey: ethereumjs_util.bufferToHex(privateKey),
        accountAddress: ethereumjs_util.bufferToHex(accountAddress)
    };
    return keys;
};