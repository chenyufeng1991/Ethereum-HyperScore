//处理银行发行积分的路由
var express = require('express');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 返回码说明：
 * 0：成功；
 * 1：失败；
 *
 *
 *
 * @param req
 * phone：用户手机
 * score: 发行的积分数量
 *
 * @param res
 * code:状态码
 * message:消息
 * txInfo:区块链交易信息
 */
module.exports.issue = function (req, res) {
    console.log("管理员账号：" + req.query.managerPhone + "用户账号：" + req.query.customerPhone + "积分数量：" + req.query.score);

    global.contractInstance.issueScore(req.query.managerPhone, req.query.customerPhone, req.query.score, {from: web3.eth.accounts[0]}, function (error, result) {
        if (!error) {
            var eventIssueScore = global.contractInstance.IssueScore();
            eventIssueScore.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    message: result.args.message,
                    txInfo: result
                };
                eventIssueScore.stopWatching();
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
