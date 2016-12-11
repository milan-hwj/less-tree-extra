import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import preload from '../../../common/gaea/preload';
import marquee from 'unit/common/widget/pintuan/marquee/marquee';
import itemList1 from '../common/component/itemlist/item_list_1/item_list_1';
import wxTools from 'src/js/mp/pintuan/unit/wxTools';
import ptLog from '../common/util/ptLog';
import recToast from '../common/component/recToast/recToast.js'; // 推荐toast

import './index.less';

isp();
heatmap();
performance();

{
    const getShareConfig = () => ({
        share_title: '【贝贝拼团】百里挑一活动',
        share_desc: '只需1分钱，就有机会中奖哦！',
        share_link: window.location.href,
        share_icon: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
    });

    const getAwardNotice = new Promise((resolve, reject) => {
        preload.callAPI({
            id: 'getAwardNoticeFromGaea',
            once: true,
            url: '//sapi.beibei.com/fightgroup/award_notice/1-50.html',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupAwardNoticeGet',
            cache: true,
            noDialog: true,
            success: resolve,
            error: reject
        });
    });

    getAwardNotice.then((resp) => {
        if (typeof resp === 'string') {
            resp = JSON.parse(resp);
        }
        resp.fightgroup_awards.length && $('<div id="#J_notice" class="notice"></div>')
            .appendTo('#J_noticeContainer')
            .marquee({ storage: resp.fightgroup_awards });
    }).catch((error) => {
        console.error('getAwardNotice error!', error);
    });

    recToast.init();

    ptLog.init({ page: '百里挑一频道页' });

    itemList1.init('.J_container', 'try_group');

    wxTools.setWxShare(getShareConfig(), () => {
        ptLog.stat({
            json: { share: 1 }
        });
    });
}
