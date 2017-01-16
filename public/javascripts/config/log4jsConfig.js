/**
 * Created by chenyufeng on 16/01/2017.
 */

/**
 * log使用规则：
 * （1）在项目中仍旧可以使用console.log()  /  console.error()的方式在控制台打印日志，但是这些日志无法记录在日志文件中；
 * （2）可以使用logger.info()等方式把日志记录在日志文件中；
 */
var log4js = require('log4js');
log4js.configure({
    appenders: [
        {type: 'console'},
        {
            type: 'file',
            filename: './log/HyperScore.log',
            maxLogSize: 1024000,
            backups: 10,
            category: 'normal'
        }
    ],
    replaceConsole: true
});

//参数要和category中的参数相同
var logger = log4js.getLogger('normal');
//如果设置为INFO，则不会打印出比INFO级别低的日志，如：DEBUG/TRACE.
//INFO级别及以上的日志会记录在日志文件中
//log级别：trace/debug/info/warn/error/fatal
logger.setLevel('INFO');

/**
 * 自动调整日志输出级别，设置为'auto';
 日志级别对应规则：
 http responses 3xx, level = WARN
 http responses 4xx & 5xx, level = ERROR
 else, level = INFO
 */
var connectLogLevel = 'auto';
var connectLogFormat = ':method :url';

module.exports = {
    logger: logger,
    connectLogLevel: connectLogLevel,
    connectLogFormat: connectLogFormat
};