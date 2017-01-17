var fs = require('fs');
var web3Instance = require('./web3Instance');
var LOG = require('../commonUtils/LOG');

//web3初始化
var web3 = web3Instance.web3;

//传入参数，是否使用新合约
module.exports.createInstance = function (isNewContract) {

    var abiStringRoute = null;
    var contractAddressRoute = null;

    if(isNewContract) {
        //使用迁移后的新合约
        abiStringRoute = "./contract/new/new_abiString.txt";
        contractAddressRoute = "./contract/new/new_contractAddress.txt";
    }
    else {
        //使用旧合约
        abiStringRoute = "./contract/abiString.txt";
        contractAddressRoute = "./contract/contractAddress.txt";
    }
    fs.readFile(abiStringRoute, function (error, result) {
        console.log(LOG.ETH_ABI_FILE + ":" + result.toString());
        var abiString = result.toString();

        fs.readFile(contractAddressRoute, function (error, result) {
            console.log(LOG.ETH_CONTRACT_ADDRESS + ":" + result.toString());
            var contractAddress = result.toString();
            global.contractInstance = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);
        });
    });
};