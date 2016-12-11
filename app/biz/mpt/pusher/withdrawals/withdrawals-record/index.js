/**
 * @desc    贝贝推手-提现记录
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/08/05
 */
import './index.less';
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import listTpl from './list.xtpl';
import BB from '../../../../../../unit/common/js/common';
import lazyControll from '../../common/component/slideLoader/main';
import util from '../../common/util/util';
import emptyPage from '../../common/component/emptyPage/main';
import authTool from '../../common/util/pusherAuth.js';

isp();
heatmap();
performance();

const $records = $('.records');

let slideController;
let isFirstLoadData = false;
const main = {
    init: () => {
        // 初始化
        main.bindLoadMore();
        main.loadRecords(1, 20);
    },
    loadRecords: (pageIndex, pageSize, callback) => {
        // 加载记录
        BB.callAPI({
            method: 'beibei.pusher.cashlist.get',
            data: {
                page: pageIndex,
                pageSize
            },
            type: 'GET',
            success: (resp) => {
                if (resp.cash_list
                    && resp.cash_list.length > 0) {
                    // 数据处理
                    const data = main.dataFormat(resp);
                    // 渲染
                    const tplStr = new Xtemplate(listTpl).render({
                        data
                    });
                    $records.append(tplStr);
                } else if (!isFirstLoadData) {
                    // 数据为空
                    main.renderEmptyPage();
                }
                isFirstLoadData = true;
                if (callback) {
                    callback(resp);
                }
            },
            error: () => {
                callback();
            }
        });
    },
    renderEmptyPage: () => {
        // 数据为空页面
        emptyPage({
            $container: $('body'),
            style: 'custom-empty-page',
            href: '../pusher-products.html'
        });
    },
    bindLoadMore: () => {
        // 滑动加载
        slideController = lazyControll({
            pageSize: 20,
            $container: $records,
            loadDataHandle: main.loadRecords
        });
    },
    dataFormat: (resp) => {
        // 数据中间处理
        const data = resp.cash_list;
        const statusMap = {
            A: '已申请',
            P: '处理中',
            S: '提现成功',
            F: '提现失败',
            R: '过期未领取退款'
        };
        // 数据中间处理
        _.each(data, (item) => {
            const moneyShow = (parseInt(item.money, 10) / 100)
                .toFixed(2);
            const customStyle = item.status === 'R' ? 'status-r' : '';
            _.extend(item, {
                moneyShow,
                customStyle,
                statusShow: statusMap[item.status],
                optTimeShow: util.dateFormat(
                    new Date(item.opt_time * 1000), // 后端发的10位日期
                    '{YYYY}-{MM}-{DD} {hh}:{mm}'
                )
            });
        });
        return data;
    }
};

authTool.init({
    isPusherCB: main.init
});
