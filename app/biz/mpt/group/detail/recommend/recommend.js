/**
 * Created by shuizai on 16/9/12.
 */

import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import Lazy from '@beibei/blazy';
import recommendTpl from './recommend.xtpl';
import ptLog from '../../common/util/ptLog.js';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';
import priceHandle from '../../common/util/priceHandle.js';
import './recommend.less';

// 渲染推荐商品
export default (data) => {
    if (data.is_success === false || !data.recom_items.length) return;
    const recommendHandle = () => {
        const oprateRecommend = bool => () => {
            const op = bool ? 'addClass' : 'removeClass';
            const _op = bool ? 'removeClass' : 'addClass';
            $('#J_recommend-mask')[_op]('fadeIn')[op]('fadeOut');
            $('#J_recommend-inner')[_op]('slideInUp')[op]('slideInDown');
        };

        // 隐藏推荐商品
        $('#J_recommend').on('click', '#J_recommend-mask', oprateRecommend(true))
            .on('click', '#J_recommend-title', oprateRecommend(true))
            .on('tap', '.J_recommend-item', (e) => {
                // 推荐商品打点
                const $this = $(e.target);
                ptLog.stat({
                    json: {
                        block_name: '抢光状态推荐商品',
                        iid: $this.attr('data-iid'),
                        position: $this.index()
                    }
                });
            });

        // 显示推荐商品
        $('#J_recommend-tip').on('click', oprateRecommend(false));
    };

    // 产品需求，推荐商品只取9个
    data.recom_items = data.recom_items.slice(0, 9);

    _.each(data.recom_items, (item) => {
        item.img = imageConvert.format200(item.img);
        Object.assign(item,
            priceHandle(item.price));
    });

    Object.assign(data, {
        srollWidth: Math.ceil(5.632 * data.recom_items.length * window.rem)
    });

    $('#J_recommend').html(new Xtemplate(recommendTpl).render({ data }));
    $('#J_recommend-tip').removeClass('hidden');
    recommendHandle();
    const lazy = new Lazy({
        container: '#J_recommend .scroll-bar',
        selector: '#J_recommend .b-lazy-h',
        loadInvisible: true
    });
    // 动画结束之后lazyload
    setTimeout(() => {
        lazy.revalidate();
    }, 300);
};
