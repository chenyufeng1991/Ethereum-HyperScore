/**
 * 该文件为合约的自动化部署脚本，本次要部署新合约的时候，执行该文件即可。
 * 部署脚本不应该在服务端被调用，否则每次启动服务器都要部署新合约，不符合实际应用。
 */
var Web3 = require('web3');
var fs = require('fs');
var path = require('path');
var judgeNodeType = require('./judgeNodeType');

var web3;
if(typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

//读取合约
//如果由其他文件来调用该模块，则fs中写入的路径应该是相对于调用者来的，而不是该文件
fs.readFile("../../../contract/Score.sol", function (error, result) {
    console.log("合约：" + result.toString());
    //编译合约
    var compileJSON = JSON.stringify(web3.eth.compile.solidity(result.toString()), null, " "); //格式化输出
    console.log("编译合约后：" + compileJSON);
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
    console.log("abi文件：" + abiString);
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
    console.log("code字节码：" + codeString);
    fs.writeFile("../../../contract/codeString.txt", codeString);

    //根据abi和bytecode部署合约
    web3.eth.contract(JSON.parse(abiString)).new({data: codeString, from: web3.eth.accounts[0], gas: 1600000}, function (error, contract) {
        if(!contract.address) {
            console.log("交易hash：" + contract.transactionHash);
        }
        else {
            //获得部署的合约地址
            var contractAddress = contract.address;
            console.log("合约地址：" + contractAddress);
            fs.writeFile("../../../contract/contractAddress.txt", contractAddress);

            contract.setAge(8888, {from: web3.eth.accounts[0]}, function (error, result) {
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
