/*
 * @Author: gyp
 * @Date:   2016-06-12 19:17:50
 * @Last Modified by:   gyp
 * @Last Modified time: 2016-06-23 16:47:30
 */

import common from 'unit/common/js/common/common';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import Xtemplate from 'xtemplate/lib/runtime';
import lazyloadModule from '@beibei/lazyload';
import env from '@beibei/env';
import convert from '../../../common/util/httpConvert.js'
import Lazy from '@beibei/blazy';
import listTpl from './list.xtpl';       // 一行一列商品模板
import _listTpl from './_list.xtpl';     // 一行两列商品模板
import './index.less';
const lazy = new Lazy({
    offset: 500
});

const isMizhe = env.app.isMizhe;
// 取整数
const price2Int = price => Math.floor(price / 100 || 0);
// 取小数
const price2Decimal = price => (price / 100).toString().split('.')[1] || '0';
// 是否已开团
const isGroupOpen = serverTime => parseInt(serverTime, 10) < Date.now() / 1000;
// 计算开团时间
const calGroupOpenHour = serverTime => new Date(serverTime).getHours();
//  格式化数据
const formatListData = (data = [], pageName = '') => {
    if (!data.length) {
        return data;
    }
    for (const v of data) {
        v.pageName = pageName;
        v.groupNumStr = v.group_num ? `${v.group_num}人团` : '';
        v.oripriceInt = `¥${price2Int(v.origin_price)}`;
        v.priceDecimal = `.${price2Decimal(v.group_price)}`;
        v.priceInt = price2Int(v.group_price);
        v.btnText = '去开团';
        v.link = `/gaea_pt/mpt/group/detail.html?iid=${v.iid}`;
        if (env.app.isBeibei) {
            v.link = `${v.link}&beibeiapp_info={"target":"detail","iid": "${v.iid}"}`;
        } else if (env.app.isMizhe) {
            v.link = `${v.link}&mizheapp_info={"target":"detail","iid": "${v.iid}"}`;
        }
        v.brand_logo = imageConvert.format200(v.brand_logo);
        v.country_circle_icon = convert(v.country_circle_icon);
        v.tags_v2 && v.tags_v2.length && (v.tags_v2[0] = imageConvert.format200(v.tags_v2[0]));
        v.rect_img = imageConvert.format750(`${v.rect_img}!750x350.jpg`);
        v.img = imageConvert.format320(v.img);
        v.src = isMizhe ? 'http://simg.husor.cn/bill/201512/3ac0732fd467bb202fc5869e1e89f226_640x300.png' :
            '//h0.hucdn.com/open/201639/4a71ffdf7964882f_750x350.png';
        v.isGroupOpen = isGroupOpen(v.gmt_begin);
        if (!v.isGroupOpen) {
            v.hour = calGroupOpenHour(v.gmt_begin * 1000);
            v.btnText = `${v.hour}点开抢`;
        }
        if (v.surplus_stock <= 0 || v.surplus_stock < v.group_num) {
            v.group_status = 4;
            v.btnText = '已抢光';
        }
    }
    return data;
};

const $win = $(window);
const $doc = $(document);
const lazyload = lazyloadModule({ useWebp: true });
const status = {
    page: 1,
    isEnd: false,
    isLoading: false
};

const getConfig = ({ pageName, pageSize = 40, cat = '', pid = '0' }) => ({
    channel: {
        url: `//sapi.beibei.com/item/fightgroup/${status.page}-${pageSize}-today_group-${cat}-${pid}.html`,
        // url: 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.home.get&version=580df396b1da0324086fa559&mock_index=1',
        jsonpCallback: 'BeibeiFightgroupItemGet'
    },
    pyh: {
        url: `//sapi.beibei.com/item/fightgroup/${status.page}-${pageSize}-oversea_group-${cat}-${pid}.html`,
        jsonpCallback: 'BeibeiFightgroupItemGet'
    },
    brand: {
        url: `//sapi.beibei.com/fightgroup/bigbrand/${status.page}-${pageSize}.html`,
        jsonpCallback: 'BeibeiFightgroupBigbrandGet'
    }
}[pageName]);

const getData = ({ pageName, cat, pid }) => new Promise((resolve, reject) => {
    status.isLoading = true;
    common.callAPI({
        url: getConfig({ pageName, cat, pid }).url,
        jsonpCallback: getConfig({ pageName, cat, pid }).jsonpCallback,
        dataType: 'jsonp',
        cache: true,
        noDialog: true,
        success: resolve,
        error: reject,
        complete: () => {
            status.isLoading = false;
        }
    });
});

const renderData = ({ $container, tpl = listTpl, data = {} }) => {
    $container.append(new Xtemplate(tpl).render({ data }));
    lazyload.getLazyImg();
};

const renderList = ($container, tpl, data) => {
    $('#J_loading').remove();
    renderData({ $container, tpl, data });

    let el;
    if (status.isEnd) {
        el = '<div id="J_loading" class="loading">------ 没有啦 ------</div>';
    } else {
        el = '<div id="J_loading" class="loading">正在加载...</div>';
    }
    $container.append(el);
    lazy.revalidate();
};

const getGroupList = ({ pageName, cat, pid, $container, callback }) => {
    getData({ pageName, cat, pid }).then((resp) => {
        muiLoading.remove();

        if (pageName === 'brand') {
            status.isEnd = (resp.page * resp.page_size) >= 200; // 产品要求最多展示200个
        } else {
            status.isEnd = (resp.page * resp.page_size) >= resp.count;
        }
        if (resp.fightgroup_items && resp.fightgroup_items.length) {
            renderList($container, cat && cat !== 'tomorrow' && pageName === 'channel' ? _listTpl : listTpl, {
                resp: formatListData(resp.fightgroup_items, pageName)
            });
        }
        if (callback && typeof callback === 'function') {
            callback(resp);
        }
    });
};

const loadMore = ({ pageName, cat, pid, $container, callback }) => {
    $win.on('scroll', () => {
        if (!status.isEnd && !status.isLoading && ($win.scrollTop() + $win.height() > $doc.height() - 400)) {
            status.page += 1;
            getGroupList({ pageName, cat, pid, $container, callback });
        }
    });
};

const init = ({ pageName, cat, pid, $container, callback }) => {
    const obj = { pageName, cat, pid, $container, callback };
    getGroupList(obj);
    loadMore(obj);
};

const reset = ($container) => {
    $container.empty();
    status.page = 1;
    status.isEnd = false;
    status.isLoading = false;
};

module.exports = {
    init,
    reset,
    status,
    renderData,
    getGroupList,
    formatListData
};
