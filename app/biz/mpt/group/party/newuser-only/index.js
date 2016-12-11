import '@beibei/tingyun';
import isp from 'unit/common/js/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import httpapi from '@beibei/httpurl';
import itemList1 from '../../common/component/itemlist/item_list_1/item_list_1';

import './index.less';

isp();
heatmap();
performance();

const uri = httpapi.uri;

const iid = uri.params.iid;
if (!iid) {
    window.alert('参数错误！');
} else {
    itemList1.init('.J_container', 'newuser_only', {
        iid,
        size: 'small'
    });
}
