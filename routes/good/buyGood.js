//处理用户购买一件商品的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var daoUtils = require('../../public/javascripts/utils/daoUtils/daoUtils');
var LOG = require('../../public/javascripts/utils/commonUtils/LOG');
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 返回码说明：
 * 0：成功；
 * 1：失败；
 *
 * @param req
 * phone:手机号码；
 * goodId:商品Id；
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.buy = function (req, res) {
    var phone = req.query.phone;
    var goodId = req.query.goodId;
    console.log(LOG.CS_PHONE + ":" + phone + LOG.CS_GOOD_ID + ":" + goodId);

    global.contractInstance.buyGood(phone, goodId, {from: web3.eth.coinbase, gas: 1000000}, function (error, result) {
        if (!error) {
            var eventBuyGood = global.contractInstance.BuyGood();
            eventBuyGood.watch(function (error, result) {
                var statusCode = result.args.statusCode;
                var message = result.args.message;
                var goodPrice = result.args.goodPrice;
                var merchantPhone = result.args.merchantPhone;
                var txHash = result.transactionHash;
                console.log(LOG.CS_CONTRACT_STATUS_CODE + ":" + statusCode +
                    LOG.CS_CONTRACT_EVENT_MESSAGE + ":" + message + LOG.CS_GOOD_PRICE + ":" + goodPrice +
                    LOG.CS_MERCHANT_PHONE + ":" + commonUtils.hexCharCodeToStr(merchantPhone));
                if (statusCode == 0) {
                    //更新数据库
                    daoUtils.buyGood(phone, goodId);

                    //区块链插入交易记录
                    global.contractInstance.addTransaction(txHash, 3, phone, commonUtils.hexCharCodeToStr(merchantPhone), goodPrice, {
                        from: web3.eth.coinbase,
                        gas: 1000000
                    }, function (error, result) {
                        if (!error) {
                            var eventAddTransaction = global.contractInstance.AddTransaction();
                            eventAddTransaction.watch(function (error, result) {
                                var statusCode = result.args.statusCode;
                                var message = result.args.message;
                                if (statusCode == 0) {
                                    //交易插入数据库
                                    daoUtils.addTransaction(txHash, 3, phone, commonUtils.hexCharCodeToStr(merchantPhone), goodPrice);
                                }
                                console.log(LOG.CS_CONTRACT_STATUS_CODE + ":" + statusCode + LOG.CS_CONTRACT_EVENT_MESSAGE + ":" + message);
                                eventAddTransaction.stopWatching();
                            });
                        }
                        else {
                            console.error(LOG.CS_CALL_CONTRACT_METHOD_FAILED + ":" + error);
                        }
                    });
                }
                var response = {
                    code: statusCode,
                    error: "",
                    result: message,
                    txInfo: result,
                    requestUrl: req.originalUrl
                };
                eventBuyGood.stopWatching();
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
};