/**
 * @desc    贝贝推手-累计金额
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/08/08
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
            title: '累计金额 (元)',
            helpTip: {
                title: '累计金额',
                contents: ['历史至今已结算到账的所有金额之和。']
            },
            list: {
                title: '累计+'
            },
            $container: $('#J_main'),
            amountTip: ['累计订单金额(元)：', '累计好友金额(元)：'],
            loadDataHandle: key => main[key].loadRecords
        });
    },
    orderAmount: {
        loadRecords: (pageIndex, pageSize, callback) => {
            // 加载记录
            BB.callAPI({
                // mock
                // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.cmslist.get&version=57a86813360467b94c920491&mock_index=0',
                method: 'beibei.pusher.cmslist.get',
                data: {
                    status: 0,
                    page: pageIndex,
                    pageSize
                },
                type: 'GET',
                success: (resp) => {
                    callback(main.orderAmount.dataFormat(resp));
                },
                error: () => {
                    callback();
                }
            });
        },
        dataFormat: (resp) => {
            // 数据中间处理
            const data = resp.cms_list;
            _.each(data, (item) => {
                const moneyShow = (parseInt(item.commission, 10) / 100)
                    .toFixed(2);

                item.avatar = item.img;
                _.extend(item, {
                    moneyShow,
                    detailUrl: `../record-detail/reward-record.html?group_id=${item.group_id}`,
                    timeShow: util.dateFormat(
                        new Date(item.group_time * 1000),
                        '{YYYY}-{MM}-{DD} {hh}:{mm}'
                    ),
                    text: '成团',
                    img: `${item.avatar}!160x160.jpg`,
                    webp: `${item.avatar}!160x160.webp`
                });
            });
            return _.extend({}, resp, {
                list: data,
                all_cms: (parseInt(resp.all_cms, 10) / 100).toFixed(2),
                total_cms: (parseInt(resp.total_cms, 10) / 100).toFixed(2)
            });
        }
    },
    friendAmount: {
        loadRecords: (pageIndex, pageSize, callback) => {
            // 加载记录
            BB.callAPI({
                // mock
                // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.mine.friends.cms&version=5805fe9afd8d24c57585e552&mock_index=0',
                method: 'beibei.pusher.mine.friends.cms',
                data: {
                    status: 1,
                    page: pageIndex,
                    pageSize
                },
                type: 'GET',
                success: (resp) => {
                    callback(main.friendAmount.dataFormat(resp));
                },
                error: () => {
                    callback();
                }
            });
        },
        dataFormat: (resp) => {
            // 数据中间处理
            const data = resp.friend_infos;
            _.each(data, (item) => {
                const moneyShow = (parseInt(item.reward_price, 10) / 100)
                    .toFixed(2);

                _.extend(item, {
                    moneyShow,
                    statusShow: '',
                    detailUrl: 'javascript:;',
                    timeShow: util.dateFormat(
                        new Date(item.time * 1000),
                        '{YYYY}-{MM}-{DD} {hh}:{mm}'
                    ),
                    img: `${item.avatar}!160x160.jpg`,
                    webp: `${item.avatar}!160x160.webp`,
                    title: `${item.nick} 成为您的好友`,
                    reward: (parseInt(item.reward_price, 10) / 100).toFixed(2)
                });
            });

            return _.extend({}, resp, {
                list: data,
                all_cms: (parseInt(resp.all_cms, 10) / 100).toFixed(2)
            });
        }
    }
};

authTool.init({
    isPusherCB: main.init
});
