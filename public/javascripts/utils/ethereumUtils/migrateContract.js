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
log4js.configure(log4jsConfig.config(path.join(__dirname, '../../../../log/migrateContract.log')));

//web3
var judgeNodeType = require('./judgeNodeType');
var web3Instance = require('./web3Instance');
var web3 = web3Instance.web3;

//读取合约
//如果由其他文件来调用该模块，则fs中写入的路径应该是相对于调用者来的，而不是该文件
fs.readFile(path.join(__dirname, "../../../../contract/new/new_Score.sol"), function (error, result) {
    console.log(LOG.ETH_CONTRACT + ":" + result.toString());
    //编译合约
    var compileJSON = JSON.stringify(web3.eth.compile.solidity(result.toString()), null, " "); //格式化输出
    console.log(LOG.ETH_COMPILED_CONTRACT + ":" + compileJSON);
    fs.writeFile(path.join(__dirname, "../../../../contract/new/new_compileJSON.txt"), compileJSON); //写入文件

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
    fs.writeFile(path.join(__dirname, "../../../../contract/new/new_abiString.txt"), abiString);

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
    fs.writeFile(path.join(__dirname, "../../../../contract/new/new_codeString.txt"), codeString);

    //根据abi和bytecode部署合约;如果这里error，有可能是OOG造成的
    web3.eth.contract(JSON.parse(abiString)).new({
        data: codeString,
        from: web3.eth.coinbase,
        gas: 5000000
    }, function (error, newContractInstance) {
        if (!newContractInstance.address) {
            console.log(LOG.ETH_TRANSACTION_HASH + ":" + newContractInstance.transactionHash);
        }
        else {
            //获得部署的合约地址
            var contractAddress = newContractInstance.address;
            console.log("新合约地址" + ":" + contractAddress);
            fs.writeFile(path.join(__dirname, "../../../../contract/new/new_contractAddress.txt"), contractAddress);

            //传入新合约实例，然后去初始化旧合约实例
            initOldContractInstance(newContractInstance);
        }
    });
});

/**
 * 获得旧合约实例
 * @param newContractInstance
 */
function initOldContractInstance(newContractInstance) {
    fs.readFile(path.join(__dirname, "../../../../contract/abiString.txt"), function (error, result) {
        console.log(LOG.ETH_ABI_FILE + ":" + result.toString());
        var abiString = result.toString();

        fs.readFile(path.join(__dirname, "../../../../contract/contractAddress.txt"), function (error, result) {
            console.log("旧合约地址" + ":" + result.toString());
            var contractAddress = result.toString();
            var oldContractInstance = web3.eth.contract(JSON.parse(abiString)).at(contractAddress);

            startMigrate(oldContractInstance, newContractInstance);
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
    //迁移已发行积分/已清算积分
    migrateTotalScore(oldContract, newContract);
    //迁移客户数据
    migrateCustomer(oldContract, newContract);
    //迁移商户数据
    migrateMerchant(oldContract, newContract);
    //迁移管理员数据
    migrateManager(oldContract, newContract);

    //迁移商品数据
    migrateGood(oldContract, newContract);

    //迁移交易数据
    migrateTransaction(oldContract, newContract);

}

function migrateTotalScore(oldContract, newContract) {
    oldContract.getTotalIssuedScore(function (error, result) {
        if (!error) {
            var totalIssuedScore = result;
            newContract.setTotalIssuedScore(totalIssuedScore, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    console.log("已发行总积分插入成功");
                }
                else {
                    console.log("错误：" + error);
                }
            })
        }
        else {
            console.log("错误：" + error);
        }
    });

    oldContract.getTotalSettledScore(function (error, result) {
        if (!error) {
            var totalSettledScore = result;
            newContract.setTotalSettledScore(totalSettledScore, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    console.log("已清算总积分插入成功");
                }
                else {
                    console.log("错误：" + error);
                }
            })
        }
        else {
            console.log("错误：" + error);
        }
    });
}

