//处理客户注册的路由
var generateKey = require('../../public/javascripts/utils/ethereumUtils/generateKey');
var generateAccount = require('../../public/javascripts/utils/ethereumUtils/generateAccount');
var judgeNodeType = require('../../public/javascripts/utils/ethereumUtils/judgeNodeType');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

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

    console.log("请求参数："+ req.query.phone + "    " + req.query.password);

    if(judgeNodeType.nodeType == 0) {
        //testrpc
        // 可以使用椭圆曲线加密获得公私钥
        var keys = generateKey.generateKeys();
        console.log("qqqqqq=" + keys.publicKey);
        console.log("wwwwww=" + keys.privateKey);
        console.log("eeeeee=" + keys.accountAddress);
        global.contractInstance.registerManager(keys.accountAddress, req.query.phone, req.query.password, {from: web3.eth.coinbase, gas: 1600000}, function (error, result) {
            if (!error) {
                var eventRegisterManager = global.contractInstance.RegisterManager();
                eventRegisterManager.watch(function (error, result) {
                    console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                    var response = {
                        code: result.args.statusCode,
                        error: "",
                        result: result.args.message,
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
        generateAccount.generateAccounts(req.query.password, function (error, result) {
            console.log("1111111111111111111" + JSON.stringify(result));
            if (!error) {
                //以太坊创建账户成功
                //如果出现OOG，则添加gas参数
                //默认交易发起者还是web3.eth.accounts[0]；
                global.contractInstance.registerManager(result.account, req.query.phone, req.query.password, {from: web3.eth.coinbase, gas: 1600000}, function (error, result) {
                    if (!error) {
                        var eventRegisterManager = global.contractInstance.RegisterManager();
                        eventRegisterManager.watch(function (error, result) {
                            console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                            var response = {
                                code: result.args.statusCode,
                                error: "",
                                result: result.args.message,
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