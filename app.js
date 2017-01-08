var express = require('express'); // 项目服务端使用express框架
var app = express();
var contractInstance = require('./public/javascripts/utils/ethereumUtils/contractInstance');

//主页
app.get('/', function (req, res) {
    console.log("HyperScore Main Page");
    res.send("HyperScore Main Page");
    res.end();
});

//银行管理员注册
var registerManager = require('./routes/manager/registerManager');
app.get('/registerManager', registerManager.register);

//客户注册
var registerCustomer = require('./routes/customer/registerCustomer');
app.get('/registerCustomer', registerCustomer.register);

//商户注册
var registerMerchant = require('./routes/merchant/registerMerchant');
app.get('/registerMerchant', registerMerchant.register);

//银行管理员登录
var loginManager = require('./routes/manager/loginManager');
app.get('/loginManager', loginManager.login);

//客户登录
var loginCustomer = require('./routes/customer/loginCustomer');
app.get('/loginCustomer', loginCustomer.login);

//商户登录
var loginMerchant = require('./routes/merchant/loginMerchant');
app.get('/loginMerchant', loginMerchant.login);

//银行管理员详细信息
var getManagerInfo = require('./routes/manager/getManagerInfo');
app.get('/getManagerInfo', getManagerInfo.query);

//查询客户详细信息
var getCustomerInfo = require('./routes/customer/getCustomerInfo');
app.get('/getCustomerInfo', getCustomerInfo.query);

//查询商户详细信息
var getMerchantInfo = require('./routes/merchant/getMerchantInfo');
app.get('/getMerchantInfo', getMerchantInfo.query);

//商户与银行清算积分
var settleScore = require('./routes/merchant/settleScore');
app.get('/settleScore', settleScore.settle);

//银行发行积分
var issueScore = require('./routes/manager/issueScore');
app.get('/issueScore', issueScore.issue);

//转让积分
var transferScore = require('./routes/transferScore');
app.get('/transferScore', transferScore.transfer);

//发布商品
var addGood = require('./routes/merchant/addGood');
app.get('/addGood', addGood.add);

//商户查询发布的商品数组
var getGoodsByMerchant = require('./routes/merchant/getGoodsByMerchant');
app.get('/getGoodsByMerchant', getGoodsByMerchant.query);

//购买商品
var buyGood = require('./routes/customer/buyGood');
app.get('/buyGood', buyGood.buy);


var server = app.listen(8000, function () {
    console.log("服务端地址为：http://localhost:8000");
});


