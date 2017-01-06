//处理客户注册的路由

var Web3 = require('web3');
var express = require('express');
var fs = require('fs');
var generateKey = require('../public/javascripts/utils/generateKey');
var generateAccount = require('../public/javascripts/utils/generateAccount');
var judgeNodeType = require('../public/javascripts/utils/judgeNodeType');

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
 * phone:客户手机
 * password:客户密码
 *
 * @param res
 * code:状态码
 * message:消息
 * txInfo:区块链交易信息
 */
module.exports.register = function (req, res) {

    console.log("请求参数："+ req.query.phone + "    " + req.query.password);

    if(judgeNodeType.nodeType == 0) {
        //testrpc
        // 可以使用椭圆曲线加密获得公私钥
        var keys = generateKey.generateKeys();
        console.log("qqqqqq=" + keys.publicKey);
        console.log("wwwwww=" + keys.privateKey);
        console.log("eeeeee=" + keys.accountAddress);
        global.contractInstance.registerCustomer(keys.accountAddress, req.query.phone, req.query.password, {from: web3.eth.accounts[0], gas: 1600000}, function (error, result) {
            if (!error) {
                var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
                eventRegisterCustomer.watch(function (error, result) {
                    console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                    var response = {
                        code: result.args.statusCode,
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
    }
    else {
        //geth
        //可以使用web3.js API生成以太坊账户
        generateAccount.generateAccounts(req.query.password, function (error, result) {
            console.log("1111111111111111111" + JSON.stringify(result));
            if (result.code == 0) {
                //以太坊创建账户成功
                //如果出现OOG，则添加gas参数
                //默认交易发起者还是web3.eth.accounts[0]；
                global.contractInstance.registerCustomer(result.account, req.query.phone, req.query.password, {from: web3.eth.accounts[0], gas: 1600000}, function (error, result) {
                    if (!error) {
                        var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
                        eventRegisterCustomer.watch(function (error, result) {
                            console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                            var response = {
                                code: result.args.statusCode,
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
            }
            else {
                //以太坊创建账户失败
                var response = {
                    code: 1,
                    message: result.message,
                    txInfo: ""
                };
                res.send(JSON.stringify(response));
                res.end();
            }
        });
    }
};