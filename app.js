var express = require('express'); // 项目服务端使用express框架
var app = express();
var contractInstance = require('./routes/contractInstance');

//主页
app.get('/', function (req, res) {
    console.log("HyperScore Main Page");
    res.send("HyperScore Main Page");
    res.end();
});

//客户注册
var registerCustomer = require('./routes/registerCustomer');
app.get('/registerCustomer', registerCustomer.register);

var server = app.listen(8000, function () {
    console.log("服务端地址为：http://localhost:8000");
});


