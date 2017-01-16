/**
 * Created by chenyufeng on 16/01/2017.
 */
var mongoose = require('mongoose');

var TransactionSchema = new mongoose.Schema({
    txHash: String,
    state: Number,
    sender: String,
    receiver: String,
    score: Number
});

mongoose.model('Transaction', TransactionSchema);