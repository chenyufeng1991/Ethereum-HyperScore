var Web3 = require('web3');

//web3初始化
var web3;
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

//获得以太坊客户端类型
//0:testrpc       1:geth
var nodeType;
if (web3.version.node.indexOf("Geth") != -1) {
    nodeType = 1;
}
else if (web3.version.node.indexOf("TestRPC") != -1) {
    nodeType = 0;
}

module.exports.nodeType = nodeType;