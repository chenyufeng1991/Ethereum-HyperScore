var express = require('express'); // 项目服务端使用express框架
var app = express();
var contractInstance = require('./public/javascripts/utils/ethereumUtils/contractInstance');

//主页
app.get('/', function (req, res) {
    console.log("HyperScore Main Page");
    res.send("HyperScore Main Page");
    res.end();
});

//客户注册
var registerCustomer = require('./routes/customer/registerCustomer');
app.get('/registerCustomer', registerCustomer.register);

//客户登录
var loginCustomer = require('./routes/customer/loginCustomer');
app.get('/loginCustomer', loginCustomer.login);

//查询客户详细信息
var getCustomerInfo = require('./routes/customer/getCustomerInfo');
app.get('/getCustomerInfo', getCustomerInfo.query);

//银行发行积分
var issueScore = require('./routes/manager/issueScore');
app.get('/issueScore', issueScore.issue);

//查询银行已经发行的积分总数
var getIssuedScore = require('./routes/manager/getIssuedScore');
app.get('/getIssuedScore', getIssuedScore.query);


var server = app.listen(8000, function () {
    console.log("服务端地址为：http://localhost:8000");
});


