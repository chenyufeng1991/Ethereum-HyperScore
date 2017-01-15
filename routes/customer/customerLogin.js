//处理客户登录的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
var commonUtils = require('../../public/javascripts/utils/commonUtils/commonUtils');
var LOG = require('../../public/javascripts/utils/commonUtils/LOG');

//web3初始化
var web3 = web3Instance.web3;

/**
 * 返回码说明：
 * 0：成功；
 * 1：失败；
 *
 * @param req
 * phone:手机号码；
 * password:密码；
 *
 * @param res
 * code:状态码
 * error:错误消息
 * result:返回信息
 * txInfo:区块链交易信息
 * requestUrl:请求url的path
 */
module.exports.login = function (req, res) {

    var phone = req.query.phone;
    var password = req.query.password;
    console.log(LOG.CS_PHONE + ":" + phone + LOG.CS_PASSWORD + ":" + password);
    global.contractInstance.loginCustomer(phone, commonUtils.toMD5(password), {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventLoginCustomer = global.contractInstance.LoginCustomer();
            eventLoginCustomer.watch(function (error, result) {
                var statusCode = result.args.statusCode;
                var message = result.args.message;
                console.log(LOG.CS_CONTRACT_STATUS_CODE + ":" + statusCode + LOG.CS_CONTRACT_EVENT_MESSAGE + ":" + message);
                var response = {
                    code: statusCode,
                    error: "",
                    result: message,
                    txInfo: result,
                    requestUrl: req.originalUrl
                };
                eventLoginCustomer.stopWatching();
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