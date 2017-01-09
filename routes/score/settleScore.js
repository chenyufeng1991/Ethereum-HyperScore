//处理商户与银行清算积分的路由
var express = require('express');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

//web3初始化
var web3 = web3Instance.web3;

module.exports.settle = function (req, res) {
    console.log("商户账号：" + req.query.phone + "积分数量：" + req.query.score);

    global.contractInstance.settleScore(req.query.phone, req.query.score, {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventSettleScore = global.contractInstance.SettleScore();
            eventSettleScore.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    message: result.args.message,
                    txInfo: result
                };
                eventSettleScore.stopWatching();
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