import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import env from '@beibei/env';
import template from '@beibei/template';
import common from 'unit/common/js/common/common';
import lazyloadModule from '@beibei/lazyload';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import ptLog from '../../common/util/ptLog.js';
import wx from 'unit/common/js/wx/wx.js'; // 微信分享
import share from 'unit/common/js/share';

import './index.less';

const lazyload = lazyloadModule({
    useWebp: true
});

// 转化成支持webview跳转的链接
const resetUrl = (url) => {
    if (env.app && env.app.isBeibei) {
        url = `beibei://bb/base/webview?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// 设置分享
{
    if (env.app.isWeixin) {
        wx.config(function () {
            wx.shareConfig({
                title: '【0元伙拼】加入伙拼战队，与队友齐心协力一起向榜单冲刺！',
                desc: '【伙拼榜】伙拼成功，就会榜上有名，赶紧召集队友一起伙拼吧~ ',
                link: window.location.href,
                imgUrl: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
            });
        });
    }
}

(function() {
    var PAGE_SIZE = 10;

    var status = {
        page: 1,
        isEnd: false,
        isLoading: false
    };

    var $win = $(window),
        $doc = $(document),
        $spinner = $('#J_spinner'),
        $itemList = $('#J_item-list'),
        $T_itemList = $('#T_item-list'),
        tplString = $T_itemList.html();

    var toDouble = function(num) {
        return num < 10 ? '0' + num : '' + num;
    };

    var processData = function(data) {
        if (data && data.length) {
            data.forEach(function(item, index) {
                item.detailUrl = resetUrl(`${window.location.origin}/gaea_pt/mpt/group/detail.html?iid=${item.iid}`);
                item.winnerListUrl = resetUrl(`${window.location.origin}/mpt/group/duobao/winner-list.html?iid=${item.iid}`);
                item.index = (status.page - 1) * PAGE_SIZE + data.length - index;
                item.jpg = imageConvert.format320(item.img);
                item.top_groups_1 = item.top_groups[0];
                item.top_groups_2 = item.top_groups[1];
                item.top_groups_3 = item.top_groups[2];

                var lotteryDate = new Date(Number(item.gmt_end) * 1000);
                item.lottery_date = lotteryDate.getFullYear() + '-' + toDouble(lotteryDate.getMonth() + 1) + '-' + toDouble(lotteryDate.getDate()) + ' ' +
                    toDouble(lotteryDate.getHours()) + ':' + toDouble(lotteryDate.getMinutes()) + ':' + toDouble(lotteryDate.getSeconds());
            });
        }
        return data;
    };

    var handle = function(resp) {
        // 移除loading
        muiLoading.remove();

        if (status.page == 1 && !resp.count) {
            $('#J_no-item-tip').show();
            status.isEnd = true;
            remove();
            return;
        }

        render(resp.fightgroup_items);
        if (status.page == Math.ceil(resp.count / PAGE_SIZE)) {
            status.isEnd = true;
            renderEnd();
            remove();
        }
    };

    var render = function(data) {
        $itemList.append(template(tplString, { list: processData(data) }));
        lazyload.getLazyImg();
    };

    var renderEnd = function() {
        $itemList.append('<li class="z-end">------ 没有啦 ------</li>');
    };

    var remove = function() {
        $spinner.remove();
        $T_itemList.remove();
    };

    var loadList = function() {
        status.isLoading = true;
        common.callAPI({
            noDialog: true,
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupDuobaoHistoryGet',
            url: '//sapi.beibei.com/fightgroup/duobao_history/' + status.page + '-' + PAGE_SIZE + '.html',
            success: handle,
            complete: function() {
                status.isLoading = false;
            }
        });
    };

    var loadMore = function() {
        $win.on('scroll', function() {
            if (!status.isLoading && !status.isEnd && $win.scrollTop() + $win.height() > $doc.height() - 400) {
                status.page += 1;
                loadList();

                ptLog.stat({
                    et: 'list_show',
                    json: {
                        page: status.page
                    }
                });
            }
        });
    };

    var init = (function() {
        loadList();
        loadMore();
        
        ptLog.init({
            page: '伙拼榜'
        });
    })();

})();
