import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; // 防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; // 热力图打点
import 'unit/common/widget/pintuan/marquee/marquee';

import env from '@beibei/env';
import BB from '../../../../common/gaea/preload';
import wx from 'unit/common/js/wx/wx'; // 微信分享
import itemList1 from '../../common/component/itemlist/item_list_1/item_list_1';
import template from '@beibei/template';
import Swiper from 'unit/common/js/swiper';
import imageConvert from 'unit/common/js/image_convert/image_convert';


import ptLog from '../../common/util/ptLog';

import './index.less';

isp();
performance();
heatmap();

const isWeixin = env.app.isWeixin;

//事件委托对象
const $e = $('<div>');
// 域名
// const hostName = window.location.host;

// 贝贝app环境下, 将h5链接在新的webview中打开
const resetUrl = (array) => {
    if (env.app && env.app.isBeibei) {
        array.forEach((i) => {
            if (i.target.indexOf('beibeiapp_info') === -1) {
                i.target = `beibei://bb/base/webview?url=${encodeURIComponent(i.target)}`;
            }
        });
    }
    return array;
};

//视图渲染(view)
const view = (function () {
    const tpl = {}, compiler = {};

    const emptyRender = {
        render: function () {
            return '';
        }
    };

    function compiled(id) {
        var $o = $('#tmpl-' + id);
        if ($o.length) {
            compiler[id] = template($o.html());
            $o.remove();
        } else {
            compiler[id] = emptyRender;
        }
    }

    //渲染大牌精选,消息播报单条,中间广告
    $(['dpjx', 'middleAds']).each(function (i, em) {
        compiled(em);
        tpl[em] = function (data) {
            try {
                return compiler[em].render(data);
            } catch (e) {
                console.error('render %s failed:', em, e.message);
                return '';
            }
        }
    });

    return tpl;
})();

//大数据打点
//(function () {
//    statistics.setRid('84970');
//
//    //广告位打点
//    $('body').on('click', '.itemAds', function () {
//        statistics.sendLog({
//            et: 'click',
//            entity_type: 'ads',
//            json: {
//                block_name: $(this).data('title')
//            }
//        });
//    });
//
//    //商品数据打点
//    $('#J_goods').on('click', '.item', function () {
//        statistics.sendLog({
//            et: 'click',
//            entity_type: 'item',
//            json: {
//                block_name: $(this).data('title')
//            }
//        });
//    });
//
//})();

// 广告展示(ads)
(function () {
    var ads1, swiper1,//大牌精选广告内容
        ads2, swiper2;//中间广告

    // 渲染第一个广告位广告(大牌精选)
    function renderAds1() {
        // 设置广告内容
        if (ads1.length === 0) {
            return;
        }
        ads1.forEach((ad)=> {
            ad.img = imageConvert.format640(ad.img);
        });
        $('#J_dpjx').append(view.dpjx(ads1));
        swiper1 = new Swiper('#J_dpjx .swiper-container', {
            pagination: ads1.length === 1 ? null : '#J_dpjx .swiper-pagination',
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            autoplay: ads1.length === 1 ? false : 5000,
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
    }

    //渲染第二个广告位(必得试用)
    function renderAds2() {
        //设置广告内容
        if (ads2.length == 0) {
            return;
        }
        $('#J_middleAds').append(view.middleAds(ads2));
        swiper2 = new Swiper('#J_middleAds .swiper-container', {
            pagination: ads1.length === 1 ? null : '#J_middleAds .swiper-pagination',
            grabCursor: true,
            autoplay: ads1.length === 1 ? false : 5000,
            autoplayDisableOnInteraction: false,
            lazyLoading: true,
            lazyLoadingInPrevNext: true
        });
        //通知tab重新计算top
        $e.trigger('tabs_recalculateTop');
    }

    BB.callAPI({
        id: 'getAdsFromGaea',
        url: '//sapi.beibei.com/resource/h5-ads-53_54.html',
        dataType: 'jsonp',
        jsonpCallback: 'ads',
        cache: true,
        success: function (resp) {
            ads1 = resetUrl(resp['0ysy_top_ads'] || []);
            ads2 = resetUrl(resp['0ysy_middle_ads'] || []);
            renderAds1();
            renderAds2();
        }
    });
})();

BB.callAPI({
    id: 'getNoticeFromGaea',
    url: '//sapi.beibei.com/fightgroup/free_trial_notice/1-50.html',
    dataType: 'jsonp',
    jsonpCallback: 'BeibeiFightgroupFreeTrialNoticeGet',
    cache: true,
    success: function (resp) {
        if(typeof resp === 'string') {
            resp = JSON.parse(resp);
        }
        resp.fightgroup_awards.length && $('<div id="#J_notice" class="notice"></div>').appendTo('#J_noticeContainer').marquee({
            storage: resp.fightgroup_awards
        });
    }
});

itemList1.init('#J_list', 'free_group');

ptLog.init({
    page: '试用首页'
});


//其他的设置
(function () {
    if (isWeixin) {
        wx.config(function () {
            wx.shareConfig({
                title: '【免费试用】一个好汉三个帮，还有免费等你领',
                desc: '[赠人玫瑰，手有余香]赶快邀请小伙伴一起申请免费试用吧！',
                link: window.location.href,
                imgUrl: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
            });
        });
    }
})();

