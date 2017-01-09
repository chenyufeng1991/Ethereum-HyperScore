//处理商户上架一件商品的路由
var express = require('express');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

//web3初始化
var web3 = web3Instance.web3;

module.exports.add = function (req, res) {
    var phone = req.query.phone;
    var goodId = req.query.goodId;
    var goodName = req.query.goodName;
    var goodPrice = req.query.goodPrice;
    console.log("商户手机：" + phone + ";商品Id：" + goodId + ";商品名称：" + goodName + ";商品价格：" + goodPrice);

    global.contractInstance.addGood(phone, goodId, goodName, goodPrice, {from: web3.eth.coinbase, gas: 1000000}, function (error, result) {
        if (!error) {
            var eventAddGood = global.contractInstance.AddGood();
            eventAddGood.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    message: result.args.message,
                    txInfo: result
                };
                eventAddGood.stopWatching();
                res.send(JSON.stringify(response));
                res.end();
            });
        }
        else {
            console.log("发生错误：" + error);
            var response = {
                code: 1,
                message: error.toString(),
                info: ""
            };
            res.send(JSON.stringify(response));
            res.end();
        }
    });
};