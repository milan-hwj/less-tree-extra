/* 
 * @Author: gyp
 * @Date:   2016-05-26 14:28:06
 * @Last Modified by:   gyp
 * @Last Modified time: 2016-07-08 19:15:40
 */
import adsHelper from '@beibei/ads_helper';
import env from '@beibei/env';
import appbar from 'unit/common/js/appbar';
import follow from '../../../common/auth/follow.js';

// 广告bar部分代码
// 广告位
function renderPtBar(data, elContainer) {
    var tpl = tplPtBar(data);
    $(elContainer).children().first().css('marginTop', '1.92rem');
    $(elContainer).prepend(tpl);
}

function tplPtBar(data) {
    var text = '贝贝-来就送60元新人礼包！',
        btnText = '前往下载',
        link = 'http://t.beibei.com/ptxz';
    if (data[0]) {
        data = data[0];
        if (data.text && data.name) {
            text = data.text;
            btnText = data.name;
        }

        if (data.target && data.target.type === 'foucs_follow') {
            link = 'javascript:;';
            $(document).on('click', '.J_ptAppBar', (event) => {
                event.stopPropagation();
                follow.show(7);
            });
        } else if (data.linkUrl) {
            link = data.linkUrl;
        }
    }

    //与运营约定，此为按钮文案
    var elArr = [
        '<div class="ptAppBar J_ptAppBar J_log" data-block="ptAppBar">',
        '<a href="'+ link +'">',
        '<img class="logo" src="//h0.hucdn.com/open/201621/1464000931_ffe0f8bf30e7d9d5_64x64.png">',
        '<span class="benfit-tips">' + text + '</span>',
        '<span class="go-dl">' + btnText + '</span>',
        '</a>',
        '</div>'
    ];

    return elArr.join('');
}


function init(elContainer, callback) {
    adsHelper('1300', (data) => {
        renderPtBar(data, elContainer);
        if (typeof callback === 'function') {
            callback();
        }
    }, () => {
        renderPtBar([], elContainer);
        if (typeof callback === 'function') {
            callback();
        }
    });
}

export default {
    init
};
