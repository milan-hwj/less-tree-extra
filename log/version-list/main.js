/*eslint-disable */
'use strict';
var fileHandle   = require('../../fileHandle');
var xtpl = require('xtpl');
var util = require('../util');
var path = require('path');

var _ = require('lodash');

var tpl = path.resolve(__dirname, './log.xtpl');
var main = {
    create: function(info, dateObj, spendTime) {
        // 生成发布日志列表
        var releaseTime = util.dateFormat(dateObj);
        var fileName = util.dateFormat(dateObj, "{YYYY}_{MM}_{DD}_{hh}_{mm}_{ss}");
        // 最新发布插入最前面
        var historyList = fileHandle.readFile(info.logOpt.logPath + 'history/history.json', true) || '[]';
        historyList = JSON.parse(historyList);
        historyList.splice(0, 0, {
            releaseTime: releaseTime,
            spendTime: Math.ceil(spendTime),
            fileName: fileName
        });
        // 写回记录文件
        fileHandle.writeFile(info.logOpt.logPath + 'history/history.json', JSON.stringify(historyList));
        // 生成html
        xtpl.renderFile(tpl, historyList, function(error,content){
            fileHandle.writeFile(info.logOpt.logPath + 'list.html', content);
        });
    }
}

module.exports = main.create;

