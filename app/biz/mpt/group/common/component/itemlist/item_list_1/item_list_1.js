
/**
 *  商品模板，较为重要，免费试用、一元抢购、 抽奖等地方都用到
 */
import Xtemplate from 'xtemplate/lib/runtime';
import env from '@beibei/env';
import lazyLoadModule from '@beibei/lazyload';
import { priceFormat } from 'app/biz/mpt/group/common/util/utils';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading'; // loading
import itemList1Tpl from './item_list_1.xtpl';
import containerTpl from './container.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import api from './api';
import Footer from '../../../../common/component/footer/footer';

const lazyload = lazyLoadModule({
    useWebp: true,
    threshold: 200
});



const HOT_PAGE_SIZE = 20;

const SECKILL_PAGE_SIZE = 300;

const CAT = '';


const toDouble = num => (num < 10 ? `0${num}` : `${num}`);

const processData = (data) => {
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }

    const result = $.extend(true, {}, data);
    const from = (result.page - 1) * result.page_size;

    result.fightgroup_items.forEach((item, index) => {
        const temp = ((item.group_price || item.price) / 100).toString().split('.');
        const nowUnix = parseInt(Date.now() / 1000, 10);
        const oBegin = new Date();

        oBegin.setTime(item.gmt_begin * 1000);

        item.numIndex = (from + index + 1);
        item.numLine = (`${item.numIndex}`).length;

        // 免费试用商品不用判断常规库存，没有［已抢光状态］。
        item.img = imageConvert.format200(item.img);
        item.isSoldout = (item.activity_type === 3 ? false : (item.surplus_stock <= 0));
        item.beginMonth = oBegin.getMonth() + 1;
        item.beginDate = oBegin.getDate();
        item.beginTimeFormat = toDouble(`${oBegin.getHours()}:${toDouble(oBegin.getMinutes())}`);
        item.isWait = item.gmt_begin > nowUnix;
        item.isEnd = item.gmt_end < nowUnix;
        item.originPrice = priceFormat(item.origin_price);
        item.priceInt = temp[0];
        item.priceDec = temp[1] ? `.${temp[1]}` : '';
        item.beiginHour = (new Date(item.gmt_begin * 1000)).getHours();

        const appurl = env.app.isBeibei ? `&beibeiapp_info={"target":"detail","iid": "${item.iid}"}` : '';
        item.detail_url = `/gaea_pt/mpt/group/detail.html?iid=${item.iid}${appurl}`;

        // 免费试用 跳转H5商品详情链接
        item.trialDetailLink = `${window.location.origin}/gaea_pt/mpt/group/detail.html?iid=${item.iid}`;
        if (env.app && env.app.isBeibei) {
            item.trialDetailLink = `beibei://bb/base/webview?url=${encodeURIComponent(item.trialDetailLink)}`;
        }
    });

    return result;
};

const render = (container, data) => {
    const html = new Xtemplate(itemList1Tpl).render({ data: data.fightgroup_items });
    $(container).append(html);
};

const Status = {
    page: 1,
    tag: '',
    isInit: false,
    isLoading: false,
    isEnd: false
};

const $win = $(window);
const $doc = $(document);

const init = (container, tag, option = { size: '' }) => {
    Status.tag = tag;
    const pageSize = Status.tag === 'hot_group' ? HOT_PAGE_SIZE : SECKILL_PAGE_SIZE;
    const type = (tag === 'try_group' || tag === 'free_group') ? 'ui-list-2' : 'ui-list-1';

    if (Status.isInit) {
        return;
    }
    Status.isInit = true;
    // 先插入ul容器
    $(container).html(new Xtemplate(containerTpl).render({ type, size: option.size }));

    const $containerUl = $('.J_item-list-1-ul');
    const $spinner = $('.J_spinner');

    // 不是热销榜 去掉左边的数字标示
    if (tag !== 'hot_group') {
        $containerUl.addClass('z-no-number');
    }

    const callback = (data) => {
        // 移除loading
        muiLoading.remove();

        data.tag = Status.tag;
        render($containerUl, processData(data));
        lazyload.getLazyImg();

        Status.isLoading = false;
        Status.page += 1;

        $spinner.css('visibility', 'hidden');

        if (data.count < Status.page * pageSize) {
            Status.isEnd = true;
            $spinner.remove();
            (new Footer()).appendTo('body');
        }
    };

    // 获取数据 处理 扔进ul
    const loadList = () => {
        Status.isLoading = true;
        $spinner.css('visibility', 'visible');

        if (tag === 'hot_group') {
            api.getGroupList({
                page: Status.page,
                pagesize: pageSize,
                tag: Status.tag,
                cat: CAT
            }).then(res => callback(res));
        } else if (tag === 'try_group') { // 抽奖，也叫1分试用， 百丽挑一
            api.getTryItemList({ type: 0 }).then(res => callback(res));
        } else if (tag === 'redEnvelopes_group') { // 红包
            api.getTryItemList({ type: 1 }).then(res => callback(res));
        } else if (tag === 'free_group') { // 免费试用
            api.getFreeTrialList({
                page: Status.page,
                pagesize: pageSize
            }).then(res => callback(res));
        } else if (tag === 'newuser_only') { // 新人专享
            api.getNewUserOnlyList({
                page: Status.page,
                pagesize: pageSize,
                iid: option.iid
            }).then(res => callback(res));
        } else {
            api.getSeckillList({
                page: Status.page,
                pagesize: pageSize,
                tag: Status.tag,
                cat: CAT
            }).then(res => callback(res));
        }
    };

    loadList();

    $win.on('scroll', () => {
        if (!Status.isLoading && !Status.isEnd && $win.scrollTop() + $win.height() > $doc.height() - 400) {
            loadList();
        }
    });
};

module.exports = {
    init
};
