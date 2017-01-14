/**
 * Created by chenyufeng on 14/01/2017.
 */
var mongoose = require('mongoose');

var ManagerSchema = new mongoose.Schema({
    managerAddr: String,
    phone: String,
    password: String,
    issuedScore: Number
});

mongoose.model('Manager', ManagerSchema);