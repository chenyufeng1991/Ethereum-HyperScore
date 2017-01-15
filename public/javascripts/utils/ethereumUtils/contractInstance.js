var fs = require('fs');
var web3Instance = require('./web3Instance');
var LOG = require('../commonUtils/LOG');

//web3初始化
var web3 = web3Instance.web3;

//获得合约实例
fs.readFile("./contract/abiString.txt", function (error, result) {
    console.log(LOG.ETH_ABI_FILE + ":" + result.toString());
    var abiString = result.toString();

    fs.readFile("./contract/contractAddress.txt", function (error, result) {
        console.log(LOG.ETH_CONTRACT_ADDRESS + ":" + result.toString());
        var contractAddress = result.toString();

        global.contractInstance = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);
    });
});