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
var managerRegister = require('./routes/manager/managerRegister');
app.post('/v1_0/user/manager/register', managerRegister.register);

//客户注册
var customerRegister = require('./routes/customer/customerRegister');
app.post('/v1_0/user/customer/register', customerRegister.register);

//商户注册
var merchantRegister = require('./routes/merchant/merchantRegister');
app.post('/v1_0/user/merchant/register', merchantRegister.register);

//银行管理员登录
var managerLogin = require('./routes/manager/managerLogin');
app.get('/v1_0/user/manager/login', managerLogin.login);

//客户登录
var customerLogin = require('./routes/customer/customerLogin');
app.get('/v1_0/user/customer/login', customerLogin.login);

//商户登录
var merchantLogin = require('./routes/merchant/merchantLogin');
app.get('/v1_0/user/merchant/login', merchantLogin.login);

//银行管理员详细信息
var managerDetail = require('./routes/manager/managerDetail');
app.get('/v1_0/user/manager/detail', managerDetail.query);

//查询客户详细信息
var customerDetail = require('./routes/customer/customerDetail');
app.get('/v1_0/user/customer/detail', customerDetail.query);

//查询商户详细信息
var merchantDetail = require('./routes/merchant/merchantDetail');
app.get('/v1_0/user/merchant/detail', merchantDetail.query);

//商户与银行清算积分
var settleScore = require('./routes/score/settleScore');
app.post('/v1_0/score/settle', settleScore.settle);

//银行发行积分
var issueScore = require('./routes/score/issueScore');
app.post('/v1_0/score/issue', issueScore.issue);

//转让积分
var transferScore = require('./routes/score/transferScore');
app.post('/v1_0/score/transfer', transferScore.transfer);

//发布商品
var addGood = require('./routes/merchant/addGood');
app.post('/addGood', addGood.add);

//商户查询发布的商品数组
var getGoodsByMerchant = require('./routes/merchant/getGoodsByMerchant');
app.get('/getGoodsByMerchant', getGoodsByMerchant.query);

//购买商品
var buyGood = require('./routes/customer/buyGood');
app.post('/buyGood', buyGood.buy);

//用户查询已经购买商品的数组
var getGoodsByCustomer = require('./routes/customer/getGoodsByCustomer');
app.get('/getGoodsByCustomer', getGoodsByCustomer.query);

app.listen(8000, function () {
    console.log("服务器开启，地址为：http://localhost:8000");
});


