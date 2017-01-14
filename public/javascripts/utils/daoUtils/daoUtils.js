/**
 * Created by chenyufeng on 13/01/2017.
 */

var commonUtils = require('../commonUtils/commonUtils');
var mongoose = require('mongoose');
var Customer = mongoose.model('Customer');
var Merchant = mongoose.model('Merchant');
var Manager = mongoose.model('Manager');
var Good = mongoose.model('Good');

//向数据库中插入一个客户
module.exports.customerInsert = function (customerAddr, phone, password) {
    //存储数据库
    var customer = new Customer({
        customerAddr: customerAddr,
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

//向数据库中插入一个商户
module.exports.merchantInsert = function (merchantAddr, phone, password) {
    //存储数据库
    var merchant = new Merchant({
        merchantAddr: merchantAddr,
        phone: phone,
        password: commonUtils.toMD5(password),
        score: 0,
        sellGoods: []
    });

    merchant.save(function (error) {
        if(!error) {
            console.log("商户插入数据库成功");
        }
        else {
            console.log("商户插入数据库失败");
        }
    });
};

//向数据库中插入一个商户
module.exports.managerInsert = function (managerAddr, phone, password) {
    //存储数据库
    var manager = new Manager({
        managerAddr: managerAddr,
        phone: phone,
        password: commonUtils.toMD5(password),
        issuedScore: 0
    });

    manager.save(function (error) {
        if(!error) {
            console.log("管理员插入数据库成功");
        }
        else {
            console.log("管理员插入数据库失败");
        }
    });
};

module.exports.goodInsert = function (goodId, goodName, goodPrice, merchantPhone) {
    //存储数据库
    var good = new Good({
        goodId: goodId,
        goodName: goodName,
        goodPrice: goodPrice,
        merchantPhone: merchantPhone
    });

    good.save(function (error) {
        if(!error) {
            console.log("商品插入数据库成功");
        }
        else {
            console.log("商品插入数据库失败");
        }
    });
};
