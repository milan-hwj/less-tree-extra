/* 
 * @Author: gyp
 * @Date:   2016-06-29 19:24:56
 * @Last Modified by:   yongpeng.guo
 * @Last Modified time: 2016-10-09 16:07:14
 */
import '@beibei/tingyun';
import isp from 'unit/common/js/isp';
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点
import imageConvert from 'unit/common/js/image_convert/image_convert';
import http from '@beibei/httpurl';
import popup from '@beibei/popup';
import wxTools from 'src/js/mp/pintuan/unit/wxTools.js';
import itemTitle from 'src/js/mp/pintuan/unit/item-title-1.js';
import userList from 'unit/common/widget/pintuan/userList/userList.js';
import mores from '../../common/component/mores/mores.js';
import api from './api';
import './index.less';

isp();
performance();
heatmap();

const app = !(function () {
    const params = http.uri.params;
    const iid = params.iid;

    const handleDetail = (res) => {
        itemTitle.init(res.fightgroup_lottery_item);
        // 设置微信分享的内容
        wxTools.setWxShare(res.fightgroup_lottery_item.share_info);
        // 大家都在团
        res.fightgroup_items = res.fightgroup_lottery_item_recoms;

        // 大数据－大家都在团
        mores.renderMores(res, {
            isSticky: true,
            iid,
            rid: 85998
        });
    };

    const handleWinnerList = (res) => {
        userList.init(iid, res, 2);
    };

    const init = function () {
        if (!iid) {
            popup.alert('链接有误');
        }
        const option = {
            biz_type: 2
        };
        api.getWinnerList(iid, option).then(res => handleWinnerList(res));
        api.getRecomLottery(iid, option).then(res => handleDetail(res));
    };

    init();
})();
