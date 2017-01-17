/**
 * Created by chenyufeng on 17/01/2017.
 */

/**
 * 测试log4js日志
 */
var log4js = require('log4js');
var log4jsConfig = require('../config/log4jsConfig');
log4js.configure(log4jsConfig.config('../../../log/test_log4js.log'));
var logger = log4jsConfig.logger;

console.log("默认打印");
logger.info("logger打印");
