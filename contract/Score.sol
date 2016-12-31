pragma solidity ^0.4.2;

contract Utils {

	function stringToBytes32(string memory source)constant internal returns (bytes32 result) {
    assembly {
        result := mload(add(source, 32))
      }
    }

    function bytes32ToString(bytes32 x)constant internal returns (string) {
    bytes memory bytesString = new bytes(32);
    uint charCount = 0;
    for (uint j = 0; j < 32; j++) {
        byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
        if (char != 0) {
            bytesString[charCount] = char;
            charCount++;
        }
    }
    bytes memory bytesStringTrimmed = new bytes(charCount);
    for (j = 0; j < charCount; j++) {
        bytesStringTrimmed[j] = bytesString[j];
    }
    return string(bytesStringTrimmed);
    }

}

contract Score is Utils {

    address owner;
    uint issuedScoreAmount;
    uint settledScoreAmount;

    struct Customer {
    	address customerAddr;
    	bytes32 password;
    	uint scoreAmount;
    	bytes32[] buyGoods;
    }

    struct Merchant {
    	address merchantAddr;
        bytes32 password;
    	uint scoreAmount;
    	bytes32[] sellGoods;
    }

    struct Good {
    	bytes32 goodId;
    	uint price;
    	address belong;
    }

	mapping (address=>Customer) customer; 
	mapping (address=>Merchant) merchant; 
	mapping (bytes32=>Good) good;

	address[] customers;
	address[] merchants;
    bytes32[] goods;

    modifier onlyOwner(){
		if(msg.sender != owner) throw;
		_;
	}


	function Score() {
		owner = msg.sender;
	}


    function getOwner() constant returns(address) {
        return owner;
    }


	event NewCustomer(address sender, bool isSuccess, string message);
    function newCustomer(address _customerAddr) {


        if(!isCustomerAlreadyRegister(_customerAddr)) {

            customer[_customerAddr].customerAddr = _customerAddr;
    	    customers.push(_customerAddr);
            NewCustomer(msg.sender, true, "注册成功");
            return;
        }
        else {
            NewCustomer(msg.sender, false, "该账户已经注册");
            return;
        }
    }


    event NewMerchant(address sender, bool isSuccess, string message);
    function newMerchant(address _merchantAddr) {


        if(!isMerchantAlreadyRegister(_merchantAddr)) {

            merchant[_merchantAddr].merchantAddr = _merchantAddr;
            merchants.push(_merchantAddr);
            NewMerchant(msg.sender, true, "注册成功");
            return;
        }
        else {
            NewMerchant(msg.sender, false, "该账户已经注册");
            return;
        }
    }


    function isCustomerAlreadyRegister(address _customerAddr)internal returns(bool) {
    	for(uint i = 0; i < customers.length; i++) {
    		if(customers[i] == _customerAddr) {
    			return true;
    		}
    	}
    	return false;
    }


    function isMerchantAlreadyRegister(address _merchantAddr)internal returns(bool) {
        for(uint i = 0; i < merchants.length; i++) {
            if(merchants[i] == _merchantAddr) {
                return true;
            }
        }
        return false;
    }


    event SetCustomerPassword(address sender, string message);
    function setCustomerPassword(address _customerAddr, string _password) {
            customer[_customerAddr].password = stringToBytes32(_password);
            SetCustomerPassword(msg.sender, "设置密码成功");
    }


    event SetMerchantPassword(address sender, string message);
    function setMerchantPassword(address _merchantAddr, string _password) {
        merchant[_merchantAddr].password = stringToBytes32(_password);
        SetMerchantPassword(msg.sender, "设置密码成功");
    }


    function getCustomerPassword(address _customerAddr)constant returns(bool, bytes32) {

        if(isCustomerAlreadyRegister(_customerAddr)) {
            return (true, customer[_customerAddr].password);
        }
        else {
            return(false, "");
        }
    }


    function getMerchantPassword(address _merchantAddr)constant returns(bool, bytes32) {

        if(isMerchantAlreadyRegister(_merchantAddr)) {
            return (true, merchant[_merchantAddr].password);
        }
        else {
            return(false, "");
        }
    }


    event SendScoreToCustomer(address sender, string message);
	function sendScoreToCustomer(address _receiver, 
		uint _amount)onlyOwner {

        if(isCustomerAlreadyRegister(_receiver)) {

            issuedScoreAmount += _amount;
            customer[_receiver].scoreAmount += _amount;
            SendScoreToCustomer(msg.sender, "发行积分成功");
            return;
        }
        else {

            SendScoreToCustomer(msg.sender, "该账户未注册，发行积分失败");
            return;
        }
	}


	function getScoreWithCustomerAddr(address customerAddr)constant returns(uint) {
		return customer[customerAddr].scoreAmount;
	}


	function getScoreWithMerchantAddr(address merchantAddr)constant returns(uint) {
		return merchant[merchantAddr].scoreAmount;
	}


    event TransferScoreToAnother(address sender, string message);
	function transferScoreToAnother(uint _senderType, 
        address _sender, 
		address _receiver, 
		uint _amount) {
        string memory message;
        if(!isCustomerAlreadyRegister(_receiver) && !isMerchantAlreadyRegister(_receiver)) {

            TransferScoreToAnother(msg.sender, "目的账户不存在，请确认后再转移！");
            return;
        }
        if(_senderType == 0) {

            if(customer[_sender].scoreAmount >= _amount) {
                customer[_sender].scoreAmount -= _amount;
        
                if(isCustomerAlreadyRegister(_receiver)) {

                    customer[_receiver].scoreAmount += _amount;
                }else {
                    merchant[_receiver].scoreAmount += _amount;
                }
                TransferScoreToAnother(msg.sender, "积分转让成功！");
                return;
          }else {
                TransferScoreToAnother(msg.sender, "你的积分余额不足，转让失败！");
                return;
          }
        }else {

            if(merchant[_sender].scoreAmount >= _amount) {
                merchant[_sender].scoreAmount -= _amount;
                if(isCustomerAlreadyRegister(_receiver)) {

                    customer[_receiver].scoreAmount += _amount;
                }else {
                    merchant[_receiver].scoreAmount += _amount;
                }
                TransferScoreToAnother(msg.sender, "积分转让成功！");
                return;
            }else {
                 TransferScoreToAnother(msg.sender, "你的积分余额不足，转让失败！");
                 return;
            }
        }
	}


    function getIssuedScoreAmount()constant returns(uint) {
        return issuedScoreAmount;
    }


    event AddGood(address sender, bool isSuccess, string message);
	function addGood(address _merchantAddr, string _goodId, uint _price) {
        bytes32 tempId = stringToBytes32(_goodId);


        if(!isGoodAlreadyAdd(tempId)) {
            good[tempId].goodId = tempId;
            good[tempId].price = _price;
            good[tempId].belong = _merchantAddr;
            AddGood(msg.sender, true, "创建商品成功");
            return;
        }
        else {
            AddGood(msg.sender, false, "该件商品已经添加，请确认后操作");
            return;
        }
	}


    event PutGoodToArray(address sender, string message);
    function putGoodToArray(string _goodId) {
        goods.push(stringToBytes32(_goodId));  
        PutGoodToArray(msg.sender, "添加到全局商品数组成功");
    }


    event PutGoodToMerchant(address sender, string message);
    function putGoodToMerchant(address _merchantAddr, string _goodId) {
         merchant[_merchantAddr].sellGoods.push(stringToBytes32(_goodId)); 
         PutGoodToMerchant(msg.sender, "添加到商户的商品数组成功");
    }


	function getGoodsByMerchant(address _merchantAddr)constant returns(bytes32[]) {
		return merchant[_merchantAddr].sellGoods;
	}


    event BuyGood(address sender, bool isSuccess, string message);
    function buyGood(address _customerAddr, string _goodId) {

        bytes32 tempId = stringToBytes32(_goodId);
        if(isGoodAlreadyAdd(tempId)) {

            if(customer[_customerAddr].scoreAmount < good[tempId].price) {
                BuyGood(msg.sender, false, "余额不足，购买商品失败");
                return;
            }
            else {

                BuyGood(msg.sender, true, "购买商品成功");
                return;
            }
        }
        else {

            BuyGood(msg.sender, false, "输入商品Id不存在，请确定后购买");
            return;
        }
    }


    function buyGoodSuccess(address _customerAddr, string _goodId) {
         bytes32 tempId = stringToBytes32(_goodId);
         customer[_customerAddr].scoreAmount -= good[tempId].price;
         merchant[good[tempId].belong].scoreAmount += good[tempId].price;
         customer[_customerAddr].buyGoods.push(tempId);
    }


	function getGoodsByCustomer(address _customerAddr)constant returns(bytes32[]) {
		return customer[_customerAddr].buyGoods;
	}


    function isGoodAlreadyAdd(bytes32 _goodId)internal returns(bool) {
        for(uint i = 0; i < goods.length; i++) {
            if(goods[i] == _goodId) {
                return true;
            }
        }
        return false;
    }
}







