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
        if (!error) {
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
        if (!error) {
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
        if (!error) {
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
        if (!error) {
            console.log("商品插入数据库成功");
            //同时把该件商品添加到商户的sellGoods数组
            Merchant.findOne({phone: merchantPhone}, function (error, result) {
                result.sellGoods.push(goodId);
                result.save();
            });
        }
        else {
            console.log("商品插入数据库失败");
        }
    });
};

//创建银行
/**
 * 注意mongodb中find和findOne的区别：
 * -- find:如果找到result则返回数组(length大于等于1)，否则返回0数组；
 * -- findOne:如果找到result则返回model模型，否则返回null;
 *
 * @param owner
 * @param totalIssuedScore
 * @param totalSettledScore
 */
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

//发行积分
//需要使用parseInt()转换数据类型
module.exports.issueScore = function (managerPhone, customerPhone, score) {
    Manager.findOne({phone: managerPhone}, function (error, result) {
        if (!error) {
            result.issuedScore += parseInt(score);
            result.save();
        }
    });
    Bank.findOne({}, function (error, result) {
        if (!error) {
            result.totalIssuedScore += parseInt(score);
            result.save();
        }
    });
    Customer.findOne({phone: customerPhone}, function (error, result) {
        if (!error) {
            result.score += parseInt(score);
            result.save();
        }
    });
};

//转让积分
/**
 * 注意这里的转移策略，如果一个手机号同时注册为客户和商户，向这个手机号转让积分时，会默认转移到客户的这个账户
 * @param senderType
 * @param sender
 * @param receiver
 * @param score
 */
module.exports.transferScore = function (senderType, sender, receiver, score) {
    //使用==判断，而不是===;因为传递进来的一般是String，所以必然不是严格等于0的，所以判断会失败；
    if (senderType == 0) {
        //发送者为客户
        Customer.findOne({phone: sender}, function (error, result) {
            result.score -= parseInt(score);
            result.save();
        });
        Customer.findOne({phone: receiver}, function (error, result) {
            if (!error) {
                if (result != null) {
                    //由客户接收
                    result.score += parseInt(score);
                    result.save();
                }
                else {
                    //由商户接收
                    Merchant.findOne({phone: receiver}, function (error, result) {
                        result.score += parseInt(score);
                        result.save();
                    });
                }
            }
        });
    }
    else {
        //发送者为商户
        Merchant.findOne({phone: sender}, function (error, result) {
            result.score -= parseInt(score);
            result.save();
        });
        Customer.findOne({phone: receiver}, function (error, result) {
            if (!error) {
                if (result != null) {
                    //由客户接收
                    result.score += parseInt(score);
                    result.save();
                }
                else {
                    //由商户接收
                    Merchant.findOne({phone: receiver}, function (error, result) {
                        result.score += parseInt(score);
                        result.save();
                    });
                }
            }
        });
    }
};

//积分清算
module.exports.settleScore = function (phone, score) {
    Merchant.findOne({phone: phone}, function (error, result) {
        if(!error) {
            result.score -= parseInt(score);
            result.save();
        }
    });
    Bank.findOne({}, function (error, result) {
        if(!error) {
            result.totalSettledScore += parseInt(score);
            result.save();
        }
    });
};
