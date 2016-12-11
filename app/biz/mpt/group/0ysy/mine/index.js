import "@beibei/tingyun";
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点
import wx from 'unit/common/js/wx/wx.js';
import env from '@beibei/env';
import share from 'unit/common/js/share/share.js';
import login from 'unit/common/js/login/login';
import common from 'unit/common/js/common/common';
import template from '@beibei/template';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import wxTools from 'src/js/mp/pintuan/unit/wxTools.js';
import bindDialog from 'src/js/mp/pintuan/unit/bindDialog.js';
import tabTools from 'src/js/mp/pintuan/unit/tabTools.js';
import ptLog from '../../common/util/ptLog.js';
import lazyloadModule from '@beibei/lazyload';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import './index.less'

isp();
performance();
heatmap();

const lazyload = lazyloadModule({
    useWebp: true
});

const tool = {
    getList(page, pageSize, status, callback) {
        common.callAPI({
            method: 'beibei.fightgroup.mine.trial.get',
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
    renderList($container, tplString, data) {
        $container.append(template(tplString, data));
    },
    renderEnd($container) {
        $container.append('<li class="z-end">------ 没有啦 ------</li>');
    },
    toDouble(num) {
        return num < 10 ? '0' + num : '' + num;
    },
    processData(resp) {
        const that = this;
        if (resp.trial_items && resp.trial_items.length) {
            resp.trial_items.forEach(function(item) {
                const date = new Date(Number(item.gmt_end) * 1000);
                item.isEnded = new Date().getTime() > item.gmt_end * 1000;
                item.lottery_date = date.getFullYear() + '.' + that.toDouble(date.getMonth() + 1) + '.' + that.toDouble(date.getDate());
                item.lottery_time = that.toDouble(date.getHours()) + ':' + that.toDouble(date.getMinutes()) + ':' + that.toDouble(date.getSeconds());
                item.origin_price = item.origin_price / 100;
                item.img = imageConvert.format200(item.img);

                if (env.app.isWeixin) {
                    item.url = '/mpt/group/home.html?group_code=' + item.group_code;
                    item.share_url = '/mpt/group/home.html?group_code=' + item.group_code + 
                    '&needshare=1';
                } else {
                    item.url = '/mpt/group/home.html?group_code=' + item.group_code + 
                    '&beibeiapp_info={"target":"bb/pintuan/detail","group_code":"' + 
                    item.group_code + '"}';
                    item.share_url = '/mpt/group/home.html?group_code=' + item.group_code + 
                    '&needshare=1&beibeiapp_info={"target":"bb/pintuan/detail","group_code":"' + 
                    item.group_code + '","isShowShare":true}';
                }
            });
        }
        return resp;
    }
};

(function() {
    const PAGE_SIZE = 10,
        TPL = $('#J_list-tpl').html();

    const $win = $(window),
        $doc = $(document),
        $spinner = $('#J_spinner'),
        $containers = $('.J_group-list'),
        $noItemTip = $('#J_no-item-tip'),
        $noTtemTipText = $noItemTip.find('p'),
        $groupListCont = $('#J_group-list-cont'),
        windowH = $win.height() - $('#J_tab-container').height() - $('#J_footBar').height();

    const Status = {
        status: 0,
        isLoading: false
    };

    const statusCont = [{
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

    const getNoItemTip =(index) => {
        switch (index) {
            case 1:
                return '亲，您还没有申请中的试用商品哦~';
            case 2:
                return '亲，您还没有申请成功的试用商品哦~';
            case 3:
                return '亲，您还没有申请失败的试用商品哦~';
            default:
                return '亲，您还没有申请的试用商品哦~';
        }
    };

    const renderNoItem = (noItem) => {
        $groupListCont[noItem ? 'hide' : 'show']();
        $noItemTip[noItem ? 'show' : 'hide']();
    };

    const getHeight = (winH, contH) => {
        return winH > contH ? winH : contH;
    };

    const loadList = (page, pageSize, status) => {
        $spinner.css('visibility', 'visible');
        tool.getList(page, PAGE_SIZE, status, (resp) => {
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

    const loadMore = () => {
        $win.on('scroll', () => {
            var temp = statusCont[Status.status];
            if (!Status.isLoading && !temp.isEnd && $win.scrollTop() + $win.height() > $doc.height() - 400) {
                Status.isLoading = true;
                temp.page = temp.page + 1;
                loadList(temp.page, PAGE_SIZE, Status.status);
            }
        });
    };

    const switchTab = (index) => {
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

    };

    const init = () => {
        tabTools.init('#J_tab-container', ['全部', '申请中', '申请成功', '申请失败'], switchTab);
        $('body').css('min-height', $win.height());
        loadMore();
        
        share.setShare({
            type: 'yes',
            title: '我的试用'
        });

        ptLog.init({
            page: '我的试用'
        });
    };

    if (env.app.isWeixin) {
        wxTools.authInit(window.location.origin + '/mpt/group/0ysy/mine.html', (result) => {
            if (result.isLogin) {
                bindDialog.hide();
                init();
            } else if (result.token) {
                muiLoading.remove();
                bindDialog.show();
                $spinner.css('visibility', 'hidden');

                // 手机弹窗绑定
                bindDialog.handle(result.token, () => {
                    window.location.reload();
                });
            }
        });
    } else {
        login.checkLogin((isLogin) => {
            if (!isLogin) {
                login.doLogin(() => {
                    init();
                });
            } else {
                init();
            }
        });
    }
})();
