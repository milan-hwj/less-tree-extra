/**
 * @desc    推手提现-我的好友
 * @author  yi.feng@husor.com
 * @date    16/10/12
 */
import '@beibei/tingyun';
import isp from 'unit/common/js/isp';
import heatmap from '@beibei/statistics/statistics-heatmap'; // 热力图打点
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import lazyloadCreater from '@beibei/lazyload';
import Xtemplate from 'xtemplate/lib/runtime';
import common from 'unit/common/js/common/common';
import util from '../../common/util/util';
import authTool from '../../common/util/pusherAuth';
import emptyPage from '../../common/component/emptyPage/main';
import LazyLoaderController from '../../common/component/slideLoader/main';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import listTpl from './list.xtpl';
import './index.less';

isp();
heatmap();
performance();

const $container = $('#J_main').find('ul');
const lazyload = lazyloadCreater({ useWebp: true });

const main = {
    slideController: {},
    isFirstLoadData: true,
    init: () => {
        main.getData().then(main.renderList);
        main.bindLoadMore();
    },
    getData: (page = 1, pageSize = 20) => (
        new Promise((resolve, reject) => {
            common.callAPI({
                method: 'beibei.pusher.mine.friends.get',
                data: {
                    page,
                    pageSize
                },
                type: 'GET',
                cache: true,
                noDialog: true,
                success: resolve,
                error: reject
            });
        })
    ),
    renderList: (resp) => {
        // mock start
        // resp = {
        //     friend_infos: [],
        //     page: 1,
        //     page_size: 20,
        //     total_count: 60
        // };
        // resp.friend_infos.length = 3;
        // _.fill(resp.friend_infos, {
        //     nick: '黑番茄',
        //     avatar: 'http://b3.hucdn.com/upload/face/1512/31/44077655074342_800x800.jpg',
        //     time: 1476752400,
        //     is_gold_member: true
        // });
        // mock end

        if (!_.isEmpty(main.slideController)) {
            main.slideController.updateStatus(resp);
        }
        if (resp.friend_infos && resp.friend_infos.length) {
            $container.append(new Xtemplate(listTpl).render(main.formatData(resp)));
            lazyload.getLazyImg();
        } else if (main.isFirstLoadData) {
            main.renderEmpty();
        }
        main.isFirstLoadData = false;
    },
    renderEmpty: () => {
        emptyPage({
            $container: $('#J_main'),
            contents: ['暂无好友~'],
            btnTitle: '喊好友一起玩',
            style: 'custom-empty-page',
            href: '/mpt/pusher/share.html'
        });
    },
    bindLoadMore: () => {
        main.slideController = new LazyLoaderController({
            $container,
            pageSize: 20,
            loadDataHandle: page => main.getData(page).then(main.renderList)
        });
    },
    formatData: (resp) => {
        if (resp.friend_infos && resp.friend_infos.length) {
            resp.friend_infos.forEach((i) => {
                i.avatar = imageConvert.format160(i.avatar);
                i.joinTime = util.dateFormat(
                    new Date(i.time * 1000),
                    '{YYYY}-{MM}-{DD} {hh}:{mm}'
                );
            });
        }
        return resp;
    }
};

authTool.init({
    isPusherCB: main.init
});
