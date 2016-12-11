import '@beibei/tingyun';
import env from '@beibei/env';

import pageController from '../../common/component/pageController/main';
import Xtemplate from 'xtemplate/lib/runtime';
import common from 'app/biz/common/gaea/preload';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading'; // loading
import lazyLoadModule from '@beibei/lazyload';
import tpl from './index.xtpl';
import _ from 'lodash';
import './index.less';
import { priceFormat } from 'app/biz/mpt/group/common/util/utils';
import imageConvert from 'unit/common/js/image_convert/image_convert';
const lazyload = lazyLoadModule({
    useWebp: true,
    threshold: 200
});

class ItemList {
    constructor(opt) {
        this.opt = _.extend({
            pageSize: 20,
            silence: false
        }, opt);
        this.init();
    }
    active() {
        // 激活滚动加载
        this.slideController.active();
        if(!this.isLoaded) {
            // 首次加载, 默认获取第一页数据
            this.opt.getData(1, this.opt.pageSize).then(this.renderList.bind(this));
            this.isLoaded = true;
            return;
        }
    }
    init() {
        this.slideController = pageController({
            pageSize: this.opt.pageSize,
            $container: this.opt.$container,
            loadDataHandle: (page, pageSize) => this.opt.getData(page, pageSize).then(res => this.renderList(res)),
            isActive: false,
            context: this
        });
        if(!this.opt.silence) {
            this.active();
        }
    }
    renderList(resp) {
        this.slideController.updateStatus(resp);
        const data = this.dataFormat(resp);
        // 移除loading
        muiLoading.remove();
        // 渲染
        const html = new Xtemplate(tpl).render({ data: data.fightgroup_items });
        this.opt.$container.append(html);
        lazyload.getLazyImg();
        $('.list-container').height($('.list-container .list').eq(this.opt.i).height());
    }

    dataFormat(data) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        
        const result = $.extend(true, {}, data);
        const from = (result.page - 1) * result.page_size;
        const toDouble = num => (num < 10 ? `0${num}` : `${num}`);
        
        result.fightgroup_items.forEach((item, index) => {
            const temp = ((item.group_price || item.price) / 100).toString().split('.');
            const nowUnix = parseInt(Date.now() / 1000, 10);
            const oBegin = new Date();
        
            oBegin.setTime(item.gmt_begin * 1000);
        
            item.numIndex = (from + index + 1);
            if(item.numIndex <= 3) {
                item.numIndex = '';
            }
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
            // 新品榜单
            if(this.opt.i === 1) {
                item.isNew = true;
            }
        
            const appurl = env.app.isBeibei ? `&beibeiapp_info={"target":"detail","iid": "${item.iid}"}` : '';
            item.detail_url = `/mpt/group/detail.html?iid=${item.iid}${appurl}`;
        
            // 免费试用 跳转H5商品详情链接
            item.trialDetailLink = `${window.location.origin}/mpt/group/detail.html?iid=${item.iid}`;
            if (env.app && env.app.isBeibei) {
                item.trialDetailLink = `beibei://bb/base/webview?url=${encodeURIComponent(item.trialDetailLink)}`;
            }
        });
        
        return result;
    }
}

export default opt => new ItemList(opt);
