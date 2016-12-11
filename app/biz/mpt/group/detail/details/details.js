/**
 * Created by shuizai on 16/9/10.
 */

import Xtemplate from 'xtemplate/lib/runtime';
import detailsTpl from './details.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import './details.less';

// 过滤商品详情的script和style
export const filterInfoAndDetail = string => (
    string.replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
);

// 将商品详情的图片标签转换为 lazy-load 的模式
export const processItemDetailLazyLoad = (string) => {
    const placeholderImg = '//h0.hucdn.com/open/201645/1365743f2a2dd74f_640x640.jpg'; // 懒加载图片
    return string.replace(/<img[\s\S]*?src="([\s\S]*?)"[\s\S]*?\/?>/gi, (match, src) => {
        // 阿里云图片切图
        if (src.indexOf('.alicdn.') > -1) {
            src = `${src}_790x10000Q30.jpg`;
        }
        src = imageConvert.format750(src);
        return `<img class="b-lazy" data-src="${src}" src="${placeholderImg}" />`;
    });
};

// 渲染图文详情
export default (data) => {
    if (data[1]) {
        data[1] = processItemDetailLazyLoad(filterInfoAndDetail(data[1]));
    }
    $('#J_details').append(new Xtemplate(detailsTpl).render({ data }));
};

