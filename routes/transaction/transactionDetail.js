/**
 * Created by chenyufeng on 16/01/2017.
 */
//查询交易记录的路由
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');
var LOG = require('../../public/javascripts/utils/commonUtils/LOG');

/**
 * 注意交易方法和Constant方法的调用，目前指定以下规范：
 * （1）Constant方法不发送from,gas参数；
 * （2）返回给前端的JSON中不包含txInfo（区块的交易信息）；
 *
 * （3）交易方法一定要发送from参数，如果发生OOG，才发送gas参数；
 * （4）返回给前端的JSON中一定要包含txInfo;
 */

/**
 * 状态码：
 * 0：成功
 * 1：失败
 *
 * @param req
 * txHash:交易hash
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.query = function (req, res) {
    var txHash = req.query.txHash;

    console.log(LOG.ETH_TRANSACTION_HASH + ":" + txHash);

    global.contractInstance.getTransaction(txHash, function (error, result) {
        if (!error) {
            console.log(LOG.CS_TX_STATE + ":" + result[1] + LOG.CS_SENDER_PHONE + ":" + commonUtils.hexCharCodeToStr(result[2]) +
                LOG.CS_RECEIVER_PHONE + ":" + commonUtils.hexCharCodeToStr(result[3]) + LOG.CS_SCORE_AMOUNT + ":" + result[4]);

            var obj = {
                txType: result[1],
                sender: commonUtils.hexCharCodeToStr(result[2]),
                receiver: commonUtils.hexCharCodeToStr(result[3]),
                score: result[4]
            };

            var response = {
                code: 0,
                error: "",
                result: obj,
                txInfo: "",
                requestInfo: req.originalUrl
            };

            res.send(JSON.stringify(response));
            res.end();
        }
        else {
            console.error(LOG.CS_CALL_CONTRACT_METHOD_FAILED + ":" + error);
            var response = {
                code: 1,
                error: error.toString(),
                result: "",
                txInfo: "",
                requestInfo: req.originalUrl
            };
            res.send(JSON.stringify(response));
            res.end();
        }
    });
};