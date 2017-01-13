/**
 * Created by chenyufeng on 13/01/2017.
 */

var commonUtils = require('../commonUtils/commonUtils');
var mongoose = require('mongoose');
var Customer = mongoose.model('Customer');

//向数据库中插入一个客户
module.exports.customerInsert = function (address, phone, password) {
    //存储数据库
    var customer = new Customer({
        address: address,
        phone: phone,
        password: commonUtils.toMD5(password),
        score: 0,
        buyGoods: []
    });
    customer.save(function (error) {
        if(!error) {
            console.log("客户插入数据库成功");
        }
        else {
            console.log("客户插入数据库失败");
        }
    });
};

