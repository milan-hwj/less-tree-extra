/**
 * @desc    贝贝推手-累计金额、预计收入通用组件
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/08/08
 */
import './index.less';
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import listTpl from './list.xtpl';
import layoutTpl from './layout.xtpl';
import lazyloadCreater from '@beibei/lazyload';
import emptyPage from '../../../common/component/emptyPage/main';
import customPopup from '../../../common/component/popup/main';
import LazyLoaderController from '../../../common/component/slideLoader/main';
import imageConvert from 'unit/common/js/image_convert/image_convert';

const lazyload = lazyloadCreater({
    useWebp: true
});

class Main {
    constructor(opt) {
        // 初始化
        _.extend(this, opt);
        this.status = [{
            name: 'orderAmount',
            title: '订单金额',
            controller: null
        }, {
            name: 'friendAmount',
            title: '新增好友金额',
            controller: null
        }];

        this.renderLayout();
        this.bindEvent();
        this.loadData(0)(1, 20);
        // this.loadData(1)(1, 20);
        $('.tab').eq(0).trigger('click');
    }
    renderLayout() {
        const tplStr = new Xtemplate(layoutTpl).render(this);
        this.$container.html(tplStr);

        this.$tabWrapper = $('.tab-wrapper');
        this.$amountOuter = $('.amount-list-outer');
        this.$amountInner = $('.amount-list-inner');
    }
    bindEvent() {
        this.bindHelpTip();
        this.bindLoadMore();
        this.bindSwitchTab();
    }
    bindHelpTip() {
        // 绑定问号点击事件
        const helpTipPopup = customPopup(_.extend({
            selector: '.help-tip'
        }, this.helpTip));

        $(document).on('click', '.help-tip', () => {
            helpTipPopup.show();
        });
    }
    bindLoadMore() {
        // 滑动加载
        const $win = $(window);
        const $doc = $(document);
        const tabOffsetTop = this.$tabWrapper.offset().top;
        const $tabContainer = $('.amount-tab-container');
        $win.on('scroll', () => {
            if ($win.scrollTop() > tabOffsetTop) {
                $tabContainer.addClass('sticky');
            }
            if ($win.scrollTop() < tabOffsetTop) {
                $tabContainer.removeClass('sticky');
            }
        });

        const bindController = (index) => {
            return new LazyLoaderController({
                $container: $('.amount-box').eq(index),
                pageSize: 20,
                isActive: false,
                loadDataHandle: this.loadData(index)
            });
        };
        this.status[0].controller = bindController(0);
        this.status[1].controller = bindController(1);
    }
    loadData(index) {
        return (pageIndex, pageSize) => {
            this.loadDataHandle(this.status[index].name)(pageIndex, pageSize, (resp) => {
                // 页面列表渲染
                this.renderList(resp, index, pageIndex);
                this.status[index].controller.updateStatus(resp);
                this.status[index].isLoaded = true;
                if(resp.page === 1) {
                    resp.total_cms && $('#J_num').html(resp.total_cms);
                }
            });
        };
    }
    renderList(resp, index) {
        let tplStr = '';
        let needRenderEnd = true;
        const list = resp.list;
        const contents = index ? ['暂无新增好友'] : ['钱包空空', '快去邀请好友来参团~'];
        const $inner = this.$amountInner.eq(index);
        const $amountBox = $inner.find('.amount-box');
        const $amountTip = $inner.find('.amount-tip');

        if(list && list.length) {
            _.each(list, (item) => {
                item.img = imageConvert.format100(item.img);
            });
            tplStr = new Xtemplate(listTpl).render(_.extend({
                data: list,
                opt: this
            }));
            $amountTip.html(this.amountTip[index] + resp.all_cms);
        } else {
            if(resp.page === 1) {
                // 空页面渲染
                tplStr = this.renderEmpty($inner, contents);
            }
            $amountTip.addClass('hidden');
        }
        $amountBox.append(tplStr);
        lazyload.getLazyImg();

        this.$amountOuter.height($inner.height());
    }
    renderEmpty($container, contents) {
        emptyPage({
            $container,
            contents,
            style: 'empty-style'
        });
    }
    bindSwitchTab() {
        // tab点击事件
        let active = null;
        $(document).on('click', '.tab', (e) => {
            const index = $('.tab').indexOf(e.currentTarget);
            if (index === active) {
                return;
            }
            if (!this.status[index].isLoaded) {
                this.loadData(index)(1, 20);
            }
            this.$amountOuter.attr('data-active', index);
            this.$tabWrapper
                .removeClass(`z-for-${active}`)
                .addClass(`z-for-${index}`);
            active = index;

            this.$amountOuter.height(this.$amountInner.eq(index).height());

            this.status[index].controller.active();
        });
    }
}

const creater = opt => new Main(opt);
export default creater;
