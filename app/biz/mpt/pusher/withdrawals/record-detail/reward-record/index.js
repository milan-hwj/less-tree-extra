/**
 * @desc    贝贝推手-累计收入明细
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/09/08
 */
import './index.less';
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import _ from 'lodash';
import BB from '../../../../../../../unit/common/js/common';
import util from '../../../common/util/util';
import commonRecord from '../common-record/main';
import authTool from '../../../common/util/pusherAuth.js';

isp();
heatmap();
performance();

const main = {
    init: () => {
        // 初始化
        commonRecord({
            numTitle: '+',
            $container: $('#main'),
            loadDataHandle: main.loadRecords
        });
    },
    loadRecords: (pageIndex, pageSize, callback) => {
        // 加载记录
        BB.callAPI({
            // mock
            // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.cms.detail.get&version=57d618dd360467b94c9206b0&mock_index=0',
            method: 'beibei.pusher.cms.detail.get',
            data: {
                group_id: util.getQueryString('group_id')
            },
            type: 'GET',
            success: (resp) => {
                callback(main.dataFormat(resp));
            },
            error: () => {
                callback();
            }
        });
    },
    dataFormat: (resp) => {
        // 数据中间处理
        const data = resp.order_list;
        const moneyFormat = (num, fix2) => {
            let result;
            if (fix2) {
                result = (parseInt(num, 10) / 100).toFixed(2);
            } else {
                result = (parseInt(num, 10) / 100);
            }
            return result;
        };
        _.each(data, (item) => {
            _.extend(item, {
                paymentShow: moneyFormat(item.paymemt, true),
                commissionShow: `+${moneyFormat(item.commission, true)}`,
                new_rewardShow: moneyFormat(item.new_reward, false),
                timeShow: util.dateFormat(
                    new Date(item.gmt_create * 1000),
                    '{YYYY}-{MM}-{DD} {hh}:{mm}'
                ),
                img: `${item.avatar}!160x160.jpg`,
                webp: `${item.avatar}!160x160.webp`
            });
        });
        _.extend(resp.cms_detail, {
            all_cms: moneyFormat(resp.cms_detail.commission, true),
            timeShow: util.dateFormat(
                new Date(resp.cms_detail.group_time * 1000),
                '{YYYY}-{MM}-{DD} {hh}:{mm}'
            )
        });
        return _.extend({}, resp, {
            list: data
        });
    }
};

authTool.init({
    isPusherCB: main.init
});

