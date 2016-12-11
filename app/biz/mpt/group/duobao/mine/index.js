import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import ptLog from '../../common/util/ptLog.js';
import wxLogin from 'app/biz/mpt/common/auth/login.js';
import tabTools from 'src/js/mp/pintuan/unit/tabTools.js';
import wx from 'unit/common/js/wx/wx.js'; // 微信分享
import share from 'unit/common/js/share';
import env from '@beibei/env';
import login from 'unit/common/js/login';
import common from 'unit/common/js/common/common';
import template from '@beibei/template';
import lazyloadModule from '@beibei/lazyload';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';

import './index.less';

const lazyload = lazyloadModule({
    useWebp: true
});

const tool = {
    getList: function(page, pageSize, status, callback) {
        common.callAPI({
            method: 'beibei.fightgroup.mine.duobao.get',
            noDialog: true,
            type: 'GET',
            data: {
                page: page,
                status: status,
                page_size: pageSize
            },
            success: callback
        });
    },
    resetUrl: function(url) {
        if (env.app && env.app.isBeibei) {
            url = `beibei://bb/base/webview?url=${encodeURIComponent(url)}`;
        }
        return url;
    },
    renderList: function($container, tplString, data) {
        $container.append(template(tplString, data));
    },
    renderEnd: function($container) {
        $container.append('<li class="z-end">------ 没有啦 ------</li>');
    },
    toDouble: function(num) {
        return num < 10 ? '0' + num : '' + num;
    },
    processData: function(resp) {
        var that = this;
        if (resp.trial_items && resp.trial_items.length) {
            resp.trial_items.forEach(function(item) {
                const date = new Date(Number(item.gmt_end) * 1000);
                item.lottery_date = date.getFullYear() + '-' + that.toDouble(date.getMonth() + 1) + '-' + that.toDouble(date.getDate());
                item.lottery_time = that.toDouble(date.getHours()) + ':' + that.toDouble(date.getMinutes()) + ':' + that.toDouble(date.getSeconds());
                item.img = imageConvert.format200(item.img);
                item.url = tool.resetUrl(location.origin + '/mpt/group/duobao/home.html?group_code=' + item.group_code);
                item.share_url = tool.resetUrl(location.origin + '/mpt/group/duobao/home.html?group_code=' + item.group_code + '&needshare=1');
                item.winner_list_url = tool.resetUrl(location.origin + '/mpt/group/duobao/winner-list.html?iid=' + item.iid);
            });
        }
        return resp;
    }
};

// 设置分享
{
    if (env.app.isWeixin) {
        wx.config(function() {
            wx.shareConfig({
                link: window.location.href,
                title: '【0元伙拼】加入伙拼战队，与队友齐心协力一起向榜单冲刺！',
                desc: '快看看自己的战绩如何，加入伙拼战队，与队友队友齐心协力一起夺取大奖！',
                imgUrl: '//h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
            });
        });
    } else if (env.app.isBeibei) {
        var $input = $('#app_share_conf');
        var base = {
            url: window.location.href,
            title: '【0元伙拼】加入伙拼战队，与队友齐心协力一起向榜单冲刺！',
            desc: '快看看自己的战绩如何，加入伙拼战队，与队友队友齐心协力一起夺取大奖！',
            platform: 'qq_qzone_weixin_timeline_weibo_copy'
        };
        $input.attr('value', JSON.stringify(base));
    }
};

{
    var PAGE_SIZE = 10,
        TPL = $('#J_list-tpl').html();

    var $win = $(window),
        $doc = $(document),
        $spinner = $('#J_spinner'),
        $containers = $('.J_group-list'),
        $noItemTip = $('#J_no-item-tip'),
        $noTtemTipText = $('#J_no-item-tip').find('p'),
        $groupListCont = $('#J_group-list-cont'),
        windowH = $win.height() - $('#J_tab-container').height() - $('#J_footBar').height();

    var Status = {
        status: 0,
        isLoading: false,
    };

    var statusCont = [{
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }];

    var getNoItemTip = function(index) {
        switch (index) {
            case 1:
                return '亲，您没有伙拼中的商品哦~';
            case 2:
                return '亲，您没有伙拼成功的商品哦~';
            case 3:
                return '亲，您没有伙拼失败的商品哦~';
            default:
                return '亲，您还未参与过伙拼活动哦~';
        }
    };

    var renderNoItem = function(noItem) {
        $groupListCont[noItem ? 'hide' : 'show']();
        $noItemTip[noItem ? 'show' : 'hide']();
    };

    var getHeight = function(winH, contH) {
        return winH > contH ? winH : contH;
    };

    var loadList = function(page, pageSize, status) {
        $spinner.css('visibility', 'visible');
        tool.getList(page, PAGE_SIZE, status, function(resp) {
            //移除loading
            muiLoading.remove();

            $spinner.css('visibility', 'hidden');

            // 没有任何数据
            if (page === 1 &&
                (!resp.trial_items || !resp.trial_items.length)) {
                statusCont[status].noItem = true;
                renderNoItem(true);

            } else {
                statusCont[status].noItem = false;
                renderNoItem(false);

                tool.renderList($containers.eq(status), TPL, tool.processData(resp));
                lazyload.getLazyImg();
            }

            Status.isLoading = false;

            if (!resp.trial_items || resp.trial_items.length < PAGE_SIZE) {
                statusCont[status].isEnd = true;
                $spinner.remove();
                tool.renderEnd($containers.eq(status));
            }

            $groupListCont.height(getHeight(windowH, $containers.eq(status).height()));
        });
    };

    var loadMore = function() {
        $win.on('scroll', function() {
            var temp = statusCont[Status.status];
            if (!Status.isLoading && !temp.isEnd && $win.scrollTop() + $win.height() > $doc.height() - 400) {
                Status.isLoading = true;
                temp.page = temp.page + 1;
                loadList(temp.page, PAGE_SIZE, Status.status);
            }
        });
    };

    var switchTab = function(index) {
        Status.status = index;

        $win.scrollTop(0);
        $groupListCont.attr('data-active', index);
        $noTtemTipText.html(getNoItemTip(index));

        if (statusCont[index].page === 0) {
            statusCont[index].page += 1;
            loadList(statusCont[index].page, PAGE_SIZE, index);
        } else {
            renderNoItem(statusCont[index].noItem);
            $groupListCont.height(getHeight(windowH, $containers.eq(index).height()));
        }

        ptLog.stat({
            et: 'click',
            json: {
                'block_name': '头部导航',
                'position': index
            }
        });
    };

    var init = function() {
        tabTools.init('#J_tab-container', ['全部', '进行中', '伙拼成功', '伙拼失败'], switchTab);
        $('body').css('min-height', $win.height());
        loadMore();

        share.setShare({
            title: '我的伙拼'
        });

        ptLog.init({
            page: '我的伙拼'
        });
    };

    if (env.app.isWeixin) {
        wxLogin.authInit(window.location.origin + '/mpt/group/duobao/mine.html', function (result) {
            if (result.isLogin) {
                init();

            } else if (result.token) {
                const dialog = wxLogin.getDialog();

                muiLoading.remove();
                dialog.show();
                dialog.setCallback(() => {
                    window.location.reload();
                });
            }
        });
    } else {
        login.checkLogin(function(isLogin) {
            if (!isLogin) {
                login.doLogin(function() {
                    init();
                });
            } else {
                init();
            }
        });
    }

};
