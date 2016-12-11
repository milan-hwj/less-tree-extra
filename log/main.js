/*eslint-disable */
'use strict';
var gutil = require('gulp-util');
var _ = require('lodash');
var path = require('path');
var less = require('less');
var fileHandle = require('../fileHandle');
var createReleaseLog = require('./today-log/main');
var appendHistoryLog = require('./version-list/main');

var main = {
    log: function(str) {
        // 打印日志
        gutil.log(str);
    },
    createLogFile: function(logOpt, diffFiles, assets, entries, spendTime) {
        // logOpt: {
        //     logPath: './xxx/', default: './html/mpt/release/'
        // }
        // diffFiles: 
        // { 'mpt/group/hot/index.js': true }
        //
        // assets:
        // [ { name: 'mpt_static/mpt/group/hot-d5ff433b.js',
        //   size: 116744,
        //   chunks: [ 0 ],
        //   chunkNames: [ 'mpt/group/hot' ],
        //   emitted: true },
        // { name: 'mpt_static/mpt/group/hot-81527e28.css',
        //   size: 22821,
        //   chunks: [ 0 ],
        //   chunkNames: [ 'mpt/group/hot' ],
        //   emitted: true },
        // { name: './html/mpt/group/hot.html',
        //   size: 3982,
        //   chunks: [],
        //   chunkNames: [],
        //   emitted: true } ]
        //
        //   entries: { 'mpt/group/hot': '././app/biz/mpt/group/hot/index.js' }
        //
        //  spendTime: 1024 单位:s
        main.opt = {
            logOpt: logOpt,
            diffFiles: diffFiles,
            assets: assets,
            entries: entries
        };
        // 格式化数据
        main.dataFormat();

        var now = new Date();
        // 生成最新发布日志
        createReleaseLog(main.opt, now, true);
        // 生成对应日期的日志明细
        createReleaseLog(main.opt, now);
        // 追加历史日志列表
        appendHistoryLog(main.opt, now, spendTime);
        // 生成css
        main.createCss(logOpt.logPath);
    },
    dataFormat: function() {
        // { 'mpt/group/hot/index.js': true }
        // =>
        // ['mpt/group/hot/index.js']
        main.opt.diffFiles = _.map(main.opt.diffFiles, function(v, k){
            return k;
        });
        // { 'mpt/group/hot': '././app/biz/mpt/group/hot/index.js' }
        // =>
        // ['mpt/group/hot']
        // main.opt.entries = _.map(main.opt.entries, function(v, k){
        //     return k;
        // });
    },
    createCss: function(logPath) {
        // 创建css
        var lessPath = path.resolve(__dirname, './index.less');
        var cssPath = logPath + 'index.css';
        var content = fileHandle.readFile(lessPath, true);
        less.render(content, {
        }, function (e, output) {
            fileHandle.writeFile(cssPath, output.css)
        });
    }
};

module.exports = {
    log: main.log,
    createLogFile: main.createLogFile
};
