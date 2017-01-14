/**
 * Created by chenyufeng on 14/01/2017.
 */

/**
 * 该脚本是数据库初始化脚本，用来初始化一些银行数据
 */
var mongoose = require('mongoose');
var connectDAO = require('./connectDAO');
connectDAO.connect(); //连接数据库
var Bank = mongoose.model('Bank');

//初始化银行数据
/**
 * 银行表banks：只有一条记录；
 * 这里之后要考虑每一次的部署需要把之前的数据保存下来，然后迁移到新的文档中
 * @type {*}
 */
var bank = new Bank({
    owner: "0x0",
    totalIssuedScore: 0,
    totalSettledScore: 0
});
bank.save(function (error) {
    if (!error) {
        console.log("银行在数据库中创建成功");
    }
    else {
        console.log("银行在数据库中创建失败");
    }
});