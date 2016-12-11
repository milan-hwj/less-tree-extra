/*eslint-disable */
'use strict';
var gutil = require('gulp-util');
var fileHandle   = require('../../fileHandle');
var xtpl = require('xtpl');
var util = require('../util');
var path = require('path');
var page = require('../page');

var _ = require('lodash');

var tpl = path.resolve(__dirname, './log.xtpl');
var main = {
    create: function(info, dateObj, isNow) {
        // info: {
        //     logOpt: {...},
        //     diffFiles: ['xxx/xxx/xx.*'],
        //     assets: [{
        //         name: 'xxx/xxx/xx-md5.*'
        //     }],
        //     entries: [{
        //         'mpt/group/hot': './mpt/group/hot/index.js'
        //     }]
        // }
        var time = util.dateFormat(dateObj);
        var htmlName = isNow ? 'today' : util.dateFormat(dateObj, "{YYYY}_{MM}_{DD}_{hh}_{mm}_{ss}");
        var title = time;

        var entries = main.dataFormat(info.entries);
        page.init(entries, info.logOpt);
        var pages = _.reduce(entries, function(memo, entry){
            memo[entry.name] = {
                name: page.getName(entry.name).name,
                url: page.getName(entry.name).url
            };
            return memo;
        }, {});
        xtpl.renderFile(tpl, _.extend(info, {
            title: title,
            time: time,
            pages: pages
        }),function(error,content){
            fileHandle.writeFile(info.logOpt.logPath + htmlName + '.html', content);
        });
    },
    dataFormat: function(entries) {
        return _.map(entries, function(v, k){
            return {
                name: k,
                value: v
            };
        });
    }
}

module.exports = main.create;
