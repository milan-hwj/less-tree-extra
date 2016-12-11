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
import pageTpl from './page.xtpl';
import BB from '../../../../../../unit/common/js/common';
import authTool from '../../common/util/pusherAuth.js';
import popup from '@beibei/popup';
import customPopup from '../../common/component/popup/main';

let $btn;
let $subBtn;
let $codeInput;
let $paymentInput;
let timeHandle;
let isSending = false;
let lastTime = 60;
let data = {};
const rulePopup = customPopup({
    title: '可提现金额',
    contents: [
        '1、可提现金额：指该部分金额已确定且可以进行提现的金额',
        '2、每次提现，单笔提现金额至少为1元，最多不超过2000元',
        '3、提现金额200元以下时，将以微信红包方式发放，超过200元则以微信转账的方式发放，为了保证资金安全，预计2个小时内到账'
    ]
});
const main = {
    init: () => {
        main.initPage();
    },
    initPage: () => {
        // 用户信息
        BB.callAPI({
            type: 'GET',
            method: 'beibei.pusher.withdraw.info.get',
            success: (resp) => {
                data = main.dataFormat(resp);
                const tplStr = new Xtemplate(pageTpl)
                    .render(data);
                $('.main').html(tplStr);
                $btn = $('.code-btn');
                $subBtn = $('.withdrawals-btn');
                $paymentInput = $('.num-group input');
                $codeInput = $('.code-input');
                main.bindEvent();
            },
            error: () => {
            }
        });
    },
    dataFormat: (resp) => {
        return _.extend(resp, {
            balanceShow: (_.toNumber(resp.balance) / 100).toFixed(2)
        });
    },
    bindEvent: () => {
        $btn.on('click', main.startTiming);

        main.bindHelpTip();
        main.bindpaymentInputEvent($paymentInput);
        main.bindSubmitState();
    },
    bindHelpTip: () => {
        $('body').on('click', '.help-tip', () => {
            rulePopup.show();
        });
    },
    bindpaymentInputEvent: ($dom) => {
        let prevValue = '';
        $dom.on('keyup', (e) => {
            const $el = $(e.target);
            const num = $el.val();
            // 六位数字，至多带两位小数
            if (/^\d{1,6}((\.\d{1,2})|\.)?$/.test(num)) {
                prevValue = num;
            } else if (num === '') {
                prevValue = num;
                $el.val('');
            } else {
                $el.val(prevValue);
            }
        });
    },
    startTiming: () => {
        // 开始倒计时
        if (isSending) {
            return;
        }
        isSending = true;
        $btn.html(`${lastTime}s`).addClass('sending');
        timeHandle = setInterval(() => {
            lastTime--;
            if (lastTime === 0) {
                // 结束计时
                main.endTiming();
            } else {
                $btn.html(`${lastTime}s`);
            }
        }, 1000);

        // 发送验证码
        BB.callAPI({
            type: 'POST',
            method: 'beibei.user.code.send',
            data: {
                key: 'pusher_withdraw'
            },
            success: (resp) => {
                popup.note(resp.message);
            },
            error: () => {
            }
        });
    },
    endTiming: () => {
        // 结束倒计时
        isSending = false;
        lastTime = 60;
        clearInterval(timeHandle);
        $btn.html('重新获取').removeClass('sending');
    },
    bindSubmitState: () => {
        // 提现按钮状态控制、提现操作
        $subBtn.on('click', () => {
            // 提现操作
            if (!main.submitVerify()) {
                return;
            }
            BB.callAPI({
                method: 'beibei.pusher.withdraw.apply',
                type: 'POST',
                data: {
                    balance: $paymentInput.val() * 100,
                    code: $codeInput.val()
                },
                success(res) {
                    // 提现成功
                    if (res && res.success) {
                        location.href = '/mpt/pusher/withdrawals/withdrawals-success.html';
                        return;
                    }
                    // 失败处理
                    main.withdrawalsFail(res);
                }
            });
        });
        $codeInput.on('keyup', main.inputVerify);
        $paymentInput.on('keyup', main.inputVerify);
    },
    withdrawalsFail: (res) => {
        main.popError(res.message);
        if (res.type === 1) {
            // 非验证码错误导致的失败
            // 因验证码已被使用过, 允许重新获取验证码
            main.endTiming();
        }
    },
    popError: (msg) => {
        popup.note(msg || '未知错误', {
            mask: false
        });
    },
    inputVerify: () => {
        // 输入信息时验证数据有效性
        const payment = $paymentInput.val();
        const code = $codeInput.val() || '';
        if (!isNaN(payment)
                && parseFloat(payment) > 0
                && code.length === 4) {
            $subBtn.addClass('active');
            return true;
        }
        $subBtn.removeClass('active');
        return false;
    },
    submitVerify: () => {
        // 提交时验证数据有效性
        if (!main.inputVerify()) {
            return false;
        }
        const balance = data.balance / 100 || 0;
        const payment = parseFloat($paymentInput.val());
        $subBtn.removeClass('active');
        if (payment < 1) {
            main.popError('提现金额需大于1元');
            return false;
        } else if (payment > 2000) {
            main.popError('单次提现金额需小于2000元');
            return false;
        } else if (payment > balance) {
            main.popError('余额不足');
            return false;
        }
        $subBtn.addClass('active');
        return true;
    }
};

authTool.init({
    isPusherCB: main.init
});
