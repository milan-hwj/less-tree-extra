// 渲染banner
import Xtemplate from 'xtemplate/lib/runtime';
import _ from 'lodash';
import Slider from '@beibei/slider';
import './banner.less';
import bannerTpl from './banner.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert';

export default (data) => {
    const length = Object.keys(data).length;
    if (length) {
        data = _.map(data, item => imageConvert.format750(item));
        $('#J_slider').append(new Xtemplate(bannerTpl).render({ data, length }));
        const option = {
            container: '#J_banner .slider',
            wrap: '#J_banner .slider-outer',
            panel: '#J_banner .slider-wrap',
            fullScreen: 1,
            sizeRadio: 1,
            loop: true
        };
        if (length <= 5) {
            option.trigger = '#J_slider-status';
        } else {
            option.triggerIndex = '#J_banner .slider-index';
        }
        new Slider(option);
    }
};