var Web3 = require('web3');
var express = require('express');

//web3初始化
var web3;
if(typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

/**
 * 返回JSON
 * code：0成功   1失败
 * account :返回的公钥
 * message：消息
 *
 * @param password
 * @param callback
 */
function generateAccounts(password, callback) {
    web3.personal.newAccount(password, function (error, result) {
        var code;
        var account;
        var message;

        if(!error) {
            console.log("结果：" + result);
            code = 0;
            account = result;
            message = "以太坊创建账户成功";

            var response = {
                code: code,
                account: account,
                message: message
            };
            callback(null, response);
        }
        else {
            console.log("错误：" + error.toString());
            code = 1;
            account = "";
            message = error.toString();

            var response = {
                code: code,
                account: account,
                message: message
            };

            callback(error, response);
        }
    });
}

module.exports.generateAccounts = generateAccounts;