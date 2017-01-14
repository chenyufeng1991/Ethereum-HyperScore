/**
 * Created by chenyufeng on 13/01/2017.
 */
var express = require('express');
var app = express();

//DAO
var connectMongoDB = require('../dao/connectDAO');
connectMongoDB.connect(); //连接数据库
var mongoose = require('mongoose');
var Customer = mongoose.model('Customer');

app.get('/', function (req, res, next) {
    var customer = new Customer({
        address: "0x222b0a38120ee113f05c35bc198f17a4a009bcc2",
        phone: "18710498511",
        password: "123456",
        score: 3000,
        buyGoods: ["we", "are", "winner"]
    });
    customer.save(function (error) {
        if (!error) {
            Customer.find({}, function (error, result) {
                if (!error) {
                    res.send(JSON.stringify(result));
                }
                else {
                    res.send("error");
                }
                res.end();
            });
        }
    });
});

app.listen(8888, function () {
    console.log("start server...");
});