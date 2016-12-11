/**
 * Created by shuizai on 16/9/10.
 */
import _ from 'lodash';
import httpurl from '@beibei/httpurl';
import { gapTime } from './utils.js';

const NORMAL = 'NORMAL';
// 抽奖商品
const LOTTETY = 'LOTTERY';
// 试用商品
const TRIAL = 'TRIAL';
// 夺宝商品
const DUOBAO = 'DUOBAO';
// 新抽奖商品
const NEW_LOTTERY = 'NEW_LOTTERY';

// 获得团购类型
export const getGoodsType = (data = {}) => {
    let type;
    switch (true) {
    case (data.is_lottery_item === 1):
        type = LOTTETY;
        break;
    case (data.activity_type === 3):
        type = TRIAL;
        break;
    case (data.activity_type === 4):
        type = DUOBAO;
        break;
    case (data.activity_type === 6):
        type = NEW_LOTTERY;
        break;
    default:
        type = NORMAL;
    }
    return type;
};

// 判断是否是普通拼团
export const isNormal = (data = {}) => getGoodsType(data) === NORMAL;

export const getGroupState = (data) => {
    const now = (new Date() / 1000);
    const info = data.item_fight_group; // 拼团字段
    const type = getGoodsType(info);
    let state;
    if (data.gmt_end < now) {
        // 商品已结束
        // 判断商品类型
        switch (type) {
        case (LOTTETY):
            // 抽奖商品已开奖
            state = info.lottery_have_winner ? 6 : 3;
            break;
        case (TRIAL):
            // 试用商品已结束
            state = 8;
            break;
        case (DUOBAO):
            // 夺宝商品已结束
            state = 9;
            break;
        case (NEW_LOTTERY):
            // 新抽奖商品已开奖
            state = 11;
            break;
        default:
            state = 3;
        }
    } else if (data.gmt_begin > now) {
        // 商品还未开始
        state = 2;
    } else {
        // 商品在排期内
        switch (true) {
        case (type === TRIAL):
            // 试用商品不用判断库存
            state = 7;
            break;
        case (type === DUOBAO):
            // 抽奖商品
            state = 10;
            break;
        case (data.stock === 0):
            // 夺宝、试用商品不用判断库存
            state = 4;
            break;
        case (type === LOTTETY):
            // 抽奖商品
            state = 5;
            break;
        case (type === NEW_LOTTERY):
            // 新抽奖商品
            state = 12;
            break;
        default:
            state = 1;
        }
    }
    return state;
};

export const isNeedRedirect = () => {
    const key = 'fromWxFollowPage';
    const expired = '_expired';
    const uri = window.localStorage.getItem(key);
    const expiredTime = window.localStorage.getItem(expired) || 0;
    if (uri && uri.indexOf('http') !== -1 && Date.now() < expiredTime) {
        window.localStorage.removeItem(key);
        window.location.href = uri;
    } else {
        window.location.href = '/gaea_pt/mpt/group/channel.html';
    }
};

export const setRedirect = (uri) => {
    const key = 'fromWxFollowPage';
    if (window.localStorage && window.localStorage.setItem) {
        window.localStorage.setItem(key, uri);
        window.localStorage.setItem('_expired', Date.now() + (10 * 60 * 1000));
        return true;
    }
    return false;
};

export const setUtmSource = () => {
    const utmSource = httpurl.uri.params.utm_source;
    if (utmSource) {
        window.sessionStorage.setItem('utm_source', utmSource);
    }
};

export const getUtmSource = () => {
    const utm = httpurl.uri.params.utm_source ||
        window.sessionStorage.getItem('utm_source');
    return utm || '';
};

export const addUrlUtmSource = (url) => {
    const utm = getUtmSource();
    return url + (url.indexOf('?') !== -1 ? '&' : '?') + 'utm_source=' + utm;
};

