/**
 * @desc    贝贝推手-累计金额、预计收入明细通用组件
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/09/08
 */
import './index.less';
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import listTpl from './list.xtpl';
import pageTpl from './page.xtpl';
import lazyloadCreater from '@beibei/lazyload';
import lazyControll from '../../../common/component/slideLoader/main';
import emptyPage from '../../../common/component/emptyPage/main';
import imageConvert from 'unit/common/js/image_convert/image_convert';

const lazyload = lazyloadCreater({
    useWebp: true
});

class Main {
    constructor(opt) {
        // 初始化
        _.extend(this, opt);
        this.isRenderHead = false;
        this.isFirstLoadData = false;
        this.loadData(1, this.pageSize);
    }
    loadData(pageIndex, pageSize, callback) {
        // 取数、渲染
        this.loadDataHandle(pageIndex, pageSize, (resp) => {
            // 页面头部渲染
            if (!this.isRenderHead) {
                this.isRenderHead = true;
                this.renderHeader(resp);
            }
            // 页面列表渲染
            this.renderList(resp, callback);
        });
    }
    renderHeader(resp) {
        const tplStr = new Xtemplate(pageTpl).render(_.extend({
            data: _.extend({}, resp, this)
        }));
        this.$container.append(tplStr);
    }
    renderList(resp, callback) {
        let tplStr = '';
        const list = resp.list;
        if (list && list.length > 0) {
            // 渲染列表
            _.each(list, (item) => {
                item.img = imageConvert.format100(item.img);
            });
            tplStr = new Xtemplate(listTpl).render(_.extend({
                list,
                opt: this
            }));
        } else if (!this.isFirstLoadData) {
            // 空页面提示
            tplStr = this.renderEmpty();
        }
        this.isFirstLoadData = true;
        this.$container.append(tplStr);
        lazyload.getLazyImg();
        if (callback) {
            callback(resp);
        }
    }
    renderEmpty() {
        emptyPage({
            $container: $('#main'),
            style: 'custom-empty-page'
        });
    }
}

const creater = (opt) => {
    return new Main(opt);
};
export default creater;
