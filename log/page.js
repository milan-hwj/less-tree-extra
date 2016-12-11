/*eslint-disable */
'use strict';
var _ = require('lodash');
var fileHandle = require('../fileHandle');

// 获取html的title
var getPageName = function(path, defaulValue) {
    var lines = fileHandle.readFile(path, true);
    var titleTag = lines.match(/<title>.*<\/title>/);
    var title = titleTag ? titleTag[0].slice(7, -8) : defaulValue;
    return title;
};

// 获取完整的url
var getUrl = function(base, params) {
    if (!params || _.isEmpty(params)) return base;
    return _.reduce(params, function(result, value, key) {
        result += (_.endsWith(result, '.html') ? '?' : '&') + key + '=' + value;
        return result;
    }, base);
};

var result = {};
var init = function(entries, logOpt) {
    var parameters = fileHandle.readFile(logOpt.logPath + 'config/parameters.json', true) || '{}';
    parameters = JSON.parse(parameters);
    result = _.reduce(entries, function(r, entry) {
        r[entry.name] = {
            name: getPageName(entry.value.replace('.js', '.html'), entry.name),
            url: getUrl(logOpt.domain + entry.name + '.html', parameters[entry.name])
        };
        return r;
    }, {});
};
var getName = function(pathname) {
    return result[pathname];
};

module.exports = {
    init: init,
    getName: getName
};
