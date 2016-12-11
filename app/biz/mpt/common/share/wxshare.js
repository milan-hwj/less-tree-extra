import wx from 'unit/common/js/wx/wx.js';
import env from '@beibei/env';

import {
    addUrlUtmSource,
    addParams
} from 'app/biz/mpt/group/common/util/tools.js';

// 获取品牌渲染的分享图片地址
const isBeibei = window.location.origin.indexOf('beibei.com') >= 1;

export const getShareImg = (img) => {
    img = img + '';

    // 只有 b1.hucdn.com 支持这个品宣的图片
    return img.indexOf('b1.hucdn.com') !== -1 &&
        img.indexOf('!share') === -1 &&
        img.indexOf('!mzshare') === -1 ?
        // 移除前面的图片后缀缩放尺寸
    img.replace(/!\d+x\d+\.jpg/, '')
    + ((env.app.isBeibei || isBeibei) ? '!share' : '!mzshare') :
        // 原始图片
        img;
};

// 初始化微信分享
export const setWxShare = (shareData, successCb, cancelCb) => {
    //如果在微信环境则,配置微信分享信息
    try {
        if (env.app.isWeixin) {
            wx.config(function() {
                wx.shareConfig({
                    title: shareData.share_title,
                    desc: shareData.share_desc,
                    // 添加sessionStorage中的utm_source 用于交易链路打点
                    link: addUrlUtmSource(shareData.share_link),
                    imgUrl: getShareImg(shareData.share_icon),
                    success: function() {
                        typeof successCb === 'function' && successCb();
                    },
                    cancel: function() {
                        typeof cancelCb === 'function' && cancelCb();
                    }
                });
            });
        }
    } catch (e) {
        console.error('设置微信分享信息失败');
    }
};

// wx分享入口配置
export const config = (opt) => {
    try {
        const data = opt.data;
        if (env.app.isWeixin) {
            wx.config(() => {
                wx.shareConfig({
                    title: data.share_title,
                    desc: data.share_desc,
                    // 添加sessionStorage中的utm_source 用于交易链路打点
                    // 添加url中的source用于赚宝打点
                    link: addParams(data.share_link, ['utm_source', 'source']),
                    imgUrl: getShareImg(data.share_icon),
                    success: () => {
                        typeof opt.successCb === 'function' && opt.successCb();
                    },
                    cancel: () => {
                        typeof opt.cancelCb === 'function' && opt.cancelCb();
                    }
                });
                if (typeof opt.configCb === 'function') {
                    opt.configCb(wx);
                }
            });
        }
    } catch (e) {
        console.error('设置微信分享信息失败');
    }
};

export default {
    getShareImg,
    setWxShare,
    config
};
