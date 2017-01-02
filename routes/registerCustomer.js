//处理客户注册的路由

var Web3 = require('web3');
var express = require('express');
var fs = require('fs');

//web3初始化
var web3;
if(typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

/**
 * 状态码说明：
 * 0：成功
 * 1：错误
 *
 */

/**
 * 返回JSON
 *
 * @param req
 * customerAddr:客户地址
 * password:客户密码
 *
 * @param res
 * code:状态码
 * message:消息
 * txInfo:区块链交易信息
 */
module.exports.register = function (req, res) {

    console.log("请求参数："+ req.query.customerAddr + "    " + req.query.password);

    //如果出现OOG，则添加gas参数
    global.contractInstance.registerCustomer(req.query.customerAddr, req.query.password, {from: web3.eth.accounts[0], gas: 1600000}, function (error, result) {
        if (!error) {
            var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
            eventRegisterCustomer.watch(function (error, result) {
                console.log(result.args.message);
                var response = {
                    code: 0,
                    message: result.args.message,
                    txInfo: result
                };
                eventRegisterCustomer.stopWatching();
                res.send(JSON.stringify(response));
                res.end();
            });
        }
        else {
            console.log("发生错误：" + error);
            var response = {
                code: 1,
                message: error.toString(),
                txInfo: ""
            };
            res.send(JSON.stringify(response));
            res.end();
        }
    });
};