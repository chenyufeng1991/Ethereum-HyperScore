/**
 * Created by chenyufeng on 14/01/2017.
 */
var mongoose = require('mongoose');

var ManagerSchema = new mongoose.Schema({
    managerAddr: String,
    phone: String,
    password: String,
    issuedScore: Number,
    salt: String
});

mongoose.model('Manager', ManagerSchema);