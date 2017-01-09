//处理用户购买一件商品的路由
var express = require('express');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

//web3初始化
var web3 = web3Instance.web3;

module.exports.buy = function (req, res) {
    var phone = req.query.phone;
    var goodId = req.query.goodId;
    console.log("用户手机：" + phone + ";商品Id：" + goodId);

    global.contractInstance.buyGood(phone, goodId, {from: web3.eth.coinbase, gas:1000000}, function (error, result) {
        if (!error) {
            var eventBuyGood = global.contractInstance.BuyGood();
            eventBuyGood.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    message: result.args.message,
                    txInfo: result
                };
                eventBuyGood.stopWatching();
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