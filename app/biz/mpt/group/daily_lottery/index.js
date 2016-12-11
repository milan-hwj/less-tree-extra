import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import lazyloadModule from '@beibei/lazyload';
import adsHelper from '@beibei/ads_helper';
import backtop from '@beibei/backtop';
import env from '@beibei/env';
import { callAPI } from 'unit/common/js/common/common';
import Xtemplate from 'xtemplate/lib/runtime';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import marquee from 'unit/common/widget/pintuan/marquee/marquee';
import ptLog from 'src/js/mp/pintuan/unit/ptLog';
import Swiper from 'unit/common/js/swiper';
import { format750,format200 } from 'unit/common/js/image_convert/image_convert';
import { setWxShare } from '../../common/share/wxshare';
import convert from '../common/util/httpConvert.js'
import Footer from '../common/component/footer/footer';

import listTpl from './list.xtpl';
import adsTpl from './ads.xtpl';
import './index.less';

isp();
heatmap();
performance();

if (!env.app.isBeibei) {
    backtop();
}

{
    const lazyload = lazyloadModule({ useWebp: true });
    const price2Int = price => Math.floor(price / 100 || 0);
    const price2Decimal = price => (price / 100).toString().split('.')[1] || '0';
    const toDouble = num => (num < 10 ? `0${num}` : `${num}`);
    const timeFormat = (time) => {
        const oDate = new Date(time * 1000);
        return toDouble(oDate.getMonth() + 1) + '月' +
            toDouble(oDate.getDate()) + '日 ' +
            toDouble(oDate.getHours()) + ':' +
            toDouble(oDate.getMinutes());
    };
    const resetUrl = (url) => {
        if (env.app.isBeibei) {
            url = `beibei://bb/base/webview?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const getConfig = key => ({
        goodsList: {
            url: '//sapi.beibei.com/fightgroup/new_lottery/1-200-0.html',
            jsonpCallback: 'BeibeiFightgroupNewLotteryGet'
        },
        awardNotice: {
            url: '//sapi.beibei.com/fightgroup/award_notice/1-50-6.html',
            jsonpCallback: 'BeibeiFightgroupAwardNoticeGet'
        }
    }[key]);

    const getData = key => new Promise((resolve, reject) => {
        callAPI({
            url: getConfig(key).url,
            dataType: 'jsonp',
            jsonpCallback: getConfig(key).jsonpCallback,
            cache: true,
            noDialog: true,
            success: resolve,
            error: reject
        });
    });

    const format = (data) => {
        const result = [];
        if (data && data.length) {
            const now = new Date() / 1000;
            data.forEach((item) => {
                const temp = Object.assign({}, item);
                temp.status = temp.gmt_end > now ? (temp.gmt_begin > now ? 'status-unopen' : 'status-opend') : 'status-outstock';
                temp.rect_img = format750(temp.rect_img);
                temp.tags_v2 && temp.tags_v2.length && (temp.tags_v2[0] = format200(temp.tags_v2[0]));
                temp.country_circle_icon = convert(temp.country_circle_icon);
                temp.groupNumStr = `${temp.group_num}人团`;
                temp.oripriceInt = `¥${price2Int(temp.origin_price)}`;
                temp.priceDecimal = `.${price2Decimal(temp.group_price)}`;
                temp.priceInt = price2Int(temp.group_price);
                if (temp.status === 'status-unopen') {
                    temp.link = `/gaea_pt/mpt/group/detail.html?iid=${temp.iid}&beibeiapp_info={"target":"detail","iid":${temp.iid}}`;
                    temp.lottery_info = ` 开抢时间 ${timeFormat(temp.gmt_begin)}`;
                    temp.btnText = `${new Date(temp.gmt_begin * 1000).getHours()}点抢`;
                } else if (temp.status === 'status-opend') {
                    temp.link = `/gaea_pt/mpt/group/detail.html?iid=${temp.iid}&beibeiapp_info={"target":"detail","iid":${temp.iid}}`;
                    temp.lottery_info = ` 开奖时间 ${timeFormat(temp.gmt_end)}`;
                    temp.btnText = '去开团';
                } else {
                    temp.link = resetUrl(`${window.location.origin}/mpt/group/winner-list.html?iid=${temp.iid}`);
                    temp.lottery_info = '';
                    temp.btnText = '中奖名单';
                }
                result.push(temp);
            });
        }
        return result;
    };

    const render = ($container, tplString, data) => {
        $container.append(new Xtemplate(tplString).render({ data }));
    };

    const ads = (resp = []) => {
        render($('#J_one-cent'), adsTpl, resp);
        new Swiper('#J_one-cent .swiper-container', {
            pagination: resp ? '#J_one-cent .swiper-pagination' : null,
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            autoplay: resp ? 5000 : false,
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
    };

    const handle = () => {
        // 商品列表
        getData('goodsList').then((resp) => {
            render($('#J_container'), listTpl, format(resp.fightgroup_items));
            if (resp.fightgroup_items) {
                (new Footer()).appendTo('body');
            }
            lazyload.getLazyImg();
            muiLoading.remove();
        }).catch((error) => {
            console.error('getGoodsList error!', error);
        });

        // 开奖公告
        getData('awardNotice').then((resp) => {
            if (resp.fightgroup_awards.length) {
                $('<div id="#J_notice" class="notice"></div>')
                    .appendTo('#J_noticeContainer')
                    .marquee({ storage: resp.fightgroup_awards });
            }
        }).catch((error) => {
            console.error('getAwardNotice error!', error);
        });

        // 轮播广告
        adsHelper('1706', ads, ads);
    };

    const init = () => {
        handle();
        ptLog.init({ page: '每日抽奖' });
    };

    init();
}

// 设置分享
if (env.app.isWeixin) {
    const shareInfo = {
        share_title: '【贝贝拼团】免费抽大奖活动',
        share_desc: '免费的吃不了亏、上不了当，贝贝抽奖助你走上人生巅峰~',
        share_link: window.location.origin + '/gaea_pt/mpt/group/1fsy.html',
        share_icon: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
    };
    setWxShare(shareInfo, () => {
        ptLog.stat({
            json: { share: 1 }
        });
    });
} else if (env.app.isBeibei) {
    const $input = $('#app_share_conf');
    const base = {
        title: '【贝贝拼团】免费抽大奖活动',
        desc: '免费的吃不了亏、上不了当，贝贝抽奖助你走上人生巅峰~',
        platform: 'qq_qzone_weixin_timeline_weibo_copy',
        url: window.location.origin + '/gaea_pt/mpt/group/1fsy.html'
    };
    $input.attr('value', JSON.stringify(base));
}
