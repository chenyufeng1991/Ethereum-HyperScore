pragma solidity ^0.4.2;

//测试类：该合约不需要迁移
//供外部调用测试交易方法、常量方法、event的使用
contract Test {
    uint age;

    event SetAge(address sender, uint age);
    function setAge(uint _age) {
        age = _age;
        SetAge(msg.sender, age);
    }

    function getAge()constant returns(uint) {
        return age;
    }
}

//工具类：该合约不需要迁移
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

//主合约：该合约需要迁移
contract Score is Utils, Test {

    address owner; //合约的拥有者，银行
    uint totalIssuedScore; //银行发行的积分总数
    uint totalSettledScore; //银行已经清算的积分总数

    //交易状态
    enum TxType{Unknown, Issue, Transfer, Buy, Settle}
   
    struct Manager {
        address managerAddr; //银行管理员address
        bytes32 phone; //管理员手机
        bytes32 password; //管理员密码
        uint issuedScore; //该管理员发行的积分总数
    }

    struct Customer {
        address customerAddr; //客户address
        bytes32 phone; //客户手机
        bytes32 password; //客户密码
        uint score; //积分余额
        bytes32[] buyGoods; //购买的商品数组
    }

    struct Merchant {
        address merchantAddr; //商户address
        bytes32 phone; //商户手机
        bytes32 password; //商户密码
        uint score; //积分余额
        bytes32[] sellGoods; //发布的商品数组
    }

    struct Good {
        bytes32 goodId; //商品Id;
        bytes32 goodName; //商品名称；
        uint goodPrice; //价格；
        address merchantAddr; //商品属于哪个商户address；
    }

    struct Transaction {
        bytes32 txHash; //交易hash
        TxType txType; //交易状态
        bytes32 sender; //发送者手机号
        bytes32 receiver; //接收者手机号
        uint score; //积分数量
    }

    mapping (address=>Customer) customer; 
    mapping (bytes32=>address) customerPhone; //根据用户手机查找账户address

    mapping (address=>Merchant) merchant; 
    mapping (bytes32=>address) merchantPhone; //根据商户手机查找账户address

    mapping (address=>Manager) manager;
    mapping (bytes32=>address) managerPhone; //根据管理员手机查找账户address

    mapping (bytes32=>Good) good; //根据商品Id查找该件商品

    mapping (bytes32=>Transaction) transaction; //根据交易hash查找交易

    address[] customerAddrs; //已注册的客户地址数组
    bytes32[] customerPhones; //已注册的客户手机数组

    address[] merchantAddrs; //已注册的商户地址数组
    bytes32[] merchantPhones; //已注册的商户手机数组

    address[] managerAddrs; //已注册的管理员地址数组
    bytes32[] managerPhones; //已注册的管理员手机数组

    bytes32[] goods; //已经上线的商品id数组

    bytes32[] transactions; //所有涉及积分的交易hash

    //增加权限控制，某些方法只能由合约的创建者调用
    modifier onlyOwner(){
        if(msg.sender != owner) throw;
        _;
    }

    //构造函数
    function Score() {
        owner = msg.sender;
    }

    //注册一个银行管理员
    event RegisterManager(address sender, uint statusCode, string message);
    function registerManager(address _managerAddr, 
        string _phone, 
        string _password) {
        bytes32 tempPhone = stringToBytes32(_phone);
        bytes32 tempPassword = stringToBytes32(_password);

        //判断该账号是否已经注册
        if(!isManagerAlreadyRegister(_phone)) {
            //还未注册
            manager[_managerAddr].managerAddr = _managerAddr;
            manager[_managerAddr].phone = tempPhone;
            manager[_managerAddr].password = tempPassword;

            managerPhone[tempPhone] = _managerAddr;
            managerAddrs.push(_managerAddr);
            managerPhones.push(tempPhone);

            RegisterManager(msg.sender, 0, "管理员注册成功");
            return;
        }
        else {
            //已经注册
            RegisterManager(msg.sender, 1, "该管理员已经注册");
            return;
        }
    }

    //登录一个银行管理员
    event LoginManager(address sender, uint statusCode, string message);
    function loginManager(string _phone, 
        string _password) {
        //判断是否已经注册
        if(isManagerAlreadyRegister(_phone)) {
            //已经注册，可以进行登录操作
            address tempAddr = managerPhone[stringToBytes32(_phone)];
            if(stringToBytes32(_password) == manager[tempAddr].password) {
                //登录成功
                LoginManager(msg.sender, 0, "管理员登录成功");
                return;
            }
            else {
                //登录失败
                LoginManager(msg.sender, 1, "管理员密码错误，登录失败");
                return;
            }
        }
        else {
            //还未注册
            LoginManager(msg.sender, 1, "该管理员未注册，请确认后登录");
            return;
        }
    }

    //查询银行管理员的详细信息,已登录的管理员调用
    function getManagerInfo(string _phone)constant returns(address, bytes32, uint, uint, uint) {
        address tempAddr = managerPhone[stringToBytes32(_phone)];
        return (manager[tempAddr].managerAddr, manager[tempAddr].phone, manager[tempAddr].issuedScore, totalIssuedScore, totalSettledScore);
    }

    //注册一个客户
    event RegisterCustomer(address sender, uint statusCode, string message);
    function registerCustomer(address _customerAddr, 
        string _phone, 
        string _password) {
        bytes32 tempPhone = stringToBytes32(_phone);
        bytes32 tempPassword = stringToBytes32(_password);

        //判断是否已经注册
        if(!isCustomerAlreadyRegister(_phone)) {
            //还未注册
            customer[_customerAddr].customerAddr = _customerAddr;
            customer[_customerAddr].phone = tempPhone;
            customer[_customerAddr].password = tempPassword;

            customerPhone[tempPhone] = _customerAddr;
            customerAddrs.push(_customerAddr);
            customerPhones.push(tempPhone);
            RegisterCustomer(msg.sender, 0, "用户注册成功");
            return;
        }
        else {
            RegisterCustomer(msg.sender, 1, "该用户已经注册");
            return;
        }
    }

    //登录一个客户
    event LoginCustomer(address sender, uint statusCode, string message);
    function loginCustomer(string _phone, 
        string _password) {
        //判断是否已经注册
        if(isCustomerAlreadyRegister(_phone)) {
            //已经注册，可以进行登录操作
            address tempAddr = customerPhone[stringToBytes32(_phone)];
            if(stringToBytes32(_password) == customer[tempAddr].password) {
                //登录成功
                LoginCustomer(msg.sender, 0, "用户登录成功");
                return;
            }
            else {
                //登录失败
                LoginCustomer(msg.sender, 1, "用户密码错误，登录失败");
                return;
            }
        }
        else {
            //还未注册
            LoginCustomer(msg.sender, 1, "该用户未注册，请确认后登录");
            return;
        }
    }

    //查询客户的详细信息,已登录的用户调用
    function getCustomerInfo(string _phone)constant returns(address, bytes32, uint) {
        address tempAddr = customerPhone[stringToBytes32(_phone)];
        return (customer[tempAddr].customerAddr, customer[tempAddr].phone, customer[tempAddr].score);
    }


    //注册一个商户
    event RegisterMerchant(address sender, uint statusCode, string message);
    function registerMerchant(address _merchantAddr, 
        string _phone, 
        string _password) {
        bytes32 tempPhone = stringToBytes32(_phone);
        bytes32 tempPassword = stringToBytes32(_password);

        //判断是否已经注册
        if(!isMerchantAlreadyRegister(_phone)) {
            //还未注册
            merchant[_merchantAddr].merchantAddr = _merchantAddr;
            merchant[_merchantAddr].phone = tempPhone;
            merchant[_merchantAddr].password = tempPassword;

            merchantPhone[tempPhone] = _merchantAddr;
            merchantAddrs.push(_merchantAddr);
            merchantPhones.push(tempPhone);
            RegisterMerchant(msg.sender, 0, "商户注册成功");
            return;
        }
        else {
            RegisterMerchant(msg.sender, 1, "该商户已经注册");
            return;
        }
    }

    //登录一个商户
    event LoginMerchant(address sender, uint statusCode, string message);
    function loginMerchant(string _phone, 
        string _password) {
        //判断是否已经注册
        if(isMerchantAlreadyRegister(_phone)) {
            //已经注册，可以进行登录操作
            address tempAddr = merchantPhone[stringToBytes32(_phone)];
            if(stringToBytes32(_password) == merchant[tempAddr].password) {
                //登录成功
                LoginMerchant(msg.sender, 0, "商户登录成功");
                return;
            }
            else {
                //登录失败
                LoginMerchant(msg.sender, 1, "商户密码错误，登录失败");
                return;
            }
        }
        else {
            //还未注册
            LoginMerchant(msg.sender, 1, "该商户未注册，请确认后登录");
            return;
        }
    }

    //查询商户的详细信息,已登录的商户调用
    function getMerchantInfo(string _phone)constant returns(address, bytes32, uint) {
        address tempAddr = merchantPhone[stringToBytes32(_phone)];
        return (merchant[tempAddr].merchantAddr, merchant[tempAddr].phone, merchant[tempAddr].score);
    }

    //判断一个管理员是否已经注册
    function isManagerAlreadyRegister(string _phone)internal returns(bool) {
        bytes32 tempPhone = stringToBytes32(_phone);
        for(uint i = 0; i < managerPhones.length; i++) {
            if(managerPhones[i] == tempPhone) {
                return true;
            }
        }
        return false;
    }

    //判断一个客户是否已经注册
    function isCustomerAlreadyRegister(string _phone)internal returns(bool) {
        bytes32 tempPhone = stringToBytes32(_phone);
        for(uint i = 0; i < customerPhones.length; i++) {
            if(customerPhones[i] == tempPhone) {
                return true;
            }
        }
        return false;
    }

    //判断一个商户是否已经注册
    function isMerchantAlreadyRegister(string _phone)internal returns(bool) {
        bytes32 tempPhone = stringToBytes32(_phone);
        for(uint i = 0; i < merchantPhones.length; i++) {
            if(merchantPhones[i] == tempPhone) {
                return true;
            }
        }
        return false;
    }


    //管理员发送积分给客户,只能发送给客户
    event IssueScore(address sender, uint statusCode, string message);
    function issueScore(string _managerPhone ,
        string _customerPhone, 
        uint _score)onlyOwner {
        bytes32 tempManagerPhone = stringToBytes32(_managerPhone);
        bytes32 tempCustomerPhone = stringToBytes32(_customerPhone);

        if(isCustomerAlreadyRegister(_customerPhone)) {
            //已经注册
            address tempManagerAddr = managerPhone[tempManagerPhone];
            address tempCustomerAddr = customerPhone[tempCustomerPhone];
            
            totalIssuedScore += _score;
            customer[tempCustomerAddr].score += _score;
            manager[tempManagerAddr].issuedScore += _score;
            IssueScore(msg.sender, 0, "发行积分成功");
            return;
        }
        else {
            //还没注册
            IssueScore(msg.sender, 1, "该账户未注册，发行积分失败");
            return;
        }
    }

    //商户和银行之间清算积分
    event SettleScore(address sender, uint statusCode, string message);
    function settleScore(string _phone, 
        uint _score) {
        bytes32 tempPhone = stringToBytes32(_phone);
        address tempAddr = merchantPhone[tempPhone];
        if(merchant[tempAddr].score >= _score) {
            //可以清算
            merchant[tempAddr].score -= _score;
            totalSettledScore += _score;
            SettleScore(msg.sender, 0, "商户积分清算成功");
            return;
        }
        else {
            //余额不足，清算失败
            SettleScore(msg.sender, 1, "积分余额不足，清算失败");
            return;
        }
    }

    //两个账户转移积分，任意两个账户之间都可以转移，客户商户都调用该方法
    //_senderType表示调用者类型，0表示客户，1表示商户
    event TransferScore(address sender, uint statusCode, string message);
    function transferScore(uint _senderType, 
        string _sender, 
        string _receiver, 
        uint _score) {

        if(!isCustomerAlreadyRegister(_receiver) && !isMerchantAlreadyRegister(_receiver)){
            //目的账户不存在
            TransferScore(msg.sender, 1, "目标账户不存在，请确认后再转移！");
            return;
        }

        bytes32 tempSenderPhone = stringToBytes32(_sender);
        bytes32 tempReceivedPhone = stringToBytes32(_receiver);
        address tempSenderAddr;
        address tempReceivedAddr;
        
        if(_senderType == 0) {
            //客户转移
            tempSenderAddr = customerPhone[tempSenderPhone];
            if(customer[tempSenderAddr].score >= _score) {
                customer[tempSenderAddr].score -= _score;
        
                if(isCustomerAlreadyRegister(_receiver)) {
                    //目的地址是客户
                    tempReceivedAddr = customerPhone[tempReceivedPhone];
                    customer[tempReceivedAddr].score += _score;
                }
                else {
                    //目的地址是商户
                    tempReceivedAddr = merchantPhone[tempReceivedPhone];
                    merchant[tempReceivedAddr].score += _score;
                }
                TransferScore(msg.sender, 0, "积分转让成功！");
                return;
            }
            else {
                TransferScore(msg.sender, 1, "你的积分余额不足，转让失败！");
                return;
            }
        }
        else {
            //商户转移
            tempSenderAddr = merchantPhone[tempSenderPhone];
            if(merchant[tempSenderAddr].score >= _score) {
                merchant[tempSenderAddr].score -= _score;
                if(isCustomerAlreadyRegister(_receiver)) {
                    //目的地址是客户
                    tempReceivedAddr = customerPhone[tempReceivedPhone];
                    customer[tempReceivedAddr].score += _score;
                }
                else {
                    //目的地址是商户
                    tempReceivedAddr = merchantPhone[tempReceivedPhone];
                    merchant[tempReceivedAddr].score += _score;
                }
                TransferScore(msg.sender, 0, "积分转让成功！");
                return;
            }
            else {
                TransferScore(msg.sender, 1, "你的积分余额不足，转让失败！");
                return;
            }
        }
    }

    //商户添加一件商品
    event AddGood(address sender, uint statusCode, string message);
    function addGood(string _phone, 
        string _goodId, 
        string _goodName, 
        uint _goodPrice) {
        bytes32 tempPhone = stringToBytes32(_phone);
        bytes32 tempGoodId = stringToBytes32(_goodId);
        bytes32 tempName = stringToBytes32(_goodName);
        address tempMerchantAddr = merchantPhone[tempPhone]; 

        //首先判断该商品Id是否已经存在
        if(!isGoodAlreadyAdd(_goodId)) {
            good[tempGoodId].goodId = tempGoodId;
            good[tempGoodId].goodName = tempName;
            good[tempGoodId].goodPrice = _goodPrice;
            good[tempGoodId].merchantAddr = tempMerchantAddr;

            goods.push(tempGoodId);
            merchant[tempMerchantAddr].sellGoods.push(tempGoodId);
            AddGood(msg.sender, 0, "商户添加商品成功");
            return;
        }
        else {
            AddGood(msg.sender, 1, "该件商品已经添加，请确认后操作");
            return;
        }
    }

    //首先判断输入的商品Id是否存在
    function isGoodAlreadyAdd(string _goodId)internal returns(bool) {
        bytes32 tempGoodId = stringToBytes32(_goodId);
        for(uint i = 0; i < goods.length; i++) {
            if(goods[i] == tempGoodId) {
                return true;
            }
        }
        return false;
    }

    //商户查找自己的商品数组
    function getGoodsByMerchant(string _phone)constant returns(bytes32[]) {
        bytes32 tempPhone = stringToBytes32(_phone);
        address tempMerchantAddr = merchantPhone[tempPhone];
        return merchant[tempMerchantAddr].sellGoods;
    }

    //用户用积分购买一件商品,后台需要获得商品价格，使用event返回
    event BuyGood(address sender, uint statusCode, string message, uint goodPrice, bytes32 merchantPhone);
    function buyGood(string _phone, 
        string _goodId) {
        //首先判断输入的商品Id是否存在
        bytes32 tempGoodId = stringToBytes32(_goodId);
        bytes32 tempPhone = stringToBytes32(_phone);
        address customerAddr = customerPhone[tempPhone];
        address merchantAddr = good[tempGoodId].merchantAddr;
        bytes32 merchantPhone = merchant[merchantAddr].phone;
        uint goodPrice = good[tempGoodId].goodPrice;

        if(isGoodAlreadyAdd(_goodId)) {
            //该件商品已经添加，可以购买
            if(customer[customerAddr].score >= goodPrice) {
                customer[customerAddr].score -= goodPrice;
                merchant[merchantAddr].score += goodPrice;
                customer[customerAddr].buyGoods.push(tempGoodId);

                BuyGood(msg.sender, 0, "用户购买商品成功", goodPrice, merchantPhone);
                return;
            }
            else {
                //对这里的方法抽取      
                BuyGood(msg.sender, 1, "余额不足，购买商品失败", goodPrice, merchantPhone);
                return;
            }
        }
        else {
            //没有这个Id的商品
            BuyGood(msg.sender, 1, "输入商品Id不存在，请确定后购买", goodPrice, merchantPhone);
            return;
        }
    }

    //客户查找自己已购买的商品数组
    function getGoodsByCustomer(string _phone)constant returns(bytes32[]) {
        bytes32 tempPhone = stringToBytes32(_phone);
        address tempCustomerAddr = customerPhone[tempPhone];
        return customer[tempCustomerAddr].buyGoods;
    }

    //添加一次交易信息，应该是被外部调用的
    event AddTransaction(address sender, uint statusCode, string message);
    function addTransaction(bytes32 _txHash,
        TxType _txType, 
        string _sender, 
        string _receiver, 
        uint _score) {
        bytes32 tempSenderPhone = stringToBytes32(_sender);
        bytes32 tempReceiverPhone = stringToBytes32(_receiver);

        transaction[_txHash].txHash = _txHash;
        transaction[_txHash].txType = _txType;
        transaction[_txHash].sender = tempSenderPhone;
        transaction[_txHash].receiver = tempReceiverPhone;
        transaction[_txHash].score = _score;

        transactions.push(_txHash);

        AddTransaction(msg.sender, 0, "添加交易成功");
    }

    //for contract migrate:setter/getter
    function getOwner()constant returns(address) {
        return owner;
    }

    function setOwner(address _owner) {
        owner = _owner;
    }

    function getTotalIssuedScore()constant returns(uint) {
        return totalIssuedScore;
    }

    function setTotalIssuedScore(uint _totalIssuedScore) {
        totalIssuedScore = _totalIssuedScore;
    }

    function getTotalSettledScore()constant returns(uint) {
        return totalSettledScore;
    }

    function setTotalSettledScore(uint _totalSettledScore) {
        totalSettledScore = _totalSettledScore;
    }

    //关于客户合约迁移方法
    function getCustomerAddrs()constant returns(address[]) {
        return customerAddrs;
    }

    function setCustomerAddrs(address[] _customerAddrs) {
        customerAddrs = _customerAddrs;
    }

    function getCustomerPhones()constant returns(bytes32[]) {
        return customerPhones;
    }

    function setCustomerPhones(string _customerPhones) {
        customerPhones.push(stringToBytes32(_customerPhones));
    }

    function getMerchantAddrs()constant returns(address[]) {
        return merchantAddrs;
    }

    function setMerchantAddrs(address[] _merchantAddrs) {
        merchantAddrs = _merchantAddrs;
    }

    function getMerchantPhones()constant returns(bytes32[]) {
        return merchantPhones;
    }

    function setMerchantPhones(bytes32[] _merchantPhones) {
        merchantPhones = _merchantPhones;
    }

    function getManagerAddrs()constant returns(address[]) {
        return managerAddrs;
    }

    function setManagerAddrs(address[] _managerAddrs) {
        managerAddrs = _managerAddrs;
    }

    function getManagerPhones()constant returns(bytes32[]) {
        return managerPhones;
    }

    function setManagerPhones(bytes32[] _managerPhones) {
        managerPhones = _managerPhones;
    }

    function getGoods()constant returns(bytes32[]) {
        return goods;
    }

    function setGoods(bytes32[] _goods) {
        goods = _goods;
    }

    function getTransactions()constant returns(bytes32[]) {
        return transactions;
    }

    function setTransactions(bytes32[] _transactions) {
        transactions = _transactions;
    }
    
    function getCustomer(address _customerAddr)constant returns(address, bytes32, bytes32, uint, bytes32[]) {
        return (customer[_customerAddr].customerAddr, customer[_customerAddr].phone, customer[_customerAddr].password, customer[_customerAddr].score, customer[_customerAddr].buyGoods);
    }

    function setCustomer(address _customerAddr, 
        string _phone, 
        string _password, 
        uint _score, 
        bytes32[] _buyGoods) {

        bytes32 tempPhone = stringToBytes32(_phone);
        bytes32 tempPassword = stringToBytes32(_password);

        customer[_customerAddr].customerAddr = _customerAddr;
        customer[_customerAddr].phone = tempPhone;
        customer[_customerAddr].password = tempPassword;
        customer[_customerAddr].score = _score;
        customer[_customerAddr].buyGoods = _buyGoods;
    }

    function getCustomerPhone(string _customerPhone)constant returns(address) {
        bytes32 tempCustomerPhone = stringToBytes32(_customerPhone);
        return (customerPhone[tempCustomerPhone]);
    }

    function setCustomerPhone(string _customerPhone, 
        address _customerAddr) {
        bytes32 tempCustomerPhone = stringToBytes32(_customerPhone);
        customerPhone[tempCustomerPhone] = _customerAddr;
    }
    
    function getMerchant(address _merchantAddr)constant returns(address, bytes32, bytes32, uint, bytes32[]) {
        return (merchant[_merchantAddr].merchantAddr, merchant[_merchantAddr].phone, merchant[_merchantAddr].password, merchant[_merchantAddr].score, merchant[_merchantAddr].sellGoods);
    }

    function setMerchant(address _merchantAddr, 
        bytes32 _phone, 
        bytes32 _password, 
        uint _score, 
        bytes32[] _sellGoods) {
        merchant[_merchantAddr].merchantAddr = _merchantAddr;
        merchant[_merchantAddr].phone = _phone;
        merchant[_merchantAddr].password = _password;
        merchant[_merchantAddr].score = _score;
        merchant[_merchantAddr].sellGoods = _sellGoods;
    }
    
    function getMerchantPhone(bytes32 _merchantPhone)constant returns(address) {
        return merchantPhone[_merchantPhone];
    }

    function setMerchantPhone(bytes32 _merchantPhone, 
        address _merchantAddr) {
        merchantPhone[_merchantPhone] = _merchantAddr;
    }
    
    function getManager(address _managerAddr)constant returns(address, bytes32, bytes32, uint) {
        return(manager[_managerAddr].managerAddr, manager[_managerAddr].phone, manager[_managerAddr].password, manager[_managerAddr].issuedScore);
    }

    function setManager(address _managerAddr, 
        bytes32 _phone, 
        bytes32 _password, 
        uint _issuedScore) {
        manager[_managerAddr].managerAddr = _managerAddr;
        manager[_managerAddr].phone = _phone;
        manager[_managerAddr].password = _password;
        manager[_managerAddr].issuedScore = _issuedScore;
    }

    function getManagerPhone(bytes32 _managerPhone)constant returns(address) {
        return managerPhone[_managerPhone];
    }

    function setManagerPhone(bytes32 _managerPhone, 
        address _managerAddr) {
        managerPhone[_managerPhone] = _managerAddr;
    }
    
    function getGood(bytes32 _goodId)constant returns(bytes32, bytes32, uint, address) {
        return(good[_goodId].goodId, good[_goodId].goodName, good[_goodId].goodPrice, good[_goodId].merchantAddr);
    }

    function setGood(bytes32 _goodId, 
        bytes32 _goodName, 
        uint _goodPrice, 
        address _merchantAddr) {
        good[_goodId].goodId = _goodId;
        good[_goodId].goodName = _goodName;
        good[_goodId].goodPrice = _goodPrice;
        good[_goodId].merchantAddr = _merchantAddr;
    }
    
    function getTransaction(bytes32 _txHash)constant returns(bytes32, TxType, bytes32, bytes32, uint) {
        return (transaction[_txHash].txHash, transaction[_txHash].txType, transaction[_txHash].sender, transaction[_txHash].receiver, transaction[_txHash].score);
    }

    function setTransaction(bytes32 _txHash, 
        TxType _txType, 
        bytes32 _sender, 
        bytes32 _receiver, 
        uint _score) {
        transaction[_txHash].txHash = _txHash;
        transaction[_txHash].txType = _txType;
        transaction[_txHash].sender = _sender;
        transaction[_txHash].receiver = _receiver;
        transaction[_txHash].score = _score;
    }
}







