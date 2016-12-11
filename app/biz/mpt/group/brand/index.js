import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; // 防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; // 热力图打点
import imageConvert from 'unit/common/js/image_convert/image_convert';
import env from '@beibei/env';
import backtop from '@beibei/backtop';
import lazyloadModule from '@beibei/lazyload';
import Xtemplate from 'xtemplate/lib/runtime';
import common from 'unit/common/js/common/common';
import ptLog from 'src/js/mp/pintuan/unit/ptLog';
import channelList from '../common/component/channelList/channelList';

import listTpl from './list.xtpl';
import './index.less';

isp();
performance();
heatmap();

const isMizhe = env.app.isMizhe;
const isBeibei = env.app.isBeibei;

if (!(isBeibei || isMizhe)) {
    backtop();
}

{
    const lazyload = lazyloadModule({ useWebp: true });

    function init() {
        // 今日大牌
        getAds(isMizhe ? '356' : '353').then(renderNewArrival);

        // 限时超值
        channelList.init({
            pageName: 'brand',
            $container: $('#J_flash-sale-cont')
        });

        // 打点
        ptLog.init({ page: '拼大牌' });
    }

    function getAds(rid = '') {
        return new Promise((resolve, reject) => {
            common.callAPI({
                url: `//sapi.beibei.com/resource/h5-ads-${rid}.html`,
                jsonpCallback: 'ads',
                dataType: 'jsonp',
                noDialog: true,
                success: resolve,
                error: reject
            });
        });
    }

    function handleData(data = {}) {
        if ($.isEmptyObject(data)) {
            return data;
        }
        data.totleWidth = 0;
        data.adsData.forEach((i) => {
            i.img = imageConvert.format640(i.img);
            data.totleWidth += i.width + 48;
            if (env.app.isBeibei && i.target.indexOf('beibeiapp_info') === -1) {
                i.target = `beibei://bb/base/webview?url=${encodeURIComponent(i.target)}`;
            }
            if (env.app.isMizhe && i.target.indexOf('mizheapp_info') === -1) {
                i.target = `http://h5.mizhe.com?mizheapp_info={"target":"webview","url":"${i.target}"}`;
            }
            if (i.ad_kids && i.ad_kids.length) {
                data.totleWidth += i.ad_kids.length * 294;
                for (const v of i.ad_kids) {
                    v.jpg = imageConvert.format320(v.img);
                    v.src = isMizhe ? '//b0.hucdn.com/party/default/f21fb0c990ca5e65ff59f73477087741.png' :
                        '//h0.hucdn.com/open/201639/ed37893cc0d2680e_375x375.png';
                }
            }
        });
        data.totleWidth = `${Math.ceil((data.totleWidth / 46.875) * window.rem)}px`;
        return data;
    }

    function renderData($container, tplString, data) {
        if ($.isEmptyObject(data)) {
            $container.addClass('hidden');
            return;
        }

        $container.append(new Xtemplate(tplString).render({ data }));
        lazyload.getLazyImg();
    }

    function renderNewArrival(resp) {
        const adsData = isMizhe ? resp.kFightgroupMizheBrandTopAds : resp.pindapaitopads;
        if (!adsData || !adsData.length) {
            $('#J_new-arrival').addClass('hidden');
            return;
        }
        renderData($('#J_new-arrival'), listTpl, handleData({ adsData }));
    }

    init();
}
