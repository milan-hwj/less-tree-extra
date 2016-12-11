/**
 * Created by shuizai on 16/9/10.
 */
import Xtemplate from 'xtemplate/lib/runtime';
import infosTpl from './infos.xtpl';
import './infos.less';
import { gapTime, downTimer } from '../../common/util/utils.js';

// 渲染拼团信息
export default (res) => {
    const data = Object.assign({}, res);
    const now = new Date() / 1000;
    Object.assign(data, {
        priceOld: (data.origin_price) / 100
    });

    Object.assign(data, {
        limitTime: gapTime(Math.floor(now),
            (data.isWait ? data.gmt_begin : data.gmt_end))
    });

    // 好恶心的处理方式  也是666
    if (data.labels && data.labels.some &&
        data.labels.some(label => label === '三缺一')) {
        Object.assign(data, {
            labels: ['[三缺一]']
        });
    }
    const rule = data.item_fight_group.rule_introduce;
    const pArr = [];
    if (data.item_fight_group.rule_introduce) {
        if (typeof rule === 'string' && rule.indexOf('\n') !== -1) {
            rule.split('\n').forEach((element) => {
                pArr.push(element);
            });
        } else {
            pArr.push(data.rule_introduce);
        }
        Object.assign(data.item_fight_group, {
            rule_introduce: pArr
        });
    }
    $('#J_infos').html(new Xtemplate(infosTpl).render({ data }));
    // 执行倒计时
    downTimer({ obj: data.limitTime, $DOM: $('#J_countdown') });
};