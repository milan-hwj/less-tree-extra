import env from '@beibei/env';
import hybrid from '@beibei/hybrid';

const share = (opt) => {
    // APP内分享
    const processAppShareInfo = (shareInfo) => {
        return {
            platform: shareInfo.share_channel,
            url: shareInfo.share_link,
            title: shareInfo.share_title,
            comment: shareInfo.share_desc,
            desc: shareInfo.share_desc,
            image: shareInfo.share_icon,
            small_img: shareInfo.share_icon,
            large_img: shareInfo.share_icon
        };
    };

    const setAppShare = (shareInfo) => {
        const $appShare = $('#app_share_conf');
        const config = processAppShareInfo(shareInfo);
        $appShare.val(JSON.stringify(config));
    };

    const createShareDom = () => {
        // APP分享所用DOM
        $('<input>').attr({
            id: 'app_share_conf',
            type: 'hidden'
        }).appendTo($('body'));
    };

    // APP内分享
    if (env.app.isBeibei) {
        createShareDom();
        setAppShare(opt.data);
        const monitorAction = {
            customNavBarRightBtn: 'optional'
        };
        const bbhybrid = window.bbhybrid;
        bbhybrid.config({
            jsApiList: monitorAction
        }, (/* error, result */) => {
            bbhybrid.customNavBarRightBtn({
                hidden: false
            });
        });
    }
};

export default {
    config: share
};
