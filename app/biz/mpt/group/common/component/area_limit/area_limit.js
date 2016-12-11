import common from 'unit/common/js/common/common';
import Xtemplate from 'xtemplate/lib/runtime';

import tpl from './area_limit.xtpl';
import './area_limit.less';

$(document).on('touchend', '.J_icon-closed', (event) => {
    event.preventDefault();
    hide();
});

const shippingCheck = (data, cb) => {
    common.callAPI({
        method: 'beibei.trade.shipping.check',
        type: 'post',
        data,
        cache: true,
        noDialog: true,
        success(resp) {
            cb && cb(resp);
        },
        error() {
            console.log('net error');
        }
    });
};

const setImgs = (imgs) => {
    const html = _.map(imgs, img => `<img src="${img}">`);
    $('#J_goods_imgs').html(html.join(''));
};

const init = (config, onClickLeftBtnCb, onClickRightBtnCb) => {
    $('body').append(new Xtemplate(tpl).render());
    $('.J_btn-left').text(config.leftText);
    $('.J_btn-right').text(config.rightText);

    if (typeof onClickLeftBtnCb === 'function') {
        $('.J_btn-left').off().on('click', (event) => {
            event.preventDefault();
            onClickLeftBtnCb();
        });
    }

    if (typeof onClickRightBtnCb === 'function') {
        $('.J_btn-right').off().on('click', (event) => {
            event.preventDefault();
            onClickRightBtnCb();
        });
    }
};

const setTips = (text) => {
    $('.J_tips-detail').text(text);
};

const show = () => {
    $('.J_area-limit-mask').removeClass('hidden');
};

const hide = () => {
    $('.J_area-limit-mask').addClass('hidden');
};

export default {
    init,
    setImgs,
    setTips,
    show,
    shippingCheck
};
