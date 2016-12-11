const httpurl = require('@beibei/httpurl');
const cookie = require('@beibei/cookie');

import config from './config';

export const getWxItem = (option) => {
    let wxItem;

    config.WX_CONFIG_LIST.some((item) => {
        if (['type', 'source', 'appid'].some((keyname) => {
            return option[keyname] === item[keyname];
        })) {
            wxItem = item;
            return true;
        }
    });

    // 默认绑定贝贝拼团
    return wxItem ? wxItem : config.WX_CONFIG_LIST[1];
};

export const localStorageHelper = {
    get(key) {
        let value = localStorage.getItem(key);

        if (value) {
            try {
                value = JSON.parse(value);

                // 不设置时间
                if (!value.time ||
                    // 时间未过期
                    (value.time && value.time > Date.now())) {
                    value = value.value;
                }
            } catch (e) {
                return;
            }

        } else {
            return;
        }

        return value;
    },
    set(key, value, expired) {
        let expiredTime = 0;

        if (typeof expired === 'number') {
            expiredTime = Date.now() + expired * 86400000;

        } else if (Object.prototype.toString.call(expired) === '[object Date]') {
            expiredTime = expired.getTime();
        }

        localStorage.setItem(key, JSON.stringify({
            value,
            time: expiredTime
        }));
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

/*
    用户订单最近的数量，isOldCustomer 用于判断是否老用户
 */
export const orderCounts = {
    get() {
        let counts = localStorageHelper.get('_order_counts');
        return counts ? parseInt(counts) : 0;
    },
    set(counts) {
        let oDate = new Date();
        oDate.setMinutes(oDate.getMinutes() + 300);

        localStorageHelper.set('_order_counts', counts, oDate);
    },
    isOldCustomer() {
        return this.get() > 1;
    }
};

/*
    存储 token 用于手机绑定注册登录不再走授权
 */
export const wxSourceToken = {
    getName(wxItem) {
        return '_token_' + wxItem.source;
    },

    get(option) {
        return cookie(this.getName(getWxItem(option)));
    },

    set(option, token) {
        let oDate = new Date();
        oDate.setMinutes(oDate.getMinutes() + 10);

        cookie(this.getName(getWxItem(option)), token, {
            path: '/',
            expires: oDate,
            domain: 'beibei.com'
        });
    },
    clear() {
        config.WX_CONFIG_LIST.forEach((wxItem) => {
            cookie(this.getName(wxItem), 0, {
                path: '/',
                expires: -1,
                domain: 'beibei.com'
            })
        });
    }
};

/*
    用于登录状态
 */
export const sessionStatus = {
    isLogin() {
        return (cookie('__test__') && cookie('st_au') && cookie('_last_login_gmt_')) ||
            cookie('st_au') && this.getSymbol();
    },
    setSymbol() {
        let oDate = new Date();
        oDate.setMinutes(oDate.getMinutes() + 300);

        // 特么的神坑，服务器上session 两小时过期
        // 过期了就没登录了
        cookie('_has_session_', 1, {
            path: '/',
            expires: oDate,
            domain: 'beibei.com'
        });
    },
    getSymbol() {
        return cookie('_has_session_');
    }
};

/*
    用于存储当前二维码弹窗、登录注册绑定弹窗最后展示时间
    仅限一次会话当中
 */
export const lastShowTime = {
    get() {
        return window.localStorage.getItem('pt_signin_modal_show_time');
    },
    update() {
        window.localStorage.setItem('pt_signin_modal_show_time', Date.now());
    },
    isOverDays(day) {
        let last = parseInt(this.get());
        last = last ? last : 0;
        return typeof day === 'number' && Date.now() - day * 86400000 > last;
    }
};

/*
    用于存储 utmSource
 */
export const utmSource = {
    set() {
        var utmSource = httpurl.uri.params.utm_source;
        if (utmSource) {
            sessionStorage.setItem('utm_source', utmSource);
        }
    },
    get() {
        var utm = httpurl.uri.params.utm_source ||
            sessionStorage.getItem('utm_source');
        return utm ? utm : '';
    }
};

export const openidStorage = {
    getName(wxItem) {
        return 'pt_openid_' + wxItem.source + '_' + cookie('_logged_');
    },
    get(option) {
        let openid = localStorageHelper.get(this.getName(getWxItem(option)));
        return openid ? openid : '';
    },
    remove(option){
        localStorageHelper.remove(this.getName(getWxItem(option)));
    },
    set(option, openid) {
        let oDate = new Date();
        oDate.setDate(oDate.getDate() + 30);
        localStorageHelper.set(this.getName(getWxItem(option)), openid, oDate);
    },
    setFromMap(opmap) {
        var openidMap = {},
            temp = [];

        if (typeof opmap === 'string') {
            temp = opmap.trim().split(':');

            if (temp.length === 2) {
                openidMap[temp[0]] = temp[1];
            }

        } else if (Object.prototype.toString.call(opmap) === '[object Object]') {
            openidMap = opmap;
        }

        for (let [type, openid] of Object.entries(openidMap)) {
            this.set({
                type: parseInt(type, 10)
            }, openid);
        }
    },
    promiseGetOpenId(wxType, code) {
        // 参数传递错误了
        if (isNaN(parseInt(wxType))) {
            return;
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: '//api.beibei.com/mroute.html?method=beibei.h5.wechat.openid.get',
                type: 'get',
                cache: true,
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    type: wxType,
                    code: code
                },
                success: resolve,
                error: reject
            });
        });
    },
    getOpenId(wxType, callback) {
        const wxItem = getWxItem({
            type: wxType
        });

        const URL = location.href;
        const wechatCode = httpurl.uri.params.code; // code会失效
        const state = httpurl.uri.params.state;
        const openid = this.get(wxItem);

        const stateKey = 'getopenid_' + wxItem.type;

        const errorCallback = () => {
            location.href = getAuthorizeURL(URL, stateKey, 'snsapi_base', wxItem.appid);
        };

        if(openid) {
            callback(openid);

        } else {
            if(state === stateKey) {
                this.promiseGetOpenId(wxItem.type, wechatCode)
                .then((result) => {
                    if(result.success) {
                        const openid = result.data.open_id;

                        openidStorage.set(wxItem, openid);
                        callback(openid);

                    } else {
                        errorCallback();
                    }
                })
                .catch(errorCallback);

            } else {
                errorCallback();
            }
        }
    }
};

/**
 * 获取授权页面的URL地址
 * @param {String} redirect 授权后要跳转的地址
 * @param {String} state 开发者可提供的数据
 * @param {String} scope 作用范围，值为snsapi_userinfo和snsapi_base，前者用于弹出，后者用于跳转
 */
export const getAuthorizeURL = (redirect, state, scope, appId) => {
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const oUrl = new httpurl.httpurl(url);
    const needMRedirect = redirect.indexOf('m.beibei.com') === -1;

    redirect = redirect.replace(/[&\?]code=[\s\S^&]+/, '');

    oUrl.params = {
        appid: appId,
        redirect_uri: needMRedirect ?
            (window.location.protocol + '//m.beibei.com/mpt/wx_redirect.html?redirect=' + encodeURIComponent(redirect)) : redirect,
        response_type: 'code',
        scope: scope || 'snsapi_base',
        state: state || ''
    };

    oUrl.hash = 'wechat_redirect';

    return oUrl.toString();
};