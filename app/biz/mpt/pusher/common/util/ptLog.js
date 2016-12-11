/* 
* @Author: gyp
* @Date:   2016-05-26 14:08:45
* @Last Modified by:   gyp
* @Last Modified time: 2016-08-28 17:18:12
* @description 通用打点js
*/
var _ = require('lodash');
var setUtmSource = function () {
    var utmSource = httpurl.uri.params.utm_source;
    if (utmSource) {
        sessionStorage.setItem('utm_source', utmSource);
    }
};

var getUtmSource = function () {
    var utm = httpurl.uri.params.utm_source ||
        sessionStorage.getItem('utm_source');
    return utm ? utm : '';
};

var httpurl = require('@beibei/httpurl');
var statistics = require('@beibei/statistics');//数据打点
var utmSource = getUtmSource();

var defaultConfig = {
	et: 'pageShow', //默认点击
	rid: '', //根据业务有可能不同
	json: {
        utm_source: utmSource ? utmSource : ''
    }
};

/**
 * [stat 触发统计]
 * @param  {[type]} paraObj [额外的统计参数]
 * @return {[type]}         [null]
 */
var stat = function(paraObj) {
    if (paraObj) {
        if (!paraObj.json) {
            paraObj.json = {};
        }

        paraObj.json.utm_source = utmSource ? utmSource : '';
    }

    var statObj = $.extend({}, defaultConfig, paraObj);
    
    statistics.sendLog(statObj);
};


// 打点初始化
var init = function (configObj) {
    //初始化参数
    $.extend(true, defaultConfig, configObj);
    stat(); //发送pageShow后 改变et为click;
    $.extend(true, defaultConfig, {et: 'click'});
    setUtmSource();
};

var setCommon = function(configObj) {
	$.extend(true, defaultConfig, configObj);
}

// .J_log统一的打点钩子
$(document).on('click', '.J_log', function(event) {
    var sendData = $(this).data(),
        parent = $(this).parent(),
        data = {},
        dirName;
    $.each(sendData, function(k, v){
        dirName = k.match(/^\w+(?=__)/);
        if(dirName && dirName.length > 0){
            // 拥有子目录
            dirName = dirName[0];
            data[dirName] = data[dirName] || {};
            data[dirName][k.replace(dirName + '__', '')] = v;
        } else {
            // 顶级目录
            data[k] = v;
        }
    });
    // mixin获取父元素属性
    var data = $.extend({}, $(this).parent().data(), data);

    stat(data);
});

var creater = function(opt) {
    init(opt);
    return {
        init: init,
        stat: stat,
        setCommon: setCommon
    }
}
module.exports = creater;