// url 追加参数
export const addParams = (url, keys) => {
    // 获取参数
    const getParams = (key) => 
        (httpurl.uri.params[key] ||
        window.sessionStorage.getItem(key));
    // 组合参数
    const params = _.reduce(keys, (memo, key) => {
        memo.push(`${key}=${getParams(key)}`);
        return memo;
    }, []).join('&');
    const flag = url.indexOf('?') === -1 ? '?' : '&';
    return `${url}${flag}${params}`;
};
// 根据拼团各种状态数据，获取相关各种展示隐藏、文案等等内容
// 见 http://doc.husor.com/pages/viewpage.action?pageId=57060653 需求五
// 目前只在承接页使用
export const processStatusData = (data) => {
    const status = data.status * 1; // 拼团进行状态  1=>拼团成功;2=>等待成团;3=>拼团失败
    let statusClass = ''; // 前台状态展示
    let notice = ''; // 状态相对应的文案提醒
    let limitTime = null; // 倒计时时间
    let activeStep = 0; // 拼团步骤点亮
    let btns = []; // 操作按钮
    const isEventEnd = (data.event_gmt_end < Date.now() / 1000); // 活动是否结束
    const isGroupEnd = (data.gmt_end < Date.now() / 1000); // 本期团购是否结束
    let openDrop = (data.group_users_count <= 10 && status === 2); // 拼团详情在等待拼团状态下展开

    // 拼团成功
    if (status === 1) {
        // 已开奖
        if (data.is_lottery_item) {
            activeStep = 3;
            notice = `${data.require_num}人团已成团，棒棒哒~恭喜***获得一等奖 中奖名单`;
            statusClass = 'lotteryed';

            if (isEventEnd) {
                btns = ['lotteryed', 'channel'];
            } else {
                btns = data.stock ? ['makenew', 'channel'] : ['lotteryed', 'channel'];
            }
        } else if (data.activity_type * 1 === 3) {
            notice = `${data.require_num}人团已成团，棒棒哒~`;
            activeStep = 3;
            if (isEventEnd) {
                statusClass = 'lotteryed';
                btns = ['trial_end', 'channel'];
            } else {
                statusClass = 'lottery-wait';
                if (data.is_member) {
                    btns = ['channel'];
                } else {
                    // 试用商品不用判断库存
                    btns = ['makenew', 'channel'];
                }
            }
        } else if (data.activity_type * 1 === 6) {
            statusClass = isEventEnd ? 'lotteryed' : 'lottery-wait';
            if (isEventEnd) {
                btns = ['lotteryed', 'channel'];
            } else {
                btns = data.is_member ? ['addnew', 'channel'] : ['makenew', 'channel'];
            }
        } else {
            statusClass = 'win';

            if (data.is_member) { // 此人已参团
                notice = `${data.require_num}人团已成团，棒棒哒~`;
                activeStep = 3;
                btns = data.stock ? ['addnew', 'channel'] : ['order', 'channel'];
            } else {
                // 此人没参团 但是团满了
                if (data.stock) {
                    notice = '此团已满，您可以开个团哦~';
                    btns = ['makenew', 'channel'];
                    // 此人没参团 库存不足
                } else {
                    notice = '晚来一步，商品已被抢光啦~';
                    btns = ['channel'];
                }
            }
        }

        // 拼团失败
    } else if (status === 3) {
        notice = '该团未在规定时间内成团~';
        statusClass = 'failed';
        if (isEventEnd) {
            btns = ['channel'];
        } else {
            if (data.activity_type * 1 === 3) {
                btns = data.is_member ? ['channel'] : ['makenew', 'channel'];
            } else if (data.activity_type * 1 === 6) {
                btns = data.is_member ? ['addnew', 'channel'] : ['makenew', 'channel'];
            } else {
                if (data.stock === 0) {
                    btns = ['channel'];
                } else {
                    btns = data.is_member ? ['addnew', 'channel'] : ['makenew', 'channel'];
                }
            }
        }
        // 已抢光：没有库存且不是拼团成功状态 或者 当前库存小与成团人数
    } else if ((!data.stock || (data.stock < data.require_num)) && (data.activity_type * 1 !== 6)) {
        btns = ['channel'];
        notice = data.is_member ? '拼团太火爆，商品已被抢光啦~' : '晚来一步，商品已被抢光啦~';
        statusClass = 'over';

        // 抽奖商品
        if (data.is_lottery_item || data.activity_type * 1 === 3) {
            if (data.stock) {
                // 倒计时
                limitTime = gapTime(parseInt(new Date() / 1000, 10), data.gmt_end);
                openDrop = true;
                statusClass = 'wait';
                // 暂不对免费试用时的文案进行更改
                if (data.is_member) {
                    activeStep = 2;
                    btns = ['invite', 'channel'];
                    notice = `还差${data.need_num}人，快喊小伙伴一起参团吧~}`;
                } else {
                    activeStep = 1;
                    btns = ['join', 'channel'];
                    notice = '就等你了，赶快参团吧~';
                }
            } else {
                if (data.is_lottery_item) {
                    btns = ['lotteryed', 'channel'];
                } else {
                    // 试用商品
                    if (isEventEnd) { // 已结束
                        btns = ['trial_end', 'channel'];
                    } else {
                        btns = ['trial', 'channel'];
                    }
                }
            }
        }

        // 等待成团
    } else if (status === 2) {
        limitTime = gapTime(parseInt(new Date() / 1000, 10), data.gmt_end);
        statusClass = 'wait';
        if (data.is_member) {
            activeStep = 2;
            notice = `还差${data.need_num}人，快喊小伙伴一起参团吧~`;
            if (data.activity_type * 1 === 3) { // 试用
                btns = ['trial_invite', 'channel'];
            } else {
                btns = ['invite', 'channel'];
            }
        } else {
            activeStep = 1;
            notice = '就等你了，赶快参团吧~';
            if (data.activity_type * 1 === 3) { // 试用
                btns = ['trial', 'channel'];
            } else {
                btns = ['join', 'channel'];
            }
        }
    }

    const buttonMap = {
        addnew: {
            text: '再拼一单',
            className: 'J-one-more',
            block: 'one_more'
        },
        channel: {
            text: '更多拼团',
            className: (btns.length === 2) && 'btn-more-group J_log more-group-icon',
            block: 'more_group',
            link: '/gaea_pt/mpt/group/channel.html'
        },
        order: {
            text: '查看订单',
            className: 'J_check-order',
            block: 'check_order',
            link: `/orders/order-detail.html?oid=${data.oid}`
        },
        makenew: {
            text: data.activity_type === 3 ? '另开试用团' : '我也开个团',
            className: 'J_open-group',
            block: 'open_group'
        },
        invite: {
            text: '喊人参团',
            className: 'J_let-join',
            block: 'let_join'
        },
        join: {
            text: '我要参团',
            className: 'J_btn-join',
            block: 'join_group'
        },
        lotteryed: {
            text: '<p class="lotteryed">已开奖</p><p class="lotteryed-tips">查看中奖名单</p>',
            className: 'btn-lotteryed',
            block: 'lotteryed',
            link: `/mpt/group/winner-list.html?iid=${data.iid}`
        },
        trial_invite: {
            text: '喊人申请',
            className: 'J_let-join',
            block: 'let_join_free'
        },
        trial: {
            text: '我要申请',
            className: 'J_btn-join',
            block: 'J_open-group'
        },
        trial_end: {
            text: '查看试用名单',
            block: 'go_trail_list',
            link: `/mpt/group/0ysy/list.html?iid=${data.iid}`
        }
    };

    const btnDomHelper = (btns) => {
        let _html = '';
        _.forEach(btns, function (btn) {
            _html += '<a href="' +
                (buttonMap[btn] && buttonMap[btn].link || "javascript:;") + '" class="btn-operate">' +
                '<div ' + (buttonMap[btn].block ? "data-block=" + buttonMap[btn].block : "") +
                ' data-iid="' + data.iid + '" class="J_log ' + buttonMap[btn].className + '">' + buttonMap[btn].text + '</div>' +
                '</a>';
        });
        return _html;
    };

    const btnBuildHelper = (btns) => (
        `<div class="btn-group
        ${(btns.length === 1 ?
            'btn-operate-single' :
            'btn-operate-double')}">${btnDomHelper(btns)}</div>`
    );

    return {
        statusClass,
        notice,
        limitTime,
        openDrop,
        activeStep,
        btns,
        btnBuildHelper
    };
};
