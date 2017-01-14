//处理客户注册的路由
var generateKey = require('../../public/javascripts/utils/ethereumUtils/generateKey');
var generateAccount = require('../../public/javascripts/utils/ethereumUtils/generateAccount');
var judgeNodeType = require('../../public/javascripts/utils/ethereumUtils/judgeNodeType');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');
var daoUtils = require('../../public/javascripts/utils/daoUtils/daoUtils');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 状态码说明：
 * 0：成功
 * 1：错误
 *
 */

/**
 * 返回JSON
 *
 * @param req
 * phone:管理员手机
 * password:管理员密码
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.register = function (req, res) {

    var phone = req.query.phone;
    var password = req.query.password;

    console.log("手机号码："+ phone + "；密码：" + password);

    if(judgeNodeType.nodeType == 0) {
        //testrpc
        // 可以使用椭圆曲线加密获得公私钥
        var keys = generateKey.generateKeys();
        console.log("公钥：" + keys.publicKey + "；私钥：" + keys.privateKey + "; 生成账户：" + keys.accountAddress);
        var accountAddress = keys.accountAddress;
        global.contractInstance.registerManager(accountAddress, phone, commonUtils.toMD5(password), {from: web3.eth.coinbase, gas: 1600000}, function (error, result) {
            if (!error) {
                var eventRegisterManager = global.contractInstance.RegisterManager();
                eventRegisterManager.watch(function (error, result) {
                    var statusCode = result.args.statusCode;
                    var message = result.args.message;
                    console.log("状态码：" + statusCode + "；消息：" + message);
                    if(statusCode == 0) {
                        daoUtils.managerInsert(accountAddress, phone, password);
                    }
                    var response = {
                        code: statusCode,
                        error: "",
                        result: message,
                        txInfo: result,
                        requestUrl: req.originalUrl
                    };
                    eventRegisterManager.stopWatching();
                    res.send(JSON.stringify(response));
                    res.end();
                });
            }
            else {
                console.log("发生错误：" + error);
                var response = {
                    code: 1,
                    error: error.toString(),
                    result: "",
                    txInfo: "",
                    requestUrl: req.originalUrl
                };
                res.send(JSON.stringify(response));
                res.end();
            }
        });
    }
    else {
        //geth
        //可以使用web3.js API生成以太坊账户
        generateAccount.generateAccounts(commonUtils.toMD5(password), function (error, result) {
            var accountAddress = result.account;
            console.log("geth生成账户结果:" + JSON.stringify(result));
            if (!error) {
                //以太坊创建账户成功
                //如果出现OOG，则添加gas参数
                //默认交易发起者还是web3.eth.accounts[0]；
                global.contractInstance.registerManager(accountAddress, phone, commonUtils.toMD5(password), {from: web3.eth.coinbase, gas: 1600000}, function (error, result) {
                    if (!error) {
                        var eventRegisterManager = global.contractInstance.RegisterManager();
                        eventRegisterManager.watch(function (error, result) {
                            var statusCode = result.args.statusCode;
                            var message = result.args.message;
                            console.log("状态码：" + statusCode + ";消息：" + message);
                            if(statusCode == 0) {
                                daoUtils.managerInsert(accountAddress, phone, password);
                            }
                            var response = {
                                code: statusCode,
                                error: "",
                                result: message,
                                txInfo: result,
                                requestUrl: req.originalUrl
                            };
                            eventRegisterManager.stopWatching();
                            res.send(JSON.stringify(response));
                            res.end();
                        });
                    }
                    else {
                        console.log("发生错误：" + error);
                        var response = {
                            code: 1,
                            error: error.toString(),
                            result: "",
                            txInfo: "",
                            requestUrl: req.originalUrl
                        };
                        res.send(JSON.stringify(response));
                        res.end();
                    }
                });
            }
            else {
                //以太坊创建账户失败
                var response = {
                    code: 1,
                    error: error.toString(),
                    result: "",
                    txInfo: "",
                    requestUrl: req.originalUrl
                };
                res.send(JSON.stringify(response));
                res.end();
            }
        });
    }
};