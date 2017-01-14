/**
 * Created by chenyufeng on 14/01/2017.
 */
var mongoose = require('mongoose');

//第四个参数不方便获取merchantAddr，故这里存储merchantPhone
var GoodSchema = new mongoose.Schema({
    goodId: String,
    goodName: String,
    goodPrice: Number,
    merchantPhone: String
});

mongoose.model('Good', GoodSchema);