import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import backtop from '@beibei/backtop';
import env from '@beibei/env';
import recToast from '../common/component/recToast/recToast.js'; // 推荐toast
import itemList1 from '../common/component/itemlist/item_list_1/item_list_1';
import ptLog from '../common/util/ptLog';

import './index.less';

isp();
heatmap();
performance();

if (!env.app.isBeibei) {
    backtop();
}

itemList1.init('.J_container', 'oneyuan_group', { size: 'small' });
recToast.init();
ptLog.init({
    page: '今日秒杀'
});