function migrateCustomer(oldContract, newContract) {
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

function migrateMerchant(oldContract, newContract) {
    oldContract.getMerchantAddrs(function (error, result) {
        if (!error) {
            var merchantAddrs = result;
            newContract.setMerchantAddrs(merchantAddrs, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    for (var i = 0; i < merchantAddrs.length; i++) {
                        oldContract.getMerchant(merchantAddrs[i], function (error, result) {
                            if (!error) {
                                var merchantInfo = result;
                                console.log("手机号:" + commonUtils.hexCharCodeToStr(merchantInfo[1]));
                                console.log("密码:" + commonUtils.hexCharCodeToStr(merchantInfo[2]));
                                newContract.setMerchant(merchantInfo[0], commonUtils.hexCharCodeToStr(merchantInfo[1]), commonUtils.hexCharCodeToStr(merchantInfo[2]), merchantInfo[3], merchantInfo[4], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("插入地址->商户信息mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });

                                newContract.setMerchantPhone(commonUtils.hexCharCodeToStr(merchantInfo[1]), merchantInfo[0], {
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

                                newContract.setMerchantPhones(commonUtils.hexCharCodeToStr(merchantInfo[1]), {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("商户手机插入成功");
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

function migrateManager(oldContract, newContract) {
    oldContract.getManagerAddrs(function (error, result) {
        if (!error) {
            var managerAddrs = result;
            newContract.setManagerAddrs(managerAddrs, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    for (var i = 0; i < managerAddrs.length; i++) {
                        oldContract.getManager(managerAddrs[i], function (error, result) {
                            if (!error) {
                                var managerInfo = result;
                                console.log("手机号:" + commonUtils.hexCharCodeToStr(managerInfo[1]));
                                console.log("密码:" + commonUtils.hexCharCodeToStr(managerInfo[2]));
                                newContract.setManager(managerInfo[0], commonUtils.hexCharCodeToStr(managerInfo[1]), commonUtils.hexCharCodeToStr(managerInfo[2]), managerInfo[3], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("插入地址->管理员信息mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });

                                newContract.setManagerPhone(commonUtils.hexCharCodeToStr(managerInfo[1]), managerInfo[0], {
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

                                newContract.setManagerPhones(commonUtils.hexCharCodeToStr(managerInfo[1]), {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("管理员手机插入成功");
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

function migrateGood(oldContract, newContract) {
    oldContract.getGoods(function (error, result) {
        if (!error) {
            var goodIds = result;
            newContract.setGoods(goodIds, {from: web3.eth.coinbase, gas: 1000000}, function (error, result) {
                if (!error) {
                    for (var i = 0; i < goodIds.length; i++) {
                        oldContract.getGood(goodIds[i], function (error, result) {
                            if (!error) {
                                var goodInfo = result;
                                console.log("商品Id：" + commonUtils.hexCharCodeToStr(goodInfo[0]) + "；商品名称：" + commonUtils.hexCharCodeToStr(goodInfo[1]) + "；商品价格：" + goodInfo[2] + "；商户地址：" + goodInfo[3]);

                                newContract.setGood(commonUtils.hexCharCodeToStr(goodInfo[0]), commonUtils.hexCharCodeToStr(goodInfo[1]), goodInfo[2], goodInfo[3], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("商品插入mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });
                            }
                            else {
                                console.log("错误：" + error);
                            }
                        })
                    }
                }
                else {
                    console.log("错误：" + error);
                }
            })
        }
        else {
            console.log("错误：" + error);
        }
    })
}

function migrateTransaction(oldContract, newContract) {
    oldContract.getTransactions(function (error, result) {
        if (!error) {
            var transactions = result;
            newContract.setTransactions(transactions, {
                from: web3.eth.coinbase,
                gas: 1000000
            }, function (error, result) {
                if (!error) {
                    for (var i = 0; i < transactions.length; i++) {
                        oldContract.getTransaction(transactions[i], function (error, result) {
                            if (!error) {
                                var transactionInfo = result;
                                console.log("交易Hash：" + transactionInfo[0] + "；交易类型：" + transactionInfo[1] + "；发送者：" + commonUtils.hexCharCodeToStr(transactionInfo[2]) + "；接收者：" + commonUtils.hexCharCodeToStr(transactionInfo[3]) + "；积分数额：" + transactionInfo[4]);

                                newContract.setTransaction(transactionInfo[0], transactionInfo[1], commonUtils.hexCharCodeToStr(transactionInfo[2]), commonUtils.hexCharCodeToStr(transactionInfo[3]), transactionInfo[4], {
                                    from: web3.eth.coinbase,
                                    gas: 1000000
                                }, function (error, result) {
                                    if (!error) {
                                        console.log("交易插入mapping成功");
                                    }
                                    else {
                                        console.log("错误：" + error);
                                    }
                                });
                            }
                            else {
                                console.log("错误：" + error);
                            }
                        })
                    }
                }
                else {
                    console.log("错误：" + error);
                }
            })
        }
        else {
            console.log("错误：" + error);
        }
    })
}