/**
 * Created by shuizai on 16/9/10.
 */
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import httpConvert from '../../common/util/httpConvert.js';
import iconsTpl from './icons.xtpl';
import './icons.less';

// 渲染Icon
export default (res) => {
    const data = [res.platform_promises, res.platform_compensation_promises];
    _.each(data, (list) => {
        _.each(list, (item)=> {
            item.icon = httpConvert(item.icon);
        });
    });
    let target;
    if (res.event_type === 'oversea') {
        target = 'http://mp.beibei.com/hms2_page/quanqiugouqudao/qudaojiemi.html';
    } else {
        target = '/app/about.html';
    }
    $('#J_icons').html(new Xtemplate(iconsTpl).render({ data, target }));
};