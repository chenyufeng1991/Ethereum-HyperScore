//处理商户查询所有商品Id的路由
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');
var LOG = require('../../public/javascripts/utils/commonUtils/LOG');

/**
 * 状态码：
 * 0：成功
 * 1：失败
 *
 * @param req
 * phone:手机号
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.query = function (req, res) {
    var phone = req.query.phone;
    console.log(LOG.CS_PHONE + ":" + phone);

    global.contractInstance.getGoodsByMerchant(phone, function (error, result) {
        if (!error) {
            console.log("返回的商品数组长度：" + result.length);
            var goodArray = [];
            for (var i = 0; i < result.length; i++) {
                goodArray.push(commonUtils.hexCharCodeToStr(result[i]));
            }
            console.log("返回的商品数组：" + goodArray);
            var response = {
                code: 0,
                error: "",
                result: goodArray,
                txInfo: "",
                requestUrl: req.originalUrl
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
                requestUrl: req.originalUrl
            };
            res.send(JSON.stringify(response));
            res.end();
        }
    });
};