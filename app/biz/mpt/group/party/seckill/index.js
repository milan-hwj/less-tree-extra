/**
 * 拼团-限时秒杀
 */
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import backtop from '@beibei/backtop';
import env from '@beibei/env';
import wxTools from 'src/js/mp/pintuan/unit/wxTools';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import { timeFormat } from '../../common/util/utils';
import formatPrice from '../../common/util/priceHandle';
import ptLog from '../../common/util/ptLog';

import SeckillList from '../../common/component/itemlist/seckill_list/seckill_list';
import Footer from '../../common/component/footer/footer';

import './index.less';
import api from './api';

isp();
heatmap();
performance();
if (!env.app.isBeibei) {
    backtop();
}

const app = {
    init() {
        api.getSeckillList().then((res) => {
            const newData = this.processData(res);
            (new SeckillList()).render(newData, $('#J_container'));
            // 移除loading
            muiLoading.remove();
            if (res) {
                (new Footer()).appendTo('body');
            }
        });
        ptLog.init({
            page: '限时秒杀'
        });

        this.shareConfig();
    },
    processData(data) {
        if (data && data.fight_items) {
            let items = [];
            const temp = [];
            const len = data.fight_items.length;
            // 处理end数据
            data.fight_items.forEach((cur, index, array) => {
                if (cur.type === 'end') {
                    items = items.concat(cur.items);
                    if (index == len - 1) {
                        cur.items = items;
                        temp.push(cur);
                    }
                } else {
                    temp.push(cur);
                }
            });
            data.fight_items = temp;

            data.fight_items.forEach((cur, index) => {
                cur._format_begin = timeFormat({ time: cur.gmt_begin, type: 1 });
                if (cur.type === "now") {
                    cur.title = cur._format_begin + ' 正在疯抢中';
                    cur.classname = 'now';
                    cur.btntext = '立即抢';
                    cur.surfix = '剩余';
                } else if (cur.type === "not_begin") {
                    cur.title = cur._format_begin + ' 开抢';
                    cur.classname = 'wait';
                    cur.btntext = (new Date(cur.gmt_begin * 1000)).getHours() + '点抢';
                    cur.surfix = '限量';
                } else {
                    cur.title = '24小时内已售罄商品';
                    cur.classname = 'end';
                    cur.btntext = '已抢光';
                    cur.surfix = '剩余';
                }
                cur.items.forEach((item, i) => {
                    const fp = formatPrice(item.group_price);
                    const fp_ori = formatPrice(item.origin_price);
                    item._priceInt = fp.priceInt;
                    item._priceDec = fp.priceDec;
                    item._priceIntOri = fp_ori.priceInt;
                    item._url = '/gaea_pt/mpt/group/detail.html?iid=' + item.iid + '&beibeiapp_info={"target": "detail", "iid":' + item.iid + '}';
                    item._lefttext = cur.surfix + item.surplus_stock + '件';
                    item._soldout_class = item.surplus_stock > 0 ? '' : 'show';
                    item._sold_precent = Math.floor((item.total_stock - item.surplus_stock) / item.total_stock * 100) || 0; //已卖出百分比
                    if (cur.type === "now") {
                        if(item.surplus_stock > 0 ) {
                            item._now_type = 'selling';
                        } else {
                            item._now_type = 'soldout';
                            item.btntext = '已抢光';
                            item.soldut_class = 'end J_end';
                        }
                    }
                });
            })
        }
        return data;
    },
    shareConfig() {
        const share_info = {
            share_title: '【贝贝拼团】来贝贝拼团，一起秒杀超值商品',
            share_desc: '超值爆款，整点秒杀，数量有限，先到先抢~！',
            share_link: window.location.href,
            share_icon: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
        };
        wxTools.setWxShare(share_info);
    }

};

app.init();
