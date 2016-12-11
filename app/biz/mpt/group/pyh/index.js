import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';

import env from '@beibei/env';
import backtop from '@beibei/backtop';
import ptLog from 'src/js/mp/pintuan/unit/ptLog';
import channelList from '../common/component/channelList/channelList.js';

import './index.less';

isp();
heatmap();
performance();

if (!env.app.isBeibei) {
    backtop();
}

ptLog.init({ page: '拼洋货' });
channelList.init({
    pageName: 'pyh',
    $container: $('#J_list-container')
});
