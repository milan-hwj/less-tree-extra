import './follow.less';
import tpl from './follow.xtpl';
import Xtemplate from 'xtemplate/lib/runtime';

import cookie from '@beibei/cookie';
import httpurl from '@beibei/httpurl';

import {
    orderCounts,
    openidStorage,
    getWxItem,
    lastShowTime,
    localStorageHelper,
    getAuthorizeURL,
} from './tool.js';

let BBPintuanFollowed = true;
let BBTemaiFollowed = true;

$(document).on('touchend', '.J_wxFollow-mask', (event) => {
    event.preventDefault();
    event.stopPropagation();
    hide();
});

const lastSubscribeTime = {
    getName(option) {
        return 'subscribe_time_' + option.type;
    },
    get(option) {
        let time = localStorageHelper.get(this.getName(getWxItem(option)));
        return time ? parseInt(time) : 0;
    },
    set(option, value) {
        var key = this.getName(getWxItem(option)),
            oldValue = parseInt(this.get(key)),
            newValue = parseInt(value);

        if (newValue && (!oldValue || oldValue < newValue)) {
            localStorageHelper.set(key, newValue);
        }
    },
    remove(option) {
        localStorageHelper.remove(this.getName(getWxItem(option)));
    },
    isOverDays(option, day) {
        let last = parseInt(this.get(option));
        last = last ? last : 0;
        return (typeof day === 'number') && ((Date.now() - day * 86400000)/1000 > last);
    }
};

const hide = () => {
    $('.J_wxFollow-modal').addClass('hidden');
};

const show = (type) => {
    if (!type) {
        return;
    }

    if (!$('.J_wxFollow-modal').length) {
        $('body').append(new Xtemplate(tpl).render({
            qrcode: type === 7 ? '//h0.hucdn.com/open/201628/fe6ac08e767b4b87_954x498.png' : '//h0.hucdn.com/open/201627/f63a8fb31258cdb4_774x392.png'
        }));
    }

    $('.J_wxFollow-modal').removeClass('hidden');
    lastShowTime.update();
};

const promiseCheckSubscribe = (type, openid) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '//api.beibei.com/mroute.html?method=beibei.h5.wechat.subscribe.check',
            type: 'GET',
            cache: true,
            xhrFields: {
                withCredentials: true
            },
            data: {
                type: type,
                open_id: openid
            },
            success: resolve,
            error: reject
        });
    });
};


/**
可能的错误
data: { errcode:40001,errmsg:"invalid credential, access_token is invalid or not latest hint: [A6dbMA0976vr20]}"
message:""
success:true
 */
const checkSubscribe = (type, cb) => {
    var wxItem = getWxItem({
        type: type
    });

    openidStorage.getOpenId(wxItem.type, (openid) => {
        promiseCheckSubscribe(wxItem.type, openid)
        .then((res) => {
            if (res.success) {
                // openid错误时，清除对应的storage
                if (res.data.errcode === 40003) {
                    openidStorage.remove({ type: wxItem.type });
                }

                // 已关注
                if (res.data.subscribe == 1) {
                    // 存储最近一次公众号关注时间
                    lastSubscribeTime.set(wxItem, res.data.subscribe_time);

                } else {
                    lastSubscribeTime.remove(wxItem);
                }
            }

            if (cb) {
                // 注意 接口可能40001 这种情况无法准确得知该用户是否已经关注
                // 默认其为关注状态，否则会打断用户正常流程
                cb(res.data.subscribe !== 0);
            }
        });
    });
};


// 判断是否需要关注
const checkCondition = (price) => {
    return (price < 1000 || (price >= 1000 && orderCounts.isOldCustomer()));
};

/**
 * [getShowFollowType 获取弹窗类型 强制关注逻辑详见#41751]
 * @return {[type]}              [0表示不弹窗，1表示弹窗类型为贝贝特卖，7表示弹窗类型为贝贝拼团]
 */
var getShowFollowType = function() {
    // 未关注贝贝拼团
    if (!BBPintuanFollowed) {
        return 7;
    }

    // 已经关注贝贝特卖
    if (BBTemaiFollowed) {
        return 0;
    }

    // 弹出过贝贝拼团1天内  不展示贝贝特卖关注框
    if (lastSubscribeTime.isOverDays({type: 7}, 1)) {
        return 1;
    }

    return 0;
};

var init = function() {
    // 新用户才绑定或当前这个用户才展示过二维码（没有超过一天）
    //if (!lastShowTime.isOverDays(1)) {
    //    return;
    //}

    // 贝贝拼团
    checkSubscribe(7, function(isPtFollow) {
        // 未关注贝贝拼团
        if(!isPtFollow) {
            BBPintuanFollowed = false;

        // 已关注贝贝拼团，获取贝贝特卖关注状态
        //} else {
        //    checkSubscribe(1, function(isTmFollow) {
        //        // 贝贝特卖未关注
        //        if(!isTmFollow) {
        //            BBTemaiFollowed = false;
        //        }
        //    });
        }
    });
};

export default {
    init,
    hide,
    show,
    checkCondition,
    getShowFollowType
};
