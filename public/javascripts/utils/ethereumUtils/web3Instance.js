var Web3 = require('web3');
var config = require('../../config/config');

//web3初始化
var web3;
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider(config.clientUrl));
}

module.exports.web3 = web3;