var web3Instance = require('./web3Instance');

//web3初始化
var web3 = web3Instance.web3;

//获得以太坊客户端类型
//0:testrpc       1:geth
var nodeType;
if (web3.version.node.indexOf("Geth") != -1) {
    nodeType = 1;
}
else if (web3.version.node.indexOf("TestRPC") != -1) {
    nodeType = 0;
}

module.exports = {
    nodeType: nodeType
};