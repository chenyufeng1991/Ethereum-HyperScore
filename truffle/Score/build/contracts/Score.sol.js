var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Score error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Score error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Score contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Score: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Score.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Score not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          },
          {
            "name": "_goodId",
            "type": "string"
          },
          {
            "name": "_price",
            "type": "uint256"
          }
        ],
        "name": "addGood",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          },
          {
            "name": "_goodId",
            "type": "string"
          }
        ],
        "name": "buyGoodSuccess",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          }
        ],
        "name": "getGoodsByCustomer",
        "outputs": [
          {
            "name": "",
            "type": "bytes32[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "customerAddr",
            "type": "address"
          }
        ],
        "name": "getScoreWithCustomerAddr",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          },
          {
            "name": "_goodId",
            "type": "string"
          }
        ],
        "name": "putGoodToMerchant",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "merchantAddr",
            "type": "address"
          }
        ],
        "name": "getScoreWithMerchantAddr",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          }
        ],
        "name": "newMerchant",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          },
          {
            "name": "_password",
            "type": "string"
          }
        ],
        "name": "setCustomerPassword",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          },
          {
            "name": "_password",
            "type": "string"
          }
        ],
        "name": "setMerchantPassword",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getIssuedScoreAmount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_senderType",
            "type": "uint256"
          },
          {
            "name": "_sender",
            "type": "address"
          },
          {
            "name": "_receiver",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "transferScoreToAnother",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          }
        ],
        "name": "newCustomer",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          },
          {
            "name": "_goodId",
            "type": "string"
          }
        ],
        "name": "buyGood",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAge",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_goodId",
            "type": "string"
          }
        ],
        "name": "putGoodToArray",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_receiver",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "sendScoreToCustomer",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          }
        ],
        "name": "getGoodsByMerchant",
        "outputs": [
          {
            "name": "",
            "type": "bytes32[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_customerAddr",
            "type": "address"
          }
        ],
        "name": "getCustomerPassword",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          },
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_age",
            "type": "uint256"
          }
        ],
        "name": "setAge",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_merchantAddr",
            "type": "address"
          }
        ],
        "name": "getMerchantPassword",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          },
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [],
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "NewCustomer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "NewMerchant",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SetCustomerPassword",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SetMerchantPassword",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "TransferScoreToAnother",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "AddGood",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "PutGoodToArray",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "PutGoodToMerchant",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "BuyGood",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "age",
            "type": "uint256"
          }
        ],
        "name": "SetAge",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x606060405260018054600160a060020a0319166c01000000000000000000000000338102041790556115f9806100356000396000f3606060405236156100fb5760e060020a6000350463193ab829811461010057806323dacd6c1461015e57806332a841b3146101b757806336eed01f1461023a5780634db234981461026757806358d7fa69146102fc5780636c0b2fa71461032857806370f2eccc1461038357806373c8b53e146103da57806382ea84a31461043157806387ab840314610440578063889a37c6146104b3578063893d20e8146104c7578063921fb890146104e0578063967e6e651461053957806399a6a67414610549578063aecf2149146105c6578063c3b81e22146105ef578063d396223914610671578063d5dcf12714610689578063eee02e61146106df575b610002565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f795833595939460449493929092019181908401838280828437509496505093359350505050600061078c835b6020015190565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f79583359593946044949392909201918190840183828082843750949650505050505050600061094082610157565b34610002576106f960043560408051602081810183526000808352600160a060020a0385168152600482528390206003018054845181840281018401909552808552929392909183018282801561022e57602002820191906000526020600020905b81548152600190910190602001808311610219575b50505050509050610262565b3461000257610743600435600160a060020a0381166000908152600460205260409020600201545b919050565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f79583359593946044949392909201918190840183828082843750949650505050505050600160a060020a03821660009081526005602052604090206003018054600181018083558281838015829011610a8557600083815260209020610a859181019083016109ce565b3461000257610743600435600160a060020a038116600090815260056020526040902060020154610262565b34610002576106f7600435610aa0815b6000805b6008548110156115d65782600160a060020a0316600860005082815481101561000257600091825260209091200154600160a060020a031614156115e957600191506115db565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f79583359593946044949392909201918190840183828082843750949650505050505050610c2581610157565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f79583359593946044949392909201918190840183828082843750949650505050505050610cb381610157565b34610002576107436002545b90565b34610002576106f7600435602435604435606435604080516020810190915260008152610d41835b6000805b6007548110156115d65782600160a060020a0316600760005082815481101561000257600091825260209091200154600160a060020a031614156115f157600191506115db565b34610002576106f7600435610ff481610468565b3461000257610755600154600160a060020a031661043d565b346100025760408051602060046024803582810135601f81018590048502860185019096528585526106f79583359593946044949392909201918190840183828082843750949650505050505050600061117a82610157565b346100025761074360005461043d565b34610002576106f76004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505050505050506009805460018101808355828183801582901161137d5760008381526020902061137d9181019083016109ce565b34610002576106f760043560243560015433600160a060020a0390811691161461143557610002565b34610002576106f960043560408051602081810183526000808352600160a060020a0385168152600582528390206003018054845181840281018401909552808552929392909183018282801561022e576020028201919060005260206000209081548152600190910190602001808311610219575b50505050509050610262565b34610002576107716004356000600061157683610468565b346100025760043560008190556040805133600160a060020a031681526020810183905281516106f793927fc890294a68097562641143813b7ae9e39c85e43d49eefd10381cb4458c0ebcf5928290030190a150565b3461000257610771600435600060006115ac83610338565b005b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b60408051918252519081900360200190f35b60408051600160a060020a039092168252519081900360200190f35b60408051921515835260208301919091528051918290030190f35b90506107cc815b6000805b6009548110156115d6576009805484919083908110156100025760009182526020909120015414156115e157600191506115db565b151561088457600081815260066020908152604091829020838155600180820186905560029091018054600160a060020a031916606060020a898102041790558251600160a060020a03331681529182015260608183018190526012908201527fe5889be5bbbae59586e59381e68890e58a9f0000000000000000000000000000608082015290517f6c0fff554d553c99fbc0021e11c35ca4137838696d38e2c70de9c2c92794556c9160a0908290030190a1610922565b60408051600160a060020a0333168152600060208201526060818301819052602d908201527fe8afa5e4bbb6e59586e59381e5b7b2e7bb8fe6b7bbe58aa0efbc8ce8afb7e7a160808201527faee8aea4e5908ee6938de4bd9c0000000000000000000000000000000000000060a082015290517f6c0fff554d553c99fbc0021e11c35ca4137838696d38e2c70de9c2c92794556c9181900360c00190a15b50505050565b5050506000928352506020909120018190555b505050565b600081815260066020908152604080832060018082018054600160a060020a03808c168089526004808952878a2060028082018054969096039095559454968401549092168952600588529588209091018054909401909355929094529091526003018054918201808255929350918281838015829011610928576000838152602090206109289181019083015b808211156109e257600081556001016109ce565b5090565b909155505060408051600160a060020a0333168152602081018290526024818301527fe6b7bbe58aa0e588b0e59586e688b7e79a84e59586e59381e695b0e7bb84e68860608201527f90e58a9f00000000000000000000000000000000000000000000000000000000608082015290517fad3e58dfd5b5c6f48b817ce7c2fc3155aaa1af79c9ffd57c7a1e64ad6fbb31239181900360a00190a15b5050565b5050509190906000526020600020900160006109e684610157565b1515610b0457600160a060020a03811660009081526005602052604090208054600160a060020a031916606060020a8084020417905560088054600181018083558281838015829011610b7f57600083815260209020610b7f9181019083016109ce565b60408051600160a060020a03331681526000602082015260608183018190526015908201527fe8afa5e8b4a6e688b7e5b7b2e7bb8fe6b3a8e5868c0000000000000000000000608082015290517f0e65ebfe2c82306ac02d8c74509cb6d3e528fe1ba925431a28da1e952281abe99181900360a00190a15b50565b505050600092835250602091829020018054600160a060020a031916606060020a848102041790556040805133600160a060020a031681526001928101929092526060828201819052600c908301527fe6b3a8e5868ce68890e58a9f00000000000000000000000000000000000000006080830152517f0e65ebfe2c82306ac02d8c74509cb6d3e528fe1ba925431a28da1e952281abe99160a0908290030190a1610b7c565b600160a060020a038084166000908152600460209081526040918290206001019390935580513390921682529181018290526012818301527fe8aebee7bdaee5af86e7a081e68890e58a9f0000000000000000000000000000606082015290517f1db7e17e6810874ec64cf3eb4bced0c8ba5f49fdec1724a1566bf3ddb59b830a9181900360800190a15050565b600160a060020a038084166000908152600560209081526040918290206001019390935580513390921682529181018290526012818301527fe8aebee7bdaee5af86e7a081e68890e58a9f0000000000000000000000000000606082015290517f4327d8a1e677908b7d1af3765425efc3b62da74f7aa441ac960b4ee1534b59f69181900360800190a15050565b158015610d545750610d5283610338565b155b15610df35760408051600160a060020a0333168152602081018290526030818301527fe79baee79a84e8b4a6e688b7e4b88de5ad98e59ca8efbc8ce8afb7e7a1aee8ae60608201527fa4e5908ee5868de8bdace7a7bbefbc8100000000000000000000000000000000608082015290517f5035976aa5a48cc59b063e79fbfa43e8ed567d91fc854822c646f0470529dd4a9181900360a00190a1610f2c565b841515610e4857600160a060020a038416600090815260046020526040902060020154829010610e9657600160a060020a038416600090815260046020526040902060020180548390039055610f3383610468565b600160a060020a038416600090815260056020526040902060020154829010610e9657600160a060020a038416600090815260056020526040902060020180548390039055610f3383610468565b60408051600160a060020a033316815260208101829052602a818301527fe4bda0e79a84e7a7afe58886e4bd99e9a29de4b88de8b6b3efbc8ce8bdace8ae60608201527fa9e5a4b1e8b4a5efbc8100000000000000000000000000000000000000000000608082015290517f5035976aa5a48cc59b063e79fbfa43e8ed567d91fc854822c646f0470529dd4a9181900360a00190a15b5050505050565b15610f5e57600160a060020a0383166000908152600460205260409020600201805483019055610f80565b600160a060020a03831660009081526005602052604090206002018054830190555b60408051600160a060020a0333168152602081018290526015818301527fe7a7afe58886e8bdace8aea9e68890e58a9fefbc810000000000000000000000606082015290517f5035976aa5a48cc59b063e79fbfa43e8ed567d91fc854822c646f0470529dd4a9181900360800190a1610f2c565b151561105857600160a060020a03811660009081526004602052604090208054600160a060020a031916606060020a80840204179055600780546001810180835582818380158290116110d4576000838152602090206110d49181019083016109ce565b60408051600160a060020a03331681526000602082015260608183018190526015908201527fe8afa5e8b4a6e688b7e5b7b2e7bb8fe6b3a8e5868c0000000000000000000000608082015290517f424c8c8b87e9d8aa2fd6e4f51280fcbd5c97d97d937a00c69a3f1e89164b5b599181900360a00190a1610b7c565b505050600092835250602091829020018054600160a060020a031916606060020a848102041790556040805133600160a060020a031681526001928101929092526060828201819052600c908301527fe6b3a8e5868ce68890e58a9f00000000000000000000000000000000000000006080830152517f424c8c8b87e9d8aa2fd6e4f51280fcbd5c97d97d937a00c69a3f1e89164b5b599160a0908290030190a1610b7c565b905061118581610793565b1561125f57600081815260066020908152604080832060010154600160a060020a038716845260049092529091206002015410156113015760408051600160a060020a03331681526000602082015260608183018190526021908201527fe4bd99e9a29de4b88de8b6b3efbc8ce8b4ade4b9b0e59586e59381e5a4b1e8b460808201527fa50000000000000000000000000000000000000000000000000000000000000060a082015290517fa638d61cc6fe6f6e523445b498be798f6cd2d1df9be47db6107e802212850d5c9181900360c00190a161093b565b60408051600160a060020a0333168152600060208201526060818301819052602c908201527fe8be93e585a5e59586e593814964e4b88de5ad98e59ca8efbc8ce8afb7e7a1ae60808201527fe5ae9ae5908ee8b4ade4b9b0000000000000000000000000000000000000000060a082015290517fa638d61cc6fe6f6e523445b498be798f6cd2d1df9be47db6107e802212850d5c9181900360c00190a161093b565b60408051600160a060020a03331681526001602082015260608183018190526012908201527fe8b4ade4b9b0e59586e59381e68890e58a9f0000000000000000000000000000608082015290517fa638d61cc6fe6f6e523445b498be798f6cd2d1df9be47db6107e802212850d5c9181900360a00190a161093b565b50505091909060005260206000209001600061139884610157565b909155505060408051600160a060020a0333168152602081018290526021818301527fe6b7bbe58aa0e588b0e585a8e5b180e59586e59381e695b0e7bb84e68890e58a60608201527f9f00000000000000000000000000000000000000000000000000000000000000608082015290517f37eb948c4e01d1bb642a2a4b97681f071846ee55d7898ef365f132b9d74529439181900360a00190a150565b61143e82610468565b156114dc576002805482018155600160a060020a0380841660009081526004602090815260409182902090930180548501905580513390921682529181018290526012818301527fe58f91e8a18ce7a7afe58886e68890e58a9f0000000000000000000000000000606082015290517f1085e80f1c104f322185083fe0ba65ddf4ea2040fcb9ad9fdd689ed4ccd5b8b39181900360800190a1610a81565b60408051600160a060020a0333168152602081018290526027818301527fe8afa5e8b4a6e688b7e69caae6b3a8e5868cefbc8ce58f91e8a18ce7a7afe58860608201527f86e5a4b1e8b4a500000000000000000000000000000000000000000000000000608082015290517f1085e80f1c104f322185083fe0ba65ddf4ea2040fcb9ad9fdd689ed4ccd5b8b39181900360a00190a1610a81565b156115a0575050600160a060020a03811660009081526004602052604090206001908101546115a7565b5060009050805b915091565b156115a0575050600160a060020a03811660009081526005602052604090206001908101546115a7565b600091505b50919050565b600101610797565b60010161033c565b60010161046c56",
    "events": {
      "0x6dbea36c469fff206e23ae314ad3e4b5816629800143cb849cea9c97cef466c3": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      "0x71d66a821265c8b2791705874b4f2ec471bb044445f09d8f40f1d700a7cb2e1f": {
        "anonymous": false,
        "inputs": [],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      "0x9845306af6d97af275ddc8237652336e34c572a23e63d2144eca2bf5182077a5": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "isSussecc",
            "type": "bool"
          }
        ],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      "0x49b8f73ede7e3add061b44b8290927d0f2dbdd6f7aad5c7e110893c40e51c861": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "_from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "_value",
            "type": "int256"
          }
        ],
        "name": "ReturnValue",
        "type": "event"
      },
      "0x00d224d71996dfcee4c245633d847c31fada086791714b317b4fdba5f09b823a": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "bool"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x733ac170e99e7d335bfb77222b44285217f54dc4067f5f35c251e0a33cf85237": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "uint256"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x953471650d3a9eed992cf713af29c5f06872ed8f678dc9bf12130cdd92a85d98": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "result",
            "type": "uint256"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x518ae0b0868474c4b6372607e02309498f7f3d33bc4ffacdb0488b48cdda393f": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "string"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x8f2091ba12d9163c6ee076eb979fff327bed618cb6a8d91be26d0997304ce6c5": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "int256"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0xac537a60438c64b6ac0ac3b1feadc4ad98e7cbca8bd3ecc7be59ea34b32c055f": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "bytes32"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x9047045baf36856aebf364d94e7a5e87c7bb4c1a5f06ec951bbd993c897c4fae": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "result",
            "type": "int256"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x1397cb2757dc7ed5de32fecf235b359c3f348e1a15ae008258b31834fb56aa7c": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "address"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x22d897b236e1baa6ee9b04cce71566d3baa036bb6c9fea4daded6caf299beff5": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "int256[]"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x0c6243ccf5107e30934fba300452993710c58167c68eacd43eea29a4be69886b": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "bytes32[]"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x2edaf3d4f05cb905a6c815686d97a96a918f6fe7c08bca0d1f9fd0ef1212c6d8": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result1",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "result2",
            "type": "int256"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0xcce7a3cb99ad10977a49ce9b0915860a8f2404586d45f2da200214e3366644fa": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result1",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "result2",
            "type": "int256"
          },
          {
            "indexed": false,
            "name": "result3",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "result4",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "name": "result5",
            "type": "address"
          }
        ],
        "name": "LogRegStatus",
        "type": "event"
      },
      "0x424c8c8b87e9d8aa2fd6e4f51280fcbd5c97d97d937a00c69a3f1e89164b5b59": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "NewCustomer",
        "type": "event"
      },
      "0x8a0a067614a3e664c1af184b9b4307ab9aeeaa89bdd1008005c192fbcb3029a5": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "int256"
          }
        ],
        "name": "NewCustomer",
        "type": "event"
      },
      "0x60096795c1a700f16ab5fd21ba8fc36fc49a8294c8f54c95630b3024ccaeb67e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "bytes32"
          }
        ],
        "name": "NewCustomer",
        "type": "event"
      },
      "0x1db7e17e6810874ec64cf3eb4bced0c8ba5f49fdec1724a1566bf3ddb59b830a": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SetCustomerPassword",
        "type": "event"
      },
      "0xeff8e1a4164d16ca28aaafb7eb65846dfc53d267d62a74ee293a4b5e9b1d46ac": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      "0x1085e80f1c104f322185083fe0ba65ddf4ea2040fcb9ad9fdd689ed4ccd5b8b3": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SendScoreToCustomer",
        "type": "event"
      },
      "0x15554b2341aa31bfc8faa9968b663410134fecefa0e9c5dc230a8bc20d90a6dd": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "TransferScoreToOtherCustomer",
        "type": "event"
      },
      "0x0e65ebfe2c82306ac02d8c74509cb6d3e528fe1ba925431a28da1e952281abe9": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "NewMerchant",
        "type": "event"
      },
      "0x4327d8a1e677908b7d1af3765425efc3b62da74f7aa441ac960b4ee1534b59f6": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "SetMerchantPassword",
        "type": "event"
      },
      "0x5035976aa5a48cc59b063e79fbfa43e8ed567d91fc854822c646f0470529dd4a": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "TransferScoreToAnother",
        "type": "event"
      },
      "0xc1dcabec1b1a923974e198a6de060dc145f9a1aa9eb3eeaaab2aa45b61ce4d91": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "AddGood",
        "type": "event"
      },
      "0x37eb948c4e01d1bb642a2a4b97681f071846ee55d7898ef365f132b9d7452943": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "PutGoodToArray",
        "type": "event"
      },
      "0xad3e58dfd5b5c6f48b817ce7c2fc3155aaa1af79c9ffd57c7a1e64ad6fbb3123": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "PutGoodToMerchant",
        "type": "event"
      },
      "0x0d1951491e0ffb2b4b239ef49bbb59d589719cd702c3cc65ca142b475a10a95d": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "BuyGood",
        "type": "event"
      },
      "0xa638d61cc6fe6f6e523445b498be798f6cd2d1df9be47db6107e802212850d5c": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "BuyGood",
        "type": "event"
      },
      "0x6c0fff554d553c99fbc0021e11c35ca4137838696d38e2c70de9c2c92794556c": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "isSuccess",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "message",
            "type": "string"
          }
        ],
        "name": "AddGood",
        "type": "event"
      },
      "0xc890294a68097562641143813b7ae9e39c85e43d49eefd10381cb4458c0ebcf5": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "age",
            "type": "uint256"
          }
        ],
        "name": "SetAge",
        "type": "event"
      }
    },
    "updated_at": 1483192829610,
    "links": {},
    "address": "0x31b8058d24aa83080659215fff659d94aefcf819"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Score";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Score = Contract;
  }
})();
