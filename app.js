var express = require('express'); // 项目服务端使用express框架
var app = express();
var path = require('path');
var fs = require('fs');
var config = require('./public/javascripts/config/config');
var LOG = require('./public/javascripts/utils/commonUtils/LOG');

var http = require('http');
var https = require('https');

var privateKey  = fs.readFileSync(path.join(__dirname, './certificate/private.pem'), 'utf8');
var certificate = fs.readFileSync(path.join(__dirname, './certificate/file.crt'), 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
var PORT = config.PORT;
var SSLPORT = config.SSLPORT;

httpServer.listen(PORT, function() {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});

httpsServer.listen(SSLPORT, function() {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});

//web3
var contractInstance = require('./public/javascripts/utils/ethereumUtils/contractInstance');
contractInstance.createInstance(false); //是否使用迁移后的新合约
var web3Instance = require('./public/javascripts/utils/ethereumUtils/web3Instance');
var web3 = web3Instance.web3;

//DAO
var connectDAO = require('./public/javascripts/dao/connectDAO');
connectDAO.connect(); //连接数据库
var daoUtils = require('./public/javascripts/utils/daoUtils/daoUtils');
daoUtils.bankCreate(web3.eth.coinbase, 0, 0);

//log4js
var log4js = require('log4js');
var log4jsConfig = require('./public/javascripts/config/log4jsConfig');
log4js.configure(log4jsConfig.config(path.join(__dirname, './log/hyperscore.log')));
app.use(log4js.connectLogger(log4jsConfig.logger, {
    level: log4jsConfig.connectLogLevel,
    format: log4jsConfig.connectLogFormat
}));

//主页
app.get('/', function (req, res) {
    if(req.protocol === 'https') {
        res.status(200).send('This is https visit!');
    }
    else {
        res.status(200).send('This is http visit!');
    }
});

//中间件，所有的路由都经过这里，可以起到过滤器的作用
app.use('*', function (req, res, next) {
    console.log("所有路由都经过这里");
    next();
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
var addGood = require('./routes/good/addGood');
app.post('/v1_0/good/add', addGood.add);

//商户查询发布的商品数组
var merchantGoods = require('./routes/merchant/merchantGoods');
app.get('/v1_0/user/merchant/goods', merchantGoods.query);

//购买商品
var buyGood = require('./routes/good/buyGood');
app.post('/v1_0/good/buy', buyGood.buy);

//用户查询已经购买商品的数组
var customerGoods = require('./routes/customer/customerGoods');
app.get('/v1_0/user/customer/goods', customerGoods.query);

//根据交易hash查找某次交易
var transactionDetail = require('./routes/transaction/transactionDetail');
app.get('/v1_0/transaction/detail', transactionDetail.query);
