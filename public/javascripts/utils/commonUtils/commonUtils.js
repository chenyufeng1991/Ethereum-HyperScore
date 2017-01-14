/**
 * 项目常见工具类封装
 *
 * @param hexCharCodeStr
 * @returns {*}
 */

var crypto = require('crypto');

//十六进制转化为字符串
module.exports.hexCharCodeToStr = function (hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr =
        trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
    var len = rawStr.length;
    if (len % 2 !== 0) {
        alert("Illegal Format ASCII Code!");
        return "";
    }
    var curCharCode;
    var resultStr = [];
    for (var i = 0; i < len; i = i + 2) {
        curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
        //ASCII=0是控制字符，也是空字符，进行过滤
        if (curCharCode !== 0) {
            resultStr.push(String.fromCharCode(curCharCode));
        }
    }
    return resultStr.join("");
};

//MD5散列
module.exports.toMD5 = function (str) {
    var md5 = crypto.createHash('md5');
    return md5.update(str).digest('hex');
};