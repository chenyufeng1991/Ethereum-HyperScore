//处理银行发行积分的路由
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
 * score: 发行的积分数量
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.issue = function (req, res) {
    console.log("管理员账号：" + req.query.managerPhone + "用户账号：" + req.query.customerPhone + "积分数量：" + req.query.score);

    global.contractInstance.issueScore(req.query.managerPhone, req.query.customerPhone, req.query.score, {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventIssueScore = global.contractInstance.IssueScore();
            eventIssueScore.watch(function (error, result) {
                console.log("状态码：" + result.args.statusCode + "消息：" + result.args.message);
                var response = {
                    code: result.args.statusCode,
                    error: "",
                    result: result.args.message,
                    txInfo: result,
                    requestUrl: req.originalUrl
                };
                eventIssueScore.stopWatching();
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
