/**
 * 该文件为合约的自动化部署脚本，本次要部署新合约的时候，执行该文件即可。
 * 部署脚本不应该在服务端被调用，否则每次启动服务器都要部署新合约，不符合实际应用。
 *
 * 当在TestRPC中部署时，由于默认的TestRPC的gasLimit=0x47E7C4，而我们的合约部署gas已经远超过这个值，所以在启动TestRPC是要手动设置gasLimit,如使用：
 * testrpc -l 6000000
 */
var fs = require('fs');
var path = require('path');
var LOG = require('../commonUtils/LOG');

//log4js
var log4js = require('log4js');
var log4jsConfig = require('../../config/log4jsConfig');
// log4js.configure(log4jsConfig.config('../../../log/deployContract.log'));
var logger = log4jsConfig.logger;

//web3
var judgeNodeType = require('./judgeNodeType');
var web3Instance = require('./web3Instance');
var web3 = web3Instance.web3;

//读取合约
//如果由其他文件来调用该模块，则fs中写入的路径应该是相对于调用者来的，而不是该文件
fs.readFile("../../../contract/Score.sol", function (error, result) {
    console.log(LOG.ETH_CONTRACT + ":" + result.toString());
    //编译合约
    var compileJSON = JSON.stringify(web3.eth.compile.solidity(result.toString()), null, " "); //格式化输出
    console.log(LOG.ETH_COMPILED_CONTRACT + ":" + compileJSON);
    fs.writeFile("../../../contract/compileJSON.txt", compileJSON); //写入文件

    //获得abi文件
    var abiString;
    if (judgeNodeType.nodeType == 0) {
        //testrpc
        abiString = JSON.stringify(web3.eth.compile.solidity(result.toString()).info.abiDefinition, null, " ");
    }
    else {
        //geth
        abiString = JSON.stringify(web3.eth.compile.solidity(result.toString()).Score.info.abiDefinition, null, " ");
    }
    console.log(LOG.ETH_ABI_FILE + ":" + abiString);
    fs.writeFile("../../../contract/abiString.txt", abiString);

    //获得code字节码
    var codeString;
    if (judgeNodeType.nodeType == 0) {
        //testrpc
        codeString = web3.eth.compile.solidity(result.toString()).code;
    }
    else {
        //geth
        codeString = web3.eth.compile.solidity(result.toString()).Score.code;
    }
    console.log(LOG.ETH_BINARY_CODE + ":" + codeString);
    fs.writeFile("../../../contract/codeString.txt", codeString);

    //根据abi和bytecode部署合约;如果这里error，有可能是OOG造成的
    web3.eth.contract(JSON.parse(abiString)).new({
        data: codeString,
        from: web3.eth.coinbase,
        gas: 5000000
    }, function (error, contract) {
        if (!contract.address) {
            console.log(LOG.ETH_TRANSACTION_HASH + ":" + contract.transactionHash);
        }
        else {
            //获得部署的合约地址
            var contractAddress = contract.address;
            console.log(LOG.ETH_CONTRACT_ADDRESS + ":" + contractAddress);
            fs.writeFile("../../../contract/contractAddress.txt", contractAddress);

            contract.setAge(8888, {from: web3.eth.coinbase}, function (error, result) {
                console.log(result);
            });
            contract.getAge(function (error, result) {
                console.log(result);
            });
            var eventSetAge = contract.SetAge();
            eventSetAge.watch(function (error, event) {
                console.log(event.args.age);
                eventSetAge.stopWatching();
            });
        }
    });
});
