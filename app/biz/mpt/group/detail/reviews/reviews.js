/**
 * Created by shuizai on 16/9/10.
 */

import Xtemplate from 'xtemplate/lib/runtime';
import _ from 'lodash';
import reviewsTpl from './reviews.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import './reviews.less';

// 渲染评价列表
export default (data, iid) => {
    const getScoreHtml = (s = 0) => {
        let score = s;
        const scoreMap = Array.from({ length: 5 }, () => {
            const tpl = `<i class="icon-score ${score ? 'active' : ''}"></i>`;
            score > 0 && score--;
            return tpl;
        });
        return scoreMap.join('');
    };

    Object.assign(data, {
        tags: data.rate_tags,
        items: _.each(data.rate_items, (item) => {
            Object.assign(item, {
                avatar: imageConvert.format160(item.avatar),
                score: item.rate_star || 0,
                scoreHTML: getScoreHtml(item.rate_star)
            });
        }).slice(0, 2)
    });

    $('#J_reviews').append(new Xtemplate(reviewsTpl).render({ data, iid }));
};