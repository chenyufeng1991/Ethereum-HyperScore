//处理用户购买一件商品的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

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
    console.log("用户手机：" + phone + ";商品Id：" + goodId);

    global.contractInstance.buyGood(phone, goodId, {from: web3.eth.coinbase, gas: 1000000}, function (error, result) {
        if (!error) {
            var eventBuyGood = global.contractInstance.BuyGood();
            eventBuyGood.watch(function (error, result) {
                var statusCode = result.args.statusCode;
                var message = result.args.message;
                console.log("状态码：" + statusCode + ";消息：" + message);
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
};