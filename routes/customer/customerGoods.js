//处理用户查询已购买商品Id的路由
var express = require('express');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');

module.exports.query = function (req, res) {
    var phone = req.query.phone;
    console.log("用户手机：" + phone);

    global.contractInstance.getGoodsByCustomer(phone, function (error, result) {
        if (!error) {
            console.log("返回的商品数组长度：" + result.length);
            var goodArray = [];
            for (var i = 0; i < result.length; i++) {
                goodArray.push(commonUtils.hexCharCodeToStr(result[i]));
            }
            console.log("返回的商品数组：" + goodArray);
            var response = {
                code: 0,
                message: "查询信息成功",
                info: goodArray
            };
            res.send(JSON.stringify(response));
            res.end();
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