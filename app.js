var express = require('express'); // 项目服务端使用express框架
var app = express();

var server = app.listen(8000, function () {
    console.log("服务端地址为：http://127.0.0.1:8000");
});


