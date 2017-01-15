var express = require('express');
var web3Instance = require('./web3Instance');
var LOG = require('../commonUtils/LOG');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 返回JSON
 * code：0成功   1失败
 * account :返回的公钥
 * message：消息
 *
 * @param password
 * @param callback
 */
module.exports.generateAccounts = function (password, callback) {
    web3.personal.newAccount(password, function (error, result) {
        var code;
        var account;
        var message;

        if (!error) {
            console.log(LOG.ETH_GETH_ACCOUNT_RESULT + ":" + result);
            code = 0;
            account = result;
            message = LOG.ETH_GETH_CREATE_ACCOUNT_SUCCESS;

            var response = {
                code: code,
                account: account,
                message: message
            };
            callback(null, response);
        }
        else {
            console.log(LOG.ETH_GETH_CREATE_ACCOUNT_FAILED + ":" + error.toString());
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
};