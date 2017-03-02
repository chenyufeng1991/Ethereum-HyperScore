/**
 * Created by chenyufeng on 13/01/2017.
 */
var mongoose = require('mongoose');

var MerchantSchema = new mongoose.Schema({
    merchantAddr: String,
    phone: String,
    password: String,
    score: Number,
    sellGoods: [],
    salt: String
});

mongoose.model('Merchant', MerchantSchema);