import cookie from '@beibei/cookie';
import env from '@beibei/env';
import popup from '@beibei/popup';
import common from '../../../../../../unit/common/js/common/common';
import bindDialog from '../component/bindDialog/bindDialog.js';
import customPopup from '../component/popup/main';
import wxTools from '../../../../../../src/js/mp/pintuan/unit/wxTools';
import logCreater from './ptLog.js';

const isWeixin = env.app.isWeixin;
const authUrl = window.location.href;
const appId = 'wx5c515370b018aef5';
const wxType = 10;

function auth({ isPusherCB, notPusherCb }) {
    wxTools.authInit(authUrl, (result) => {
        if (result.isLogin) {
            getPusherStatus({ isPusherCB, notPusherCb });
        } else {
            ptLog(); // 打点初始化
            bindDialog.show({ title: '手机登录，快速查询成团进度' });
            bindDialog.handle(result.token, () =>
                getPusherStatus({ isPusherCB, notPusherCb }), wxType);
        }
    }, appId, wxType);
}

function init({ isPusherCB, notPusherCb = () => {
    window.location.href = '/mpt/pusher/auth.html';
} }) {
    if (isWeixin) {
        auth({ isPusherCB, notPusherCb });
    } else {
        popup.alert('成为推手提现需要绑定微信号，请在微信中打开此页面');
    }
}

function logout(successCb) {
    common.callAPI({
        type: 'GET',
        method: 'beibei.h5.logout',
        data: {},
        success: successCb,
        error() {
            // popup.confirm('发生错误，请重新登录后再试', () => {
            //     window.location.href = '/i/account-index.html';
            // }, () => {
            // }, {
            //     actionConfig: [{
            //         text: '取消'
            //     }, {
            //         text: '我的账户'
            //     }]
            // });
        }
    });
}

// 获取用户是否为推手的状态
function getPusherStatus({ isPusherCB, notPusherCb }) {
    // 已经是推手
    // if (getPusherCookie()) {
    //     (typeof isPusherCB === 'function') && isPusherCB();
    // }
    // 修改为: 不读取cookie，每次都验证推手身份
    common.callAPI({
        type: 'GET',
        // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.isinvite.get&version=57a19cfa360467b94c920416&mock_index=0',
        // TODO mock
        method: 'beibei.pusher.identity.check',
        success(res) {
            // 登陆状态，没有绑定贝贝赚宝公众号，logout, 重新绑定登陆。
            if (!res.bind) {
                // cookie('st_au', null, {
                //     path: '/',
                //     expires: -1,
                //     domain: 'beibei.com'
                // });
                // cookie('_wx_token_', null, {
                //     path: '/',
                //     expires: -1,
                //     domain: 'beibei.com'
                // });
                // cookie('JSESSIONID', null, {
                //     path: '/',
                //     expires: -1,
                //     domain: 'beibei.com'
                // });
                // popup.alert('系统升级中，有问题请联系贝贝赚宝管家（微信号：bbzbgj001）');
                logout(auth.bind(null, { isPusherCB, notPusherCb }));
                return;
            }
            if (res.success) {
                // 已经是推手
                // setPusherCookie();
                if (res.status === 0) {
                    // 推手，被冻结
                    customPopup({
                        title: '账户异常',
                        contents: [
                            '您的贝贝赚宝账号由于发生违规行为已被冻结，如有疑问请联系贝贝赚宝管家微信（bbzbgj001、bbzbgj002）'
                        ],
                        closeable: false
                    }).show();
                } else {
                    if (res.err_code * 1 === 2) {
                        // err_code === 2:无效的会话，需要重新登录
                        common.callAPI({
                            type: 'GET',
                            method: 'beibei.h5.logout',
                            data: {},
                            success() {
                                window.location.href =
                                    `/login/login.html?redirect=${encodeURIComponent(window.location.href)}`;
                            },
                            error() {
                                popup.confirm('发生错误，请重新登录后再试', () => {
                                    window.location.href = '/i/account-index.html';
                                }, () => {
                                }, {
                                    actionConfig: [{
                                        text: '取消'
                                    }, {
                                        text: '我的账户'
                                    }]
                                });
                            }
                        });
                    }
                    // 正常推手身份
                    (typeof isPusherCB === 'function') && isPusherCB();
                }
            } else {
                // popup.alert('系统升级中，有问题请联系贝贝赚宝管家（微信号：bbzbgj001）');
                // 不是推手
                (typeof notPusherCb === 'function') && notPusherCb();
            }
        },
        error() {
            popup.alert('发生错误，请刷新后再试', () => {
                window.location.reload();
            });
        }
    });
}

function setPusherCookie() {
    const expiresDate = new Date();
    expiresDate.setFullYear(expiresDate.getFullYear() + 10);
    cookie('_group_isPusher', 1, {
        path: '/mpt',
        expires: expiresDate,
        domain: 'm.beibei.com'
    });
}

function getPusherCookie() {
    return cookie('_group_isPusher');
}

function ptLog() {
    logCreater({
        page: '手机号验证（贝贝赚宝）',
        rid: '85982',
        et: 'click'
    });
}
export default {
    init,
    setPusherCookie,
    getPusherCookie,
    getPusherStatus
};
