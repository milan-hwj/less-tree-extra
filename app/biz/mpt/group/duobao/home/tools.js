// 根据拼团各种状态数据，获取相关各种展示隐藏、文案等等内容
// 见 http://doc.husor.com/pages/viewpage.action?pageId=57060653 需求五
// 目前只在承接页使用
import _ from 'lodash';
import { gapTime } from '../../common/util/utils.js';

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

// 按照活动类型来分
    // 夺宝成功
    if (!isEventEnd) {
        limitTime = gapTime(parseInt(new Date().getTime() / 1000), data.event_gmt_end);
        statusClass = 'wait';
        if (!data.duobao_open_group && !data.duobao_join_group) {
            btns = ['join', 'makenew'];
        } else if (data.duobao_open_group && !data.duobao_join_group) {
            btns = data.is_member ? ['invite', 'joined'] : ['join', 'joined'];
        } else if (!data.duobao_open_group && data.duobao_join_group) {
            btns = data.is_member ? ['invite', 'makenew'] : ['makenew', 'joined'];
        } else {
            btns = data.is_member ? ['invite', 'channel'] : ['joined', 'channel'];
        }
    } else {
        if (status === 1) {
            statusClass = 'lotteryed';
            btns = ['lotteryed', 'channel'];
        } else {
            statusClass = 'failed';
            btns = ['lotteryed', 'channel'];
        }
    }


    const buttonMap = {
        makenew: {
            text: '发起伙拼',
            className: 'J_open-group',
            block: 'open_huopin'
        },
        invite: {
            text: '喊人伙拼',
            className: 'J_let-join',
            block: 'let_huopin'
        },
        join: {
            text: '加入TA的战队',
            className: 'J_btn-join',
            block: 'join_huopin'
        },
        joined: {
            text: '我的伙拼',
            block: 'my_huopin',
            link: '/mpt/group/duobao/mine.html'
        },
        channel: {
            text: '更多伙拼',
            className: (btns.length === 2) && 'btn-more-group J_log more-group-icon',
            block: 'more_huopin',
            link: '/mpt/group/duobao/index.html'
        },
        lotteryed: {
            text: '查看中奖名单',
            block: 'go_huopin-list',
            link: `/mpt/group/duobao/winner-list.html?iid=${data.iid}`
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
        `<div class="btn-area
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