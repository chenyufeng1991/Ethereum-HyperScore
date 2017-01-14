/**
 * Created by chenyufeng on 13/01/2017.
 */
var mongoose = require('mongoose');
var configDAO = require('./configDAO');

module.exports.connect = function () {
     var db = mongoose.connect(configDAO.mongodb);
     //这里加载模型
    require('./model/customer.server.model');
    require('./model/merchant.server.model');
    require('./model/manager.server.model');
    return db;
};
