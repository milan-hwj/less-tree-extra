import cookie from'@beibei/cookie';
import popup from '@beibei/popup';
import httpurl from '@beibei/httpurl';
import common from 'unit/common/js/common/common';
import LoginDialog from './dialog.js';

import {
    orderCounts,
    wxSourceToken,
    sessionStatus,
    utmSource,
    openidStorage,
    
    getWxItem,
    getAuthorizeURL
} from './tool';

let dialog = null;

const getBeibeiToken = (code, wxType) => {
    return new Promise((resolve, reject) => {
        common.callAPI({
            method: 'beibei.h5.open.auth',
            data: {
                code: code,
                source: 'weixin',
                // 1表示特卖，7表示拼团；默认使用贝贝特卖公众号进行授权登录
                wx_type: wxType
            },
            dataType: 'json',
            type: 'GET',
            success: resolve,
            error: reject
        });
    });
};

const authInit = (redirctUrl, callback, appId) => {
    var option = appId ? {
        appid: appId
    } : {
        source: utmSource.get()
    };

    var wechatCode = httpurl.uri.params.code;

    // 微信授权后，后端返回的我们自己内部的token，用来快速注册和绑定
    var token = wxSourceToken.get(option);
    
    // 获取当前授权登录的配置obj
    var wxItem = getWxItem(option);

    var url = getAuthorizeURL(redirctUrl, null, null, wxItem.appid);
    
    utmSource.set();
    
    // 已登录
    if (sessionStatus.isLogin()) {
        callback({
            isLogin: true,
            token: ''
        });

    } else if (token) {

        dialog = new LoginDialog({
            type: wxItem.type,
            token: token
        });

        callback({
            isLogin: false,
            token: token
        });

    // 没有code，先到微信中间页拿到code
    } else if (!wechatCode) {
        window.location = url;

    // 未登录，去获取微信的token用于快速注册
    } else {
        getBeibeiToken(wechatCode, wxItem.type)
        .then((resp) => {
            if (!resp.success) {
                window.location.href = url;

            } else {
                // 已绑定账号则会有data(此时已经登陆成功了)
                if (resp.data) {

                    // 更新前端用于登录判断的标志位
                    sessionStatus.setSymbol();
                    
                    // 设置订单数量
                    orderCounts.set(resp.fightgroup_order_count);

                    // 存储openid
                    openidStorage.setFromMap(resp.op_map);
                    
                    callback({
                        isLogin: true,
                        token: ''
                    });

                // 如果返回了token说明该微信账号在贝贝上未绑定手机号码
                } else if (resp.token) {

                    // 设置wx source token 用于下一次进入页面可以直接获取token用于手机绑定注册登录而无需再做一次授权
                    wxSourceToken.set(wxItem, resp.token);

                    dialog = new LoginDialog({
                        type: wxItem.type,
                        token: resp.token
                    });

                    callback({
                        isLogin: false,
                        token: resp.token
                    });

                } else {
                    // 意外的情况
                    popup.alert('网络异常，请稍后再试!', {}, () => {
                        history.go(-1);
                    });
                }
            }
        })
        .catch(() => {
            history.go(-1);
        });
    }
};

export default {
    getBeibeiToken,
    authInit,
    getDialog() {
        return dialog;
    }
};