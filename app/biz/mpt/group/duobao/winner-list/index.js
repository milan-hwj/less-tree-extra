import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import '@beibei/tingyun';
import mores from '../../common/component/mores/mores.js';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';// 热力图
import performance from '@beibei/statistics/statistics-performance';// 页面性能统计
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import popup from '@beibei/popup';
import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import common from 'unit/common/js/common/common';
import lazyLoadModule from '@beibei/lazyload';
import cookie from '@beibei/cookie';
import template from '@beibei/template';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';

import wxFollow from 'app/biz/mpt/common/auth/follow.js';
import { setWxShare } from '../../../common/share/wxshare';
import login from 'app/biz/mpt/common/auth/login.js';

import _login from 'unit/common/js/login';
import ptLog from '../../common/util/ptLog.js';
import mainbox from '../component/mainbox/mainbox';

import api from './api';
import './index.less';


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
            share_title: '哇，居然这么多人伙拼成功，夺得奖品！',
            share_desc: '【0元伙拼】加入伙拼战队，与队友队友齐心协力一起向大奖冲刺，下一件就是你的！',
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
            title: '哇，居然这么多人伙拼成功，夺得奖品！',
            desc: '【0元伙拼】加入伙拼战队，与队友队友齐心协力一起向大奖冲刺，下一件就是你的！',
            platform: 'weixin_copy'
        };
        $input.attr('value', JSON.stringify(base));
    }
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
                rid: 85996,
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
            rid: 85996
        }
    }).then((res) => {
        moresLog({
            iid: data.iid,
            recom_id: res.recom_id,
            items: res.fightgroup_items
        });
    });
};

const initApp = () => {
    const PAGE_SIZE = 20;
    const iid = httpurl.uri.params.iid;

    const Status = {
        active: 0,
        classPreix: 'z-for-'
    };

    const statusCont = [{
        page: 1,
        isEnd: false
    }, {
        page: 0,
        isEnd: false
    }, {
        page: 0,
        isEnd: false
    }];
    const $doc = $(document);
    const $userJoin = $('#J_user-join');
    const $container = $('#J_container');

    const $T_userJoin = $('#T_user-join');
    const $T_container = $('#T_container');
    const $T_dropdownBox = $('#T_dropdown-box');
    const tplString = $T_dropdownBox.html();

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
        const item = data.duobao_item;
        item.jpg = imageConvert.format200(item.img);
        item.stock = item.try_stock;
        item.originPrice = item.origin_price / 100;
        item.limitTime = 0;
        item.statusClass = 'lotteryed';
        item.endtime = timeFormat(Number(item.gmt_end));
        return data;
    };

    const renderlist = (resp) => {
        if (!resp.winners) {
            popup.note('还未开奖，将返回上一页面', 1500);
            setTimeout(() => {
                window.history.back();
            }, 1500);
            return;
        }

        resp.winners.forEach((i) => {
            i.avatar = imageConvert.format200(i.avatar);
            i.group_time = timeFormat(i.time);
        });

        if (statusCont[Status.active].page === 1) {
            resp.winners[0].is_leader = true;
        }

        if (!resp.winners || resp.winners.length < PAGE_SIZE) {
            statusCont[Status.active].isEnd = true;
        }

        const $dropdownBox = $('.J_dropdown-box');
        $dropdownBox.eq(Status.active).append(template(tplString, { list: resp.winners }));
        lazyLoad.getLazyImg();

        // reset height
        const $winnerListCont = $('#J_winner-list-cont');
        $winnerListCont.height($winnerListCont.children().eq(Status.active).height());
    };

    const renderGroup = (data) => {
        data.user_open_group.avatar = imageConvert.format160(data.user_open_group.avatar);
        if (!data.user_open_group && !data.user_join_group) {
            $userJoin.addClass('hidden');
            return;
        }
        if (!data.user_open_group) {
            $userJoin.html(template($T_userJoin.html(), data.user_join_group));
            return;
        }
        if (!data.user_join_group) {
            $userJoin.html(template($T_userJoin.html(), data.user_open_group));
            return;
        }
        if (data.user_open_group.group_rank > 3 && data.user_join_group.group_rank < 4) {
            $userJoin.html(template($T_userJoin.html(), data.user_join_group));
        } else {
            $userJoin.html(template($T_userJoin.html(), data.user_open_group));
        }
    };


    const bindEvent = () => {
        const $tab = $('.J_tab');
        const $winnerListCont = $('#J_winner-list-cont');

        $doc.on('click', '.J_tab', function () {
            if ($tab.indexOf(this) === Status.active) {
                return;
            }

            const $parent = $(this).parent();
            const index = $tab.indexOf(this);

            $winnerListCont.attr('data-active', index);
            $parent
                .removeClass(Status.classPreix + Status.active)
                .addClass(Status.classPreix + index);

            Status.active = index;

            if (statusCont[Status.active].page === 0) {
                statusCont[Status.active].page++;

           
                const group_index = Status.active;
                const page = statusCont[Status.active].page;
                api.loadList({
                    iid, 
                    group_index,
                    page,
                    PAGE_SIZE
                }).then(res => renderlist(res));
            }
            // reset height
            $winnerListCont.height($winnerListCont.children().eq(index).height());
        });
    };

    const render = (res) => {
        // 移除loading
        muiLoading.remove();

        const resp = processData(res);

        // 主商品信息
        mainbox.render(resp.duobao_item);

        // 渲染个人信息
        renderGroup(resp);

        // top3 Tab
        $container.html(template($T_container.html(), { list: resp }));

        renderlist(resp);
        bindEvent();

        // 猜你想团
        resp.duobao_item.uid = cookie('_logged_');
        renderMores(resp.duobao_item);
    };

    const init = () => {
        if (!iid) {
            popup.note('无效的参数！', 1500);
            return;
        }
        const group_index = Status.active;
        const page = statusCont[Status.active].page;
        api.loadList({
            iid, 
            group_index,
            page,
            PAGE_SIZE
        }).then(res => render(res));
        ptLog.init({
            page: '伙拼中奖名单'
        });
    };

    if (isWeixin) {
        login.authInit(window.location.href, (result) => {
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
