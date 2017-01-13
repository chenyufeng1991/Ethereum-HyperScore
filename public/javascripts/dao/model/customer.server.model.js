/**
 * Created by chenyufeng on 13/01/2017.
 */

var mongoose = require('mongoose');

var CustomerSchema = new mongoose.Schema({
    address: String,
    phone: String,
    password: String,
    score: Number,
    buyGoods: []
});

mongoose.model('Customer', CustomerSchema);