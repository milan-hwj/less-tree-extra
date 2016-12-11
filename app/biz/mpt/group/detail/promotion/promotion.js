/**
 * Created by shuizai on 16/9/29.
 */
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './promotion.xtpl';
import { timeFormat } from '../../common/util/utils.js';
import { gapTime, downTimer } from '../../common/util/utils.js';

export default (res, group) => {
    const now = parseInt(new Date() / 1000, 10);
    const data = Object.assign({}, res);
    _.each(data.promotions, (item) => {
        item.promotion_begin = item.promotion_begin || group.gmt_begin;
        if (item.promotion_end && item.promotion_end < now) {
            item.isOver = true;
        }
        if (item.promotion_begin && item.promotion_begin > now) {
            item.promotion_tip = `${timeFormat(
                { time: item.promotion_begin, type: 2 })}点抢`;
        }
        if (item.promotion_begin < now && item.promotion_end > now) {
            item.limitTime = gapTime(now, item.promotion_end);
        }
    });
    $('#J_promotion').append(new Xtemplate(tpl).render({ data }));

    // 执行倒计时
    _.each(data.promotions, (item, i) => {
        if (item.limitTime) {
            downTimer({
                obj: item.limitTime,
                $DOM: $('.J_promotion-timer').eq(i),
                role: 'pintuan-home'
            });
        }
    });
};
