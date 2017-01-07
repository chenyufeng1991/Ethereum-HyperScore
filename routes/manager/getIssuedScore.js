//处理银行查询发行积分的路由
var express = require('express');

module.exports.query = function (req, res) {

    global.contractInstance.getIssuedScore(function (error, result) {

        if(!error) {
            console.log(result);

            var response = {
                code: 0,
                message: "查询已发行积分成功",
                score: result.toString()
            };
            res.send(JSON.stringify(response));
            res.end();
        }
        else {
            console.log("发生错误：" + error);
            var response = {
                code: 1,
                message: error.toString(),
                score: ""
            };
            res.send(JSON.stringify(response));
            res.end();
        }
    });
};