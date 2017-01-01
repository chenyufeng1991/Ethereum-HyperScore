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
 *
 * @param req
 * customerAddr:客户地址
 * password:客户密码
 *
 * @param res
 * code:状态码
 * message:消息
 */
module.exports.register = function (req, res) {

    console.log("请求参数："+ req.query.customerAddr + "    " + req.query.password);
    console.log("baseUrl:" + req.baseUrl);
    console.log("hostname:" + req.hostname);
    console.log("originalUrl:" + req.originalUrl);
    console.log("params:" + req.params);
    console.log("path:" + req.path);

    //如果出现OOG，则添加gas参数
    global.contractInstance.registerCustomer(req.query.customerAddr, req.query.password, {from: web3.eth.accounts[0], gas:1000000}, function (error, result) {
        if(error) {
            console.log("发生错误：" + error);
        }
    });
    var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
    eventRegisterCustomer.watch(function (error, result) {
        console.log(result.args.message);
        eventRegisterCustomer.stopWatching();
        res.send(result.args.message);
        res.end();
    });




};