import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import backtop from '@beibei/backtop';
import env from '@beibei/env';

import shareConfig from 'app/biz/mpt/common/share/share.js';
import recToast from '../common/component/recToast/recToast.js'; // 推荐toast
import ptLog from '../common/util/ptLog';

import Xtemplate from 'xtemplate/lib/runtime';
import common from 'app/biz/common/gaea/preload';
import tpl from './index.xtpl';
import './index.less';
import ItemList from './itemList';



isp();
heatmap();
performance();

let lists = [];
let activeIndex = null;
const main = {
    init() {
        // 热销列表初始化
        lists.push(ItemList({
            getData: this.getData('hot'),
            $container: $('.hot-list'),
            i: 0
        }));
        // 新品榜单初始化
        lists.push(ItemList({
            getData: this.getData('new'),
            $container: $('.new-list'),
            silence: true,
            i: 1
        }));
        // tab
        this.initTab();
        // 分析设置
        this.shareConfig();
        // 初始化渲染
        $('.tab').eq(0).trigger('click');
    },
    initTab() {
        $(document).on('click', '.tab', (e) => {
            const index = $('.tab').indexOf(e.currentTarget);
            if (index === activeIndex) {
                return;
            }
            lists[index].active();

            // tab变化，该部分应该抽象到组件中
            $('.list-container').attr('data-active', index);
            activeIndex = index;

            $('.tab').removeClass('active')
                .eq(index)
                .addClass('active');
            $('.list-container').height($('.list-container .list').eq(index).height());
        });
    },
    shareConfig() {
        shareConfig({
            data: {
                share_desc: "据说这些都是贝贝拼团里最新、最好的了，进来就有你中意的一款~",
                share_icon: 'http://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png',
                share_link: window.location.href,
                share_title: "贝贝拼团排行榜"
            }
        });
    },
    getData(type) {
        return (page, pageSize) => {
            return new Promise((resolve, reject) => {
                const url = `//sapi.beibei.com/fightgroup/hot/${page}-${pageSize}-${type}.html`;
                // const url = `http://sapi.beibei.com/item/fightgroup/${page}-${pageSize}-hot_group-.html`;
                common.callAPI({
                    id: 'getHotList',
                    once: true,
                    url,
                    type: 'get',
                    dataType: 'jsonp',
                    jsonpCallback: 'BeibeiFightgroupHotGet',
                    cache: true,
                    noDialog: true,
                    success(res) {
                        resolve(res);
                    },
                    error(res) {
                        reject(res);
                    }
                });
            });
        }
    }
};
if (!env.app.isBeibei) {
    backtop();
}
main.init();

recToast.init();
ptLog.init({
    page: '热销榜'
});

