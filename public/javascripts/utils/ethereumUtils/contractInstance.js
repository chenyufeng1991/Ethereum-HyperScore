var Web3 = require('web3');
var fs = require('fs');
var config = require('../../config/config');

//web3初始化
var web3;
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider(config.clientUrl));
}

//获得合约实例
fs.readFile("./contract/abiString.txt", function (error, result) {
    console.log(result.toString());
    var abiString = result.toString();

    fs.readFile("./contract/contractAddress.txt", function (error, result) {
        console.log(result.toString());
        var contractAddress = result.toString();

        global.contractInstance = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);
    });
});