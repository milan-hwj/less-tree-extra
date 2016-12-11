/*
 * @Author: gyp
 * @Date:   2016-09-09 10:16:02
 * @Last Modified by:   gyp
 * @Last Modified time: 2016-09-09 15:44:10
 */

'use strict';
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';

// less
import './index.less';
// less end

// import template from "unit/libs/lib-template/2.0.0/template";
import Xtemplate from 'xtemplate/lib/runtime'; // 模板js
import loc from "unit/common/js/location/loc";
import wx from "unit/common/js/wx/wx";
import env from "@beibei/env";
import * as muiLoading from "unit/common/widget/pintuan/muiLoading/muiLoading";
import * as httpapi from "@beibei/httpurl";

// 模板
import provinceTpl from './province.xtpl';


const uri = httpapi.uri;
const pid = uri.params.pid;
let locSuccess = false;

isp();

// 呕心沥血之作
const provinces = {
    "A": [{ c: "340000", n: "安徽" }],
    "B": [{ c: "110000", n: "北京" }],
    "C": [{ c: "500000", n: "重庆" }],
    "F": [{ c: "350000", n: "福建" }],
    "G": [{ c: "620000", n: "甘肃" }, { c: "440000", n: "广东" }, { c: "450000", n: "广西" }, { c: "520000", n: "贵州" }],
    "H": [{ c: "460000", n: "海南" }, { c: "130000", n: "河北" }, { c: "410000", n: "河南" }, { c: "230000", n: "黑龙江" }, { c: "420000", n: "湖北" }, { c: "430000", n: "湖南" }],
    "J": [{ c: "320000", n: "江苏" }, { c: "360000", n: "江西" }, { c: "220000", n: "吉林" }],
    "L": [{ c: "210000", n: "辽宁" }],
    "N": [{ c: "150000", n: "内蒙古" }, { c: "640000", n: "宁夏" }],
    "Q": [{ c: "630000", n: "青海" }],
    "S": [{ c: "610000", n: "陕西" }, { c: "370000", n: "山东" }, { c: "310000", n: "上海" }, { c: "140000", n: "山西" }, { c: "510000", n: "四川" }],
    "T": [{ c: "120000", n: "天津" }],
    "X": [{ c: "650000", n: "新疆" }, { c: "540000", n: "西藏" }],
    "Y": [{ c: "530000", n: "云南" }],
    "Z": [{ c: "330000", n: "浙江" }]
};

const getLocation = () => {
    // 定位初始化，ready后执行回调
    loc.init(() => {
        //移除loading
        muiLoading.remove();
        // 快速定位，返回 地址信息Obj
        loc.quickLocate((locObj) => {
            if (locObj.addressComponents && locObj.addressComponents.province) { //存在省信息
                const locP = (locObj.addressComponents.province + '').slice(0, 2);
                const curP = locProvince(provinces, locP);
                if (curP.n && curP.c) {
                    $('.J_p-success').attr('data-pid', curP.c).text(curP.n);
                    locSuccess = true;
                } else {
                    // 定位失败 
                    $('.J_p-fail').removeClass('hidden');
                    $('.J_p-success').addClass('hidden');
                }

            }
        });
    });

    setTimeout(() => {
        if (!locSuccess) {
            // 定位失败 
            $('.J_p-fail').removeClass('hidden');
            $('.J_p-success').addClass('hidden');
        }
    }, 6000);
};

/**
 * [locProvince description]
 * @param  {[type]} pName [定位得到的省份]
 * @return {[type]}       [description]
 */
const locProvince = (provinces, pName) => {
    let obj = {};

    for (let prop in provinces) {
        provinces[prop].forEach((el, index) => {
            if (pName == el.n) {
                obj.n = el.n;
                obj.c = el.c;
            }
        });
    }
    return obj;
};

const renderProvince = (p) => {
    const html = new Xtemplate(provinceTpl).render({
        data: p
    });
    $('#J_province-selector').append(html);
};

const bindEvent = () => {
    $(document).on('tap', '.J_province', function(event) {
        event.preventDefault();
        const pid = $(this).data('pid');
        const name = $(this).text();
        redirect(pid, name);
    });

    $(document).on('tap', '.J_cur_p', function(event) {
        event.preventDefault();
        const name = $(this).find('.J_cur').text();
        const pid = $(this).data('pid');
        redirect(pid, name);
    });

    $(document).on('tap', '.J_loc-address', function(event) {
        event.preventDefault();
        const pid = $(this).find('.J_p-success').data('pid');
        if (pid) {
            const name = $(this).find('.J_p-success').text();
            redirect(pid, name);
        }
    });
};

const redirect = (pid, name) => {
    if (uri.params.redirecturl) {
        const url = decodeURIComponent(uri.params.redirecturl);
        if (url.indexOf('?') !== -1) {
            location.href = url + '&pid=' + pid + '&province=' + name;
        } else {
            location.href = url + '?pid=' + pid + '&province=' + name;
        }
    } else {
        console.log('无效的跳转地址');
    }
};


const curProvince = (provinces, pid) => {
    let name = '全国';

    for (let prop in provinces) {
        provinces[prop].forEach((el, index) => {
            if (pid == el.c) {
                name = el.n;
            }
        });
    }

    $('.J_cur').text(name);
    $('.J_cur_p').data('pid', pid)
};


const initWx = () => {
    if (env.app.isWeixin) {
        wx.config(() => {
            wx.shareConfig({
                title: '贝贝拼团',
                desc: '优选好货，低价限量，妈妈们都抢疯了！',
                link: window.location.href,
                imgUrl: '//h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
            });

        });
    }
};

!(function init() {
    initWx();
    getLocation();
    renderProvince(provinces);
    bindEvent();
    curProvince(provinces, pid);
})();