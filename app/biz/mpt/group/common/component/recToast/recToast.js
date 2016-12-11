import common from 'unit/common/js/common/common';
import Xtemplate from 'xtemplate/lib/runtime';
import imageConvert from 'unit/common/js/image_convert/image_convert'

import tpl from './recToast.xtpl';
import './recToast.less';

/**
 * @param {String} className 区分不同页面toast的UI
 */
let options = {
    className: ''
};

const getRecommend = (callback) => {
    common.callAPI({
        url: `${window.location.protocol}//sapi.beibei.com/fightgroup/1-40-order_notice.html`,
        dataType: 'jsonp',
        jsonpCallback: 'BeibeiFightgroupOrderNoticeGet',
        cache: true,
        noDialog: true,
        success: callback
    });
};

const getRecommendCB = (res) => {
    render(res.fightgroup_orders);
};

const render = (data) => {
    setTimeout(() => {
        if (data && data.length) {
            renderToast(data);
            return;
        }
        // 数据池空后重新请求
        init();
    }, 5000);
};

const renderToast = (data) => {
    const DELAY = 0.35; // fadeout时间
    const LAST = 3; // toast持续时间
    const $toast = $(renderTemplate(data.shift()));

    const destroy = () => {
        $toast.remove();
        render(data);
    };
    const fadein = () => {
        $toast.addClass('fadein');
    };

    const fadeout = () => {
        $toast.removeClass('fadein');
        setTimeout(destroy, DELAY * 1000);
    };

    $toast.appendTo($('body'));
    setTimeout(fadein, 0);
    setTimeout(fadeout, LAST * 1000);
};


const renderTemplate = (item) => {
    item.className = options.className;
    item.avatar = imageConvert.format160(item.avatar);
    return new Xtemplate(tpl).render({ data: item });
};

const init = (opts) => {
    options = Object.assign({}, opts);
    getRecommend(getRecommendCB);
};

export default {
    init
};

