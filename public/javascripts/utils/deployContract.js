/**
 * 该文件为合约的自动化部署脚本，本次要部署新合约的时候，执行该文件即可。
 * 部署脚本不应该在服务端被调用，否则每次启动服务器都要部署新合约，不符合实际应用。
 */
var Web3 = require('web3');
var fs = require('fs');
var path = require('path');

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
    var compileJSON = JSON.stringify(web3.eth.compile.solidity(result.toString()));
    console.log("编译合约后：" + compileJSON);
    fs.writeFile("../../../contract/compileJSON.txt", compileJSON); //写入文件

    //获得abi文件
    var abiString = JSON.stringify(web3.eth.compile.solidity(result.toString()).info.abiDefinition);
    console.log("abi文件：" + abiString);
    fs.writeFile("../../../contract/abiString.txt", abiString);

    //获得code字节码
    var codeString = JSON.stringify(web3.eth.compile.solidity(result.toString()).code);
    console.log("code字节码：" + codeString);
    fs.writeFile("../../../contract/codeString.txt", codeString);

    var contractAddress = "0x31b8058d24aa83080659215fff659d94aefcf819";

    var contractInstance = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);
    contractInstance.setAge(8888, {from: web3.eth.accounts[0]}, function (error, result) {
        console.log(result);
    });
    contractInstance.getAge(function (error, result) {
      console.log(result);
    });
    var eventSetAge = contractInstance.SetAge();
    eventSetAge.watch(function (error, event) {
        console.log(event.args.age);
        eventSetAge.stopWatching();
    });

});
