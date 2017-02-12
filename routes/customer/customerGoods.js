//处理用户查询已购买商品Id的路由
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
    var pageNum = req.query.pageNum;
    console.log(LOG.CS_PHONE + ":" + phone + "；第几页：" + pageNum);

    global.contractInstance.getGoodsByCustomer(phone, function (error, result) {
        if (!error) {
            console.log("返回的商品数组长度：" + result.length);
            var goodArray = [];
            var totalPage = 0;
            if(result.length % 10 == 0) {
                totalPage = result.length / 10;
            }
            else {
                totalPage = parseInt(result.length / 10) + 1;
            }
            pageNum--;
            for (var i = 10 * pageNum; i < result.length && i < 10 * pageNum + 10; i++) {
                goodArray.push(commonUtils.hexCharCodeToStr(result[i]));
            }
            console.log("返回的商品数组：" + goodArray);
            var obj = {
                goodArray: goodArray,
                totalPage: totalPage
            };
            var response = {
                code: 0,
                error: "",
                result: obj,
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