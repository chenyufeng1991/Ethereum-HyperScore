/**
 * Created by chenyufeng on 17/01/2017.
 */
var fs = require('fs');
var path = require('path');
var LOG = require('../commonUtils/LOG');
var commonUtils = require('../commonUtils/commonUtils');

//log4js
var log4js = require('log4js');
var log4jsConfig = require('../../config/log4jsConfig');
log4js.configure(log4jsConfig.config('../../../../log/migrateContract.log'));

//web3
var judgeNodeType = require('./judgeNodeType');
var web3Instance = require('./web3Instance');
var web3 = web3Instance.web3;

//读取合约
//如果由其他文件来调用该模块，则fs中写入的路径应该是相对于调用者来的，而不是该文件
fs.readFile("../../../../contract/new/new_Score.sol", function (error, result) {
    console.log(LOG.ETH_CONTRACT + ":" + result.toString());
    //编译合约
    var compileJSON = JSON.stringify(web3.eth.compile.solidity(result.toString()), null, " "); //格式化输出
    console.log(LOG.ETH_COMPILED_CONTRACT + ":" + compileJSON);
    fs.writeFile("../../../../contract/new/new_compileJSON.txt", compileJSON); //写入文件

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
    fs.writeFile("../../../../contract/new/new_abiString.txt", abiString);

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
    fs.writeFile("../../../../contract/new/new_codeString.txt", codeString);

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
            console.log("新合约地址" + ":" + contractAddress);
            fs.writeFile("../../../../contract/new/new_contractAddress.txt", contractAddress);

            //传入新合约实例，然后去初始化旧合约实例
            initOldContract(contract);
        }
    });
});

/**
 * 获得旧合约实例
 * @param newContract
 */
function initOldContract(newContract) {
    fs.readFile("../../../../contract/abiString.txt", function (error, result) {
        console.log(LOG.ETH_ABI_FILE + ":" + result.toString());
        var abiString = result.toString();

        fs.readFile("../../../../contract/contractAddress.txt", function (error, result) {
            console.log("旧合约地址" + ":" + result.toString());
            var contractAddress = result.toString();
            var oldContract = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);

            startMigrate(oldContract, newContract);
        });
    });
}

/**
 * 获得新旧合约实例
 * @param oldContract
 * @param newContract
 */
function startMigrate(oldContract, newContract) {
    console.log("chenyufeng：" + oldContract.address + "    " + newContract.address);
    //迁移客户数据
    //获得客户地址数组
    oldContract.getCustomerAddrs(function (error, result) {
        if (!error) {
            var customerAddrs = result;
            newContract.setCustomerAddrs(customerAddrs, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    for (var i = 0; i < customerAddrs.length; i++) {
                        oldContract.getCustomer(customerAddrs[i], function (error, result) {
                            if (!error) {
                                var customerInfo = result;
                                console.log("手机号:" + commonUtils.hexCharCodeToStr(customerInfo[1]));
                                console.log("密码:" + commonUtils.hexCharCodeToStr(customerInfo[2]));
                                newContract.setCustomer(customerInfo[0], commonUtils.hexCharCodeToStr(customerInfo[1]), commonUtils.hexCharCodeToStr(customerInfo[2]), customerInfo[3], customerInfo[4], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("插入地址->用户信息mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });

                                newContract.setCustomerPhone(commonUtils.hexCharCodeToStr(customerInfo[1]), customerInfo[0], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("插入手机->地址mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });

                                newContract.setCustomerPhones(commonUtils.hexCharCodeToStr(customerInfo[1]), {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("客户手机插入成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });
                            }
                            else {
                                console.log("错误：" + error);
                            }
                        });
                    }
                }
                else {
                    console.log("错误：" + error);
                }
            });
        }
        else {
            console.log("错误：" + error);
        }
    });
}
