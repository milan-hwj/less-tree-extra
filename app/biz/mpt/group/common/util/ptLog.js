/*
 * @Author: gyp
 * @Date:   2016-05-26 14:08:45
 * @Last Modified by:   yongpeng.guo
 * @Last Modified time: 2016-09-18 15:47:09
 * @description 拼团打点js
 */

import statistics from '@beibei/statistics'; // 数据打点
import env from '@beibei/env'; // 环境判断
import { setUtmSource, getUtmSource } from './tools';


var SCREEN = window.screen;
var OS = env.os.name,
    OS_VERSION = env.os.version.string || env.os.version,
    SCREEN_HEIGHT = SCREEN.height,
    SCREEN_WIDTH = SCREEN.width;


var defaultConfig = {
    entity_type: 'pintuan_item', // 标记为拼团业务,唯一标识不能动
    rid: '85980', // 拼团默认，根据业务有可能不同
    entity_list: '',
    json: {
        utm_source: getUtmSource(),
        os: OS,
        os_version: OS_VERSION,
        screen_height: SCREEN_HEIGHT,
        screen_width: SCREEN_WIDTH
    }
};


/**
 * @Author   yope
 * @description 一个简单的打点函数，想怎么打就怎么打，没有副作用
 * @param    {[type]}                 paraObj [description]
 * @return   {[type]}                         [description]
 */
var simpleStat = function (paraObj) {
    var config = {
        entity_type: 'pintuan_item', // 标记为拼团业务,唯一标识不能动,
        json: {
            os: OS,
            os_version: OS_VERSION,
            screen_height: SCREEN_HEIGHT,
            screen_width: SCREEN_WIDTH
        }
    };
    // 开发环境不打点
    if (process.env.NODE_ENV !== 'development') {
        statistics.sendLog(createStatObj(config, paraObj));
    }
};

/**
 * [stat 触发统计]
 * @param  {[type]} paraObj [额外的统计参数]
 * @return {[type]}         [null]
 */
var stat = function (paraObj) {
    // 开发环境不打点
    if (process.env.NODE_ENV !== 'development') {
        statistics.sendLog(createStatObj(defaultConfig, paraObj));
    }
};

/**
 * [createStatObj 构造封装打点对象]
 * @Author   yope
 * @DateTime 2016-08-16T20:11:10+0800
 * @param    {[Object]}           paraObj [待加工对象]
 * @return   {[Obejct]}                   [已加工对象]
 */
var createStatObj = function (config, paraObj) {
    if (paraObj) {
        if (!paraObj.json) {
            paraObj.json = {};
        }
    }

    return $.extend(true, {}, config, paraObj);
};

/**
 * [click 点击事件打点函数]
 * @Author   yope
 * @DateTime 2016-08-16T15:07:50+0800
 * @param    {[Object]}                 configObj [打点对象]
 * @return   {[undefined]}                           [无返回]
 * @description [configObj中应传递 entity_list]
 */
var click = function (configObj) {
    var obj = {
        et: 'click'
    };
    stat($.extend(true, {}, obj, configObj));
};

/**
 * [pageShow 曝光事件打点]
 * @Author   yope
 * @DateTime 2016-08-16T20:07:11+0800
 * @param    {[Object]}                 configObj [description]
 * @return   {[undefined]}                        [description]
 */
var pageShow = function (configObj) {
    var obj = {
        et: 'pageShow'
    };
    stat($.extend(true, {}, obj, configObj));
};

// 打点初始化
var init = function (configObj) {

    $.extend(true, defaultConfig, configObj);
    // pageshow打点
    pageShow(defaultConfig);

    setUtmSource();
};


// .J_log统一的打点钩子
$(document).on('click', '.J_log', function (event) {
    var sendData = $(this).data(),
        parent = $(this).parent(),
        recomId = parent.attr('data-recom_id'),
        rid = parent.attr('data-rid');
    // 规范使用 block_name
    sendData.block_name = sendData.block;

    // 判断是否是大数据推荐的商品
    var json = recomId ? $.extend(sendData, parent.data()) : sendData;

    var statObj = {
        json: json
    };

    if (sendData.entityid) {
        statObj.entity_list = sendData.entityid;
    }
    if (rid) {
        statObj.rid = rid;
    }
    click(statObj);
});

export default {
    init,
    stat,
    pageShow,
    simpleStat
};
