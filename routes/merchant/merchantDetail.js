//处理商户查询详情的路由
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');

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

    console.log("请求参数：" + req.query.phone);
    global.contractInstance.getMerchantInfo(req.query.phone, function (error, result) {
        if (!error) {
            console.log("商户address： " + result[0] + "商户手机：" + commonUtils.hexCharCodeToStr(result[1]) + "积分余额：" + result[2]);

            var obj = {
                address: result[0],
                phone: commonUtils.hexCharCodeToStr(result[1]),
                score: result[2]
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
            console.log("发生错误：" + error);
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