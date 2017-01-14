/**
 * Created by chenyufeng on 13/01/2017.
 */

var commonUtils = require('../commonUtils/commonUtils');
var mongoose = require('mongoose');
var Customer = mongoose.model('Customer');
var Merchant = mongoose.model('Merchant');
var Manager = mongoose.model('Manager');
var Good = mongoose.model('Good');
var Bank = mongoose.model('Bank');

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

//向数据库插入一件商品
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

//创建银行
module.exports.bankCreate = function (owner, totalIssuedScore, totalSettledScore) {
    //首先查找银行中是否已经存在数据，如果存在数据，则不执行操作；否则才创建
    Bank.find({}, function (error, result) {
        if (!error) {
            if (result.length === 0) {
                //没有查找结果，需要初始化银行数据
                var bank = new Bank({
                    owner: owner,
                    totalIssuedScore: totalIssuedScore,
                    totalSettledScore: totalSettledScore
                });
                bank.save(function (error) {
                    if (!error) {
                        console.log("银行在数据库中创建成功");
                    }
                    else {
                        console.log("银行在数据库中创建失败");
                    }
                });
            }
            else {
                //存在银行数据，不创建
            }
        }
        else {
            console.log("查找数据失败");
        }
    });
};