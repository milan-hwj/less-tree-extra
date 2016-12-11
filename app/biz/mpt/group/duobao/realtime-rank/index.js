import _ from 'lodash';
import '@beibei/tingyun';

import mores from '../../common/component/mores/mores.js';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';// 热力图
import performance from '@beibei/statistics/statistics-performance';// 页面性能统计
import Xtemplate from 'xtemplate/lib/runtime';
import marquee from 'unit/common/widget/pintuan/marquee/marquee.js';

import popup from '@beibei/popup';
import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import common from 'unit/common/js/common/common';
import lazyLoadModule from '@beibei/lazyload';
import cookie from '@beibei/cookie';
import template from '@beibei/template';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';


import { gapTime } from 'src/js/mp/pintuan/unit/util';
import ptLog from '../../common/util/ptLog.js';
import { setWxShare } from '../../../common/share/wxshare';
import wxFollow from 'app/biz/mpt/common/auth/follow.js';

import login from 'app/biz/mpt/common/auth/login.js';

import _login from 'unit/common/js/login';

import mainbox from '../component/mainbox/mainbox';

import joinTpl from './join.xtpl';
import listTpl from './list.xtpl';
import './index.less';
import api from './api';

isp();
heatmap();
performance();
const lazyLoad = lazyLoadModule({
    useWebp: true,
    threshold: 200
});
const isWeixin = env.app.isWeixin;
const isBeibei = env.app.isBeibei;


// 设置分享
const setShareInfo = () => {
    if (isWeixin) {
        const shareInfo = {
            share_link: window.location.href,
            share_title: '快加入战队，我们一起0元伙拼，抢占榜单前三！',
            share_desc: '【0元伙拼】加入伙拼战队，与队友一起抢占榜单头筹，夺取大奖！',
            share_icon: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
        };

        setWxShare(shareInfo, () => {
            ptLog.stat({
                json: {
                    share: 1
                }
            });
        });
    } else if (isBeibei) {
        const $input = $('#app_share_conf');
        const base = {
            url: window.location.href,
            title: '快加入战队，我们一起0元伙拼，抢占榜单前三！',
            desc: '【0元伙拼】加入伙拼战队，与队友一起抢占榜单头筹，夺取大奖！',
            platform: 'weixin_copy'
        };
        $input.attr('value', JSON.stringify(base));
    }
};

const initApp = () => {
    const PAGE_SIZE = 6;
    const iid = httpurl.uri.params.iid;
    const status = {
        page: 0,
        openGroupNick: '',
        joinGroupNick: ''
    };

    const toDouble = num => (num < 10 ? `0${num}` : `${num}`);

    const timeFormat = (time) => {
        const oDate = new Date(time * 1000);
        return oDate.getFullYear() + '-' +
            toDouble(oDate.getMonth() + 1) + '-' +
            toDouble(oDate.getDate()) + ' ' +
            toDouble(oDate.getHours()) + ':' +
            toDouble(oDate.getMinutes());
    };

    const processData = (data) => {
        data.isEnd = !data.rank_groups || data.rank_groups.length < PAGE_SIZE;

        if (data.duobao_item) {
            const item = data.duobao_item;
            item.jpg = `${item.img}!210x210.jpg`;
            item.webp = `${item.img}!210x210.webp`;
            item.stock = item.try_stock;
            item.originPrice = item.origin_price / 100;
            item.limitTime = gapTime(parseInt(new Date().getTime() / 1000, 10), item.gmt_end);

            const delay = Number(item.gmt_end) - parseInt(new Date() / 1000, 10);
            if (delay > 0) {
                item.statusClass = 'wait';
            } else {
                item.statusClass = 'lotteryed';
                item.endtime = timeFormat(Number(item.gmt_end));
            }
        }

        if (data.user_open_group) {
            status.openGroupNick = data.user_open_group.group_nick;
        }
        if (data.user_join_group) {
            status.joinGroupNick = data.user_join_group.group_nick;
        }

        if (data.rank_groups) {
            data.rank_groups.forEach((i, index) => {
                i.key = ((data.page - 1) * data.page_size) + index + 1;
                i.current = (i.group_nick === status.openGroupNick) ||
                    (i.group_nick === status.joinGroupNick);
            });
        }

        return data;
    };

    // 大家都在团打点
    const moresLog = ({ iid, recom_id, items }) => {
        // list_show事件打点
        // {leading: false,trailing: false}
        // 在给定的时间内最多执行一次，并且尽快执行
        const $container = $('#J_container-mores');
        const $window = $(window);
        const winHeight = $window.height();

        $window.on('scroll.listShow', _.throttle(() => {
            if ($window.scrollTop() + winHeight > $container.offset().top) {
                ptLog.stat({
                    et: 'list_show',
                    rid: 85997,
                    json: {
                        block_name: '拼团承接页_大家都在团',
                        f_item_id: iid,
                        recom_id,
                        ids: _.map(items, (item) => (item.iid)).join(',')
                    }
                });
                $window.off('scroll.listShow');
            }
        }, 80));
    };

    // 大数据－大家都在团
    const renderMores = (data) => {
        mores.bigDataInit({
            iid: data.iid,
            uid: data.uid,
            event_id: data.event_id,
            options: {
                isSticky: true,
                rid: 85997
            }
        }).then((res) => {
            moresLog({
                iid: data.iid,
                recom_id: res.recom_id,
                items: res.fightgroup_items
            });
        });
    };

    const renderTpl = ($container, tplString, data) => {
        $container.append(new Xtemplate(tplString).render({ data }));
    };

    const render = (res) => {
        muiLoading.remove();
        const resp = processData(res);
        if (resp.duobao_item) {
            mainbox.render(resp.duobao_item);
            resp.duobao_item.uid = cookie('_logged_');
            renderMores(resp.duobao_item);
        }
        if (resp.user_open_group || resp.user_join_group) {
            renderTpl($('#J_join'), joinTpl, resp);
        }

        if (resp.rank_groups) {
            renderTpl($('#J_item'), listTpl, resp);
        }

        lazyLoad.getLazyImg();
    };

    const loadMore = () => {
        $(document).on('click', '.J_more', function () {
            $(this).remove();
            const page = ++status.page;
            api.loadList({ iid, page, PAGE_SIZE }).then(res => {
                render(res);
            });
            ptLog.stat({
                et: 'list_show',
                json: {
                    page: status.page
                }
            });
        });
    };

    const init = () => {
        if (!iid) {
            popup.note('无效的参数！', 1500);
            return;
        }
        const page = ++status.page;
        api.loadList({ iid, page, PAGE_SIZE }).then(res => {
            render(res);
        });
        loadMore();

        api.getDuobaoNotice(iid).then(resp => {
            if (typeof resp === 'string') {
                resp = JSON.parse(resp);
            }
            resp.notices.length && $('<div id="#J_notice" class="notice"></div>').appendTo('#J_noticeContainer').marquee({
                storage: resp.notices,
                template: '<script id="tmpl-tab" type="text/template">\
                            {@each data as item,index}\
                                <li class="info" data-step="${(data.length>1?index-1:1)}">${item.nick}\
                                    <span class="time">刚刚加入了</span>\
                                    <span class="goods">${item.fisrt_nick}</span>\
                                </li>\
                            {@/each}\
                            </script>'
            });
        });
        ptLog.init({
            page: '伙拼实时榜单'
        });
    };

    if (isWeixin) {
        login.authInit(window.location.origin + `/mpt/group/duobao/realtime-rank.html?iid=${iid}`, (result) => {
            if (result.isLogin) {
                wxFollow.init();
                init();
            } else if (result.token) {
                muiLoading.remove();
            }
        });
    } else {
        _login.checkLogin((isLogin) => {
            if (isLogin) {
                init();
            } else {
                _login.doLogin(() => {
                    init();
                });
            }
        });
    }
};

const init = () => {
    setShareInfo();
    initApp();
};

init();
