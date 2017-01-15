//处理客户登录的路由
var web3Instance = require('../../public/javascripts/utils/ethereumUtils/web3Instance');
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
    console.log("手机号码：" + phone + "；密码：" + password);
    global.contractInstance.loginCustomer(phone, commonUtils.toMD5(password), {from: web3.eth.coinbase}, function (error, result) {
        if (!error) {
            var eventLoginCustomer = global.contractInstance.LoginCustomer();
            eventLoginCustomer.watch(function (error, result) {
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
                eventLoginCustomer.stopWatching();
                res.send(JSON.stringify(response));
                res.end();
            });
        }
        else {
            console.error("发生错误：" + error);
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