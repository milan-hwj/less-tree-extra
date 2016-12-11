import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点

import Swiper from 'unit/common/js/swiper';
import common from 'unit/common/js/common/common';
import env from '@beibei/env';
import template from '@beibei/template';
import lazyloadModule from '@beibei/lazyload';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import ptLog from '../../common/util/ptLog.js';
import wx from 'unit/common/js/wx/wx.js'; // 微信分享
import share from 'unit/common/js/share';
import './index.less';

const lazyload = lazyloadModule({
    useWebp: true
});

// 设置分享
{
    if (env.app.isWeixin) {
        wx.config(function () {
            wx.shareConfig({
                title: '【0元伙拼】加入伙拼战队，与队友齐心协力一起向榜单冲刺！',
                desc: '【众人拾柴火焰高】一起0元伙拼，占据伙拼榜单的top3战队即可获得奖品！赶快加入伙拼战队吧！',
                link: window.location.href,
                imgUrl: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
            });
        });
    }
};

{
    var $doc = $(document),
        $body = $('body'),
        $rulePopup = $("#J_rule-popup"),
        $itemList = $('#J_item-list'),
        $T_itemList = $('#T_item-list'),
        $bg1 = $('#J_bg1'),
        $bg2 = $('#J_bg2');

    var toDouble = function(num) {
        return num < 10 ? '0' + num : '' + num;
    };

    var timeFormat = function(num) {
        var d, h, m, s;
        d = Math.floor(num / 60 / 60 / 24);
        h = toDouble(Math.floor(num / 60 / 60 % 24));
        m = toDouble(Math.floor(num / 60 % 60));
        s = toDouble(Math.floor(num % 60));
        return d ? d + '天' + h + '时' + m + '分' + s + '秒' : h + '时' + m + '分' + s + '秒';
    };

    var processData = function(data) {
        if (data && data.length) {
            data.forEach(function(i) {
                i.link = `${window.location.origin}/gaea_pt/mpt/group/detail.html?iid=${i.iid}`;
                i.value = i.origin_price / 100;
                i.join_num = i.join_num < 10000 ? i.join_num : (i.join_num / 10000).toFixed(1) + '万';

                var currentTime = parseInt((new Date() / 1000));
                // 0: 将来时  1: 进行时  2: 完成时
                i.status = i.gmt_begin > currentTime ? 0 : i.gmt_end > currentTime ? 1 : 2;
                if (i.status === 0) {
                    i.delay = Number(i.gmt_begin) - currentTime;
                    i.begin = timeFormat(i.delay);
                }
                if (i.status === 1) {
                    i.delay = Number(i.gmt_end) - currentTime;
                    i.end = timeFormat(i.delay);
                }
                if (env.app && env.app.isBeibei) {
                    i.link = `beibei://bb/base/webview?url=${encodeURIComponent(i.link)}`;
                }
            });
        }
        return data;
    };

    var handle = function(resp) {
        // 移除loading
        muiLoading.remove();

        // 设置容器高度
        var height = window.dpr * window.screen.height - $('#J_footBar').height() - $('#J_banner').height();
        if (env.app.isWeixin || env.app.isBeibei) {
            height = height - 128;
        }
        [$bg1, $bg2, $itemList].forEach(function(el) {
            el.height(height);
        });

        // 渲染轮播
        if (!(resp.fightgroup_items && resp.fightgroup_items.length)) {
            return;
        }
        var ads = resp.fightgroup_items;
        var tpl = $T_itemList.html();
        var html = template(tpl, { list: processData(ads) });
        $itemList.html(html);

        var swiper = new Swiper('#J_item-list .swiper-container', {
            pagination: ads.length === 1 ? null : '#J_item-list .swiper-pagination',
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            autoplay: ads.length === 1 ? false : 5000,
            autoplayDisableOnInteraction: false,
            lazyLoading: true,
            lazyLoadingInPrevNext: true,
            coverflow: {
                rotate: 0,
                stretch: -110,
                depth: 367,
                modifier: $('html').data('dpr'),
                slideShadows: true
            }
        });

        // 小圆圈定位
        $('.swiper-pagination').css('bottom', ( height - $('.swiper-container').height()) / 4 );

        // 绑定事件
        bindEvent();
    };

    var switchSlide = function() {
        var curImg;
        $('.swiper-slide').each(function(index, el) {
            el = $(el);
            if(el.css('z-index') == 1) {
                curImg = el.find('img').attr('src');
            }
        });
        $bg1.css('background-image', 'url('+ curImg + ')');
    };

    var bindEvent = function() {
        // 规则弹窗
        $doc.on('click', '#J_banner', function() {
            $rulePopup.removeClass('hidden');
            $body.addClass('body-overflow');
        });

        $doc.on('click', '#J_btn-know', function() {
            $rulePopup.addClass('hidden');
            $body.removeClass('body-overflow');
        });

        // 倒计时
        (function() {
            var $cd = $('.J_countdown');
            $cd.forEach(function(i) {
                var el = $(i);
                var val = el.attr('data');
                setInterval(function() {
                    el.html(timeFormat(val--));
                }, 1000);
            });
        })();
    };

    var init = (function() {
        common.callAPI({
            noDialog: true,
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupDuobaoGet',
            url: '//sapi.beibei.com/fightgroup/duobao/1-200.html',
            success: handle
        });

        ptLog.init({
            page: '今日伙拼'
        });
    })();

};
