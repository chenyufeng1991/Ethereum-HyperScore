/**
 * Created by chenyufeng on 13/01/2017.
 */
var mongoose = require('mongoose');
var config = require('../config/config');

module.exports.connect = function () {
    var db = mongoose.connect(config.mongodb);
    //这里加载模型
    require('./model/customer.server.model');
    require('./model/merchant.server.model');
    require('./model/manager.server.model');
    require('./model/bank.server.model');
    require('./model/good.server.model');
    return db;
};
