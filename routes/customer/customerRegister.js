//处理客户注册的路由
var generateKey = require('../../public/javascripts/utils/ethereumUtils/generateKey');
var generateAccount = require('../../public/javascripts/utils/ethereumUtils/generateAccount');
var judgeNodeType = require('../../public/javascripts/utils/ethereumUtils/judgeNodeType');
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');
var daoUtils = require('../../public/javascripts/utils/daoUtils/daoUtils');
var LOG = require('../../public/javascripts/utils/commonUtils/LOG');

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
 * phone:客户手机
 * password:客户密码
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
    var timeStamp = Date.now();

    console.log(LOG.CS_PHONE + ":" + phone + LOG.CS_PASSWORD + ":" + password);
    if (judgeNodeType.nodeType == 0) {
        //testrpc
        // 可以使用椭圆曲线加密获得公私钥
        var keys = generateKey.generateKeys();
        console.log(LOG.ETH_ECC_PUBLIC_KEY + ":" + keys.publicKey + LOG.ETH_ECC_PRIVATE_KEY + ":" +
            keys.privateKey + LOG.ETH_ECC_ACCOUNT + ":" + keys.accountAddress);
        var accountAddress = keys.accountAddress;

        global.contractInstance.registerCustomer(accountAddress, phone, commonUtils.toMD5(password + timeStamp), timeStamp, {
            from: web3.eth.coinbase,
            gas: 1600000
        }, function (error, result) {
            if (!error) {
                var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
                eventRegisterCustomer.watch(function (error, result) {
                    var statusCode = result.args.statusCode;
                    var message = result.args.message;
                    console.log(LOG.CS_CONTRACT_STATUS_CODE + ":" + statusCode + LOG.CS_CONTRACT_EVENT_MESSAGE + ":" + message);
                    if (statusCode == 0) {
                        //该客户在区块链注册成功，插入数据库
                        daoUtils.customerInsert(accountAddress, phone, commonUtils.toMD5(password + timeStamp), timeStamp);
                    }
                    var response = {
                        code: statusCode,
                        error: "",
                        result: message,
                        txInfo: result,
                        requestUrl: req.originalUrl
                    };
                    eventRegisterCustomer.stopWatching();
                    res.send(JSON.stringify(response));
                    res.end();
                });
            }
            else {
                console.error(LOG.CS_CALL_CONTRACT_METHOD_FAILED + ":" + error);
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
            if (!error) {
                var accountAddress = result.account;
                console.log(LOG.ETH_GETH_ACCOUNT_RESULT + ":" + JSON.stringify(result));
                //以太坊创建账户成功
                //如果出现OOG，则添加gas参数
                //默认交易发起者还是web3.eth.accounts[0]；
                global.contractInstance.registerCustomer(accountAddress, phone, commonUtils.toMD5(password), {
                    from: web3.eth.coinbase,
                    gas: 1600000
                }, function (error, result) {
                    if (!error) {
                        var eventRegisterCustomer = global.contractInstance.RegisterCustomer();
                        eventRegisterCustomer.watch(function (error, result) {
                            var statusCode = result.args.statusCode;
                            var message = result.args.message;
                            console.log(LOG.CS_CONTRACT_STATUS_CODE + ":" + statusCode + LOG.CS_CONTRACT_EVENT_MESSAGE + ":" + message);
                            if (statusCode == 0) {
                                //该客户在区块链注册成功，插入数据库
                                daoUtils.customerInsert(accountAddress, phone, password);
                            }
                            var response = {
                                code: statusCode,
                                error: "",
                                result: message,
                                txInfo: result,
                                requestUrl: req.originalUrl
                            };
                            eventRegisterCustomer.stopWatching();
                            res.send(JSON.stringify(response));
                            res.end();
                        });
                    }
                    else {
                        console.error(LOG.CS_CALL_CONTRACT_METHOD_FAILED + ":" + error);
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
                console.error(LOG.ETH_GETH_CREATE_ACCOUNT_FAILED);
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