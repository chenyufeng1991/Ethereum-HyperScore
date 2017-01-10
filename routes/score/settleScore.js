//处理商户与银行清算积分的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 返回码说明：
 * 0：成功；
 * 1：失败；
 *
 *
 *
 * @param req
 * phone：用户手机
 * score: 清算的积分数量
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.settle = function (req, res) {
    console.log("商户账号：" + req.query.phone + "积分数量：" + req.query.score);

    global.contractInstance.settleScore(req.query.phone, req.query.score, {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventSettleScore = global.contractInstance.SettleScore();
            eventSettleScore.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    error: "",
                    result: result.args.message,
                    txInfo: result,
                    requestUrl: req.originalUrl
                };
                eventSettleScore.stopWatching();
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