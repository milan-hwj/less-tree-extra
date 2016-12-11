import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import Lazy from '@beibei/blazy';
import recommendSlideTpl from './recommendSlide.xtpl';
import priceHandle from '../../common/util/priceHandle.js';
import Slider from '@beibei/slider';
import ptLog from '../../common/util/ptLog.js';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import './recommendSlide.less';

const $window = $(window);
let lazyStatus = false;

// 渲染贝妈推荐(大家还买了)
export default (data, iid, callback) => {
    if (data.is_success === false || !data.recom_items.length) return;
    const $container = $('#J_recommend_slide');
    const logHandler = ({ ids }) => {
        ptLog.stat({
            et: 'list_show',
            rid: 85992,
            json: {
                block_name: '拼团详情页_大家还买了',
                f_item_id: iid,
                recom_id: data.recom_id,
                ids
            }
        });
    };

    const recommendSlideLog = ({ ids }) => {
        const winHeight = $window.height();
        const btnsHeight = $('#J_btns').height();
        $window.on('scroll.recommendSlideLog', _.throttle(() => {
            if ($window.scrollTop() + winHeight > btnsHeight + $container.offset().top) {
                logHandler({ ids });
                $window.off('scroll.recommendSlideLog');
            }
        }, 80));
    };

    data.recom_items = data.recom_items.slice(0, 9);
    _.each(data.recom_items, (item) => {
        Object.assign(item, {
            img: imageConvert.format320(item.img)
        });
        Object.assign(item,
            priceHandle(item.price));
    });

    // 每个slide3个进行分组
    Object.assign(data, {
        sort_items: _.chunk(data.recom_items, 3)
    });

    // const sortIids = _.map(data.sort_items, (list) => _.map(list, (item) => (item.iid)));
    const iids = _.map(data.recom_items, (item) => (item.iid));

    $container.html(new Xtemplate(recommendSlideTpl).render({ data }));

    new Slider({
        container: '#J_recommend_slide .slider',
        wrap: '#J_recommend_slide .slider-outer',
        panel: '#J_recommend_slide .slider-wrap',
        lazyIndex: 1,
        callback(index) {
            $container.find('.index li').eq(this.curIndex)
                .addClass('active').siblings()
                .removeClass('active');
            // callback有问题先不进行切换slider打点
            // logHandler({ ids: sortIids[this.curIndex].join(',') });
        }
    });

    const lazy = new Lazy({
        selector: '#J_recommend_slide .b-lazy',
        success() {
            !lazyStatus && callback();
            lazyStatus = true;
        }
    });

    // click打点
    $container.on('tap', '.J_recommend-item', (e) => {
        const $this = $(e.currentTarget);
        const id = $this.data('iid');
        ptLog.stat({
            et: 'click',
            entity_list: id,
            rid: 85992,
            json: {
                f_item_id: iid,
                block_name: '拼团详情页_大家还买了',
                iid: id,
                position: $this.index()
            }
        });
    });

    recommendSlideLog({ ids: iids.join(',') });
};
