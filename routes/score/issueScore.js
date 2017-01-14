//处理银行发行积分的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var daoUtils = require('../../public/javascripts/utils/daoUtils/daoUtils');

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

    var managerPhone = req.query.managerPhone;
    var customerPhone = req.query.customerPhone;
    var score = req.query.score;

    console.log("管理员账号：" + managerPhone + ";用户账号：" + customerPhone + ";积分数量：" + score);

    global.contractInstance.issueScore(managerPhone, customerPhone, score, {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventIssueScore = global.contractInstance.IssueScore();
            eventIssueScore.watch(function (error, result) {
                var statusCode = result.args.statusCode;
                var message = result.args.message;
                console.log("状态码：" + statusCode + ";消息：" + message);
                if(statusCode == 0) {
                    //更新数据库
                    daoUtils.issueScore(managerPhone, customerPhone, score);
                }
                var response = {
                    code: statusCode,
                    error: "",
                    result: message,
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
