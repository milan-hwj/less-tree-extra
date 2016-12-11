/**
 * @desc    推手提现-用户信息页
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/08/03
 */
require('./index.less');
require('@beibei/tingyun');
require('../../../../../../unit/common/js/isp')(); // 防拦截
require('@beibei/statistics/statistics-heatmap')(); // 热力图打点
// 页面性能统计
require('@beibei/statistics/statistics-performance')();
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import userInfoTpl from './userInfo.xtpl';
import BB from '../../../../../../unit/common/js/common';
import authTool from '../../common/util/pusherAuth.js';
import customPopup from '../../common/component/popup/main';
import logCreater from '../../common/util/ptLog.js';
import lazyloadCreater from '@beibei/lazyload';
import imageConvert from 'unit/common/js/image_convert/image_convert';

const lazyload = lazyloadCreater({
    useWebp: true
});

const rulePopup = customPopup({
    title: '提现规则说明',
    contents: [
        '可提现金额：可提现金额指该部分金额已确定，并且可以提现的金额。',
        '累计金额：历史至今已结算到账的所有金额之和。',
        '预计新增金额：该部分金额还没最终确定，只是预估值，如果购买用户发生退货等取消订单行为将不计算，最终结果按照可提现金额为准。',
        '以上规则由贝贝赚宝提供，如有疑问，请联系贝贝赚宝客服，微信号：bbzbgj001。'
    ]
});
let memberNum = 20;
const levelPopup = customPopup({
    title: '如何成为金牌会员？',
    style: 'level-popup-style',
    contents: () => {
        return [
            `① 成团${memberNum}单，即可成为金牌会员`,
            '② 会员等级和权益可联系贝贝赚宝管家：bbzbgj001，bbzbgj002'
        ];
    }
});
const myVerificationPopup = customPopup({
    style: 'popup-style',
    contents: [
        '本功能仅限金牌会员使用'
    ]
});
const myFriendsPopup = customPopup({
    style: 'popup-style',
    contents: [
        '暂无好友，本功能仅限金牌会员使用'
    ]
});

const main = {
    init: () => {
        main.initUserInfo();
        main.ptLog();
    },
    initUserInfo: () => {
        // 用户信息
        BB.callAPI({
            type: 'GET',
            method: 'beibei.pusher.userinfo.get',
            success: (data) => {
                main.dataFormat(data);
                const tplStr = new Xtemplate(userInfoTpl)
                    .render(data);
                $('.main').html(tplStr);
                lazyload.getLazyImg();
                main.bindEvent(data);
            },
            error: () => {
            }
        });
    },
    dataFormat: (data) => {
        // mock
        // _.extend(data, {
        //     pusher_type: 0,
        // });
        memberNum = data.member_num;
        const format = price => (_.toNumber(price) / 100).toFixed(2);
        const pusherMap = {
            1: '金牌会员'
        };
        const balanceShow = format(data.balance);
        const isZero = _.toNumber(data.balance) === 0;
        _.extend(data, {
            allCommission: format(data.all_commission),
            preCommission: format(data.pre_commission),
            balanceShow,
            isZero,
            avatar_img: imageConvert.format160(data.avatar),
            pusherStr: pusherMap[data.pusher_type]
        });
    },
    bindEvent: (data) => {
        // 规则说明点击弹窗
        $('body').on('click', '.help-tip', () => {
            rulePopup.show();
        });
        // “如何成为金牌会员？”点击弹窗
        $('body').on('click', '#J_level', () => {
            levelPopup.show();
        });
        // 我的验证码
        $('body').on('click', '#J_my-verification-code', () => {
            if (!data.pusher_type) {
                myVerificationPopup.show();
            } else {
                window.location.href = '/mpt/pusher/share.html?neesshare=1';
            }
        });
        // 我的好友
        $('body').on('click', '#J_my-friends', () => {
            if (!data.pusher_type) {
                myFriendsPopup.show();
            } else {
                window.location.href = '/mpt/pusher/withdrawals/my_friends.html';
            }
        });
    },
    ptLog: () => {
        logCreater({
            page: '我要提现（贝贝赚宝）',
            rid: '85982',
            et: 'click'
        });
    }
};

authTool.init({
    isPusherCB: main.init
});
