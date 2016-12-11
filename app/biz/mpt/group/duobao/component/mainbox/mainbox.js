// 头部

import Xtemplate from 'xtemplate/lib/runtime';
import mpbTpl from './mainbox.xtpl';
import './mainbox.less';
import { downTimer } from '../../../common/util/utils';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

const render = function (data) {
    data.jpg = imageConvert.format320(data.jpg);
    $('#J_container-details').html(new Xtemplate(mpbTpl).render({ res: data }));

    // 执行倒计时
    if (data.limitTime && data.limitTime.second >= 0) {

        downTimer({
            obj: data.limitTime,
            $DOM: $('#J_downTimer'),
            role: 'pintuan'
        });
    }
};

export default {
    render
};
