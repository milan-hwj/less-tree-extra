/**
 * @desc    推手商品页
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/08/01
 */
require('@beibei/tingyun');
require('./index.less');
require('../../../../../unit/common/js/isp')(); // 防拦截
require('@beibei/statistics/statistics-heatmap')(); // 热力图打点
// 页面性能统计
require('@beibei/statistics/statistics-performance')();
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import productTpl from './productList.xtpl';
import topAdsTpl from './topAds.xtpl';
import navMenuTpl from './navMenu.xtpl';
import BB from '../../../../../unit/common/js/common';
import lazyloadCreater from '@beibei/lazyload';
import adsHelper from '@beibei/ads_helper';
import Slider from '@beibei/slider';
import popup from '@beibei/popup';
import authTool from '../common/util/pusherAuth.js';
import logCreater from '../common/util/ptLog.js';
import util from '../common/util/util.js';
import navmenu from '@beibei/navmenu';
import dropdownMenu from '../common/component/dropdownMenu/main';
import backtop from '@beibei/backtop';
import pageSwitcher from '../common/component/pageSwitcher/main';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import muiLoading from '../../../../../unit/common/widget/pintuan/muiLoading/muiLoading.js'; // loading
// 搜索页
import searchPage from './search/search';
import searchInput from '../common/component/searchInput/main';

const lazyload = lazyloadCreater({
    useWebp: true
});

let pageIndex = 1;
let loading = false; // 加载标志
let opening = false; // 正在开团标志
let isOver = false; // 是否已加载所有数据
let callbackLoop = 0;
let category = 'all';
let sortBy = '';
const pageSize = 20;
const $products = $('#pushProducts');
const $loading = $('.item-loading');

const main = {
    init: () => {
        // 初始化
        main.initHeader();
        main.bindEvent();
        main.ptLog();
        main.setSwitchEvent();
    },
    initHeader: () => {
        // 初始化搜索栏
        main.initSearchInput();
        // 初始化分类
        main.initNav();
        // 初始化排序
        main.initSort();
        // 回到顶部
        backtop();
    },
    initSearchInput: () => {
        main.searchInput = searchInput({
            container: $('#J_search'), // 容器
            onCancel: () => {
                // 点击取消按钮事件
                pageSwitcher.switchTo('index');
            },
            onSearch: () => {
                // 搜索事件
                pageSwitcher.switchTo('search', main);
                // 搜索数据
                main.setSearchMode('search');
                main.loadProducts(true, searchPage.renderEmpty);
            }
        });
    },
    initNav: () => {
        const url = '//sapi.beibei.com/martgoods/category/pusher.html';
        BB.callAPI({
            url,
            type: 'get',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiMartgoodsCategoryGet',
            cache: true,
            noDialog: true,
            success: (resp) => {
                let data = [];
                if (resp.pusher) {
                    data = resp.pusher.cats;
                }
                const navStr = new Xtemplate(navMenuTpl).render({
                    data
                });
                $('.products-bar').prepend(navStr);
                new navmenu('#productsHeader', {
                    isSticky: true,
                    onItemSelect: ($item) => {
                        category = $item.attr('data-cat');
                        main.refresh();
                    }
                });
            }
        });
    },
    initSort: () => {
        dropdownMenu({
            $trigger: $('.sort'),
            $menuContainer: $('#menuContainer'),
            items: [{
                name: '综合排序',
                key: ''
            }, {
                name: '价格从高到低',
                key: 'price_desc'
            }, {
                name: '价格从低到高',
                key: 'price_asc'
            }],
            itemOnClick: (key) => {
                sortBy = key;
                main.refresh();
            }
        });
    },
    refresh: () => {
        // 刷新
        isOver = false;
        loading = false;
        pageIndex = 1;
        main.loadProducts(true);
    },
    setSearchMode: (type) => {
        isOver = false;
        loading = false;
        pageIndex = 1;
        main.searchMode = type;
    },
    getSearchUrl: () => {
        return main.searchMode !== 'search' ?
            `//sapi.beibei.com/pusher/item/${pageIndex}-${pageSize}-${category}-${sortBy}.html` :
            `//api.beibei.com/mroute.html?keyword=${main.searchInput.getInputValue()}&page=${pageIndex}&page_size=${pageSize}&method=beibei.pusher.item.search`;
    },
    loadProducts: (isCover, nullDataCallback) => {
        // 加载商品列表
        if (loading || isOver) {
            return;
        }
        if (callbackLoop >= 10) {
            callbackLoop = 0;
        } else {
            callbackLoop++;
        }
        const url = main.getSearchUrl();
        const jsonpCallback = 'BeibeiPusherItemGet';

        loading = true;
        $loading.html('正在加载...');
        BB.callAPI(
            _.extend(url.indexOf('sapi') !== -1 ? {
                dataType: 'jsonp',
                jsonpCallback: jsonpCallback + callbackLoop
            } : {}, {
                url,
                type: 'GET',
                cache: true,
                success: (resp) => {
                    loading = false;
                    if (!_.isArray(resp.pusher_items)) {
                        resp.pusher_items = _.toArray(resp.pusher_items);
                    }
                    if (resp.pusher_items.length > 0) {
                        // 数据处理
                        const data = main.dataFormat(resp);
                        // 渲染
                        const tplStr = new Xtemplate(productTpl).render({
                            data
                        });
                        if (isCover) {
                            $products.html(tplStr);
                        } else {
                            $products.append(tplStr);
                        }
                        lazyload.getLazyImg();
                        if (resp.page * resp.page_size > resp.total_count) {
                            // 没有更多
                            isOver = true;
                            $loading.html('没有啦');
                        } else {
                            isOver = false;
                            $loading.html('');
                        }
                    } else {
                        isOver = true;
                        if (nullDataCallback) {
                            $products.html('');
                            $loading.html('');
                            nullDataCallback();
                        } else {
                            $loading.html('没有啦');
                        }
                    }
                    muiLoading.remove();
                },
                error: () => {
                    loading = false;
                    $loading.html('服务正忙, 请稍后再试.');
                }
            })
        );
    },
    bindEvent: () => {
        main.bindLoadMore();
        main.bindProductClick();
    },
    bindLoadMore: () => {
        // 滑动加载
        const $win = $(window);
        const $doc = $(document);

        $win.on('scroll', () => {
            if (!loading
                && $win.scrollTop() + $win.height() > $doc.height() - 100) {
                pageIndex++;
                main.loadProducts();
            }
        });
    },
    bindProductClick: () => {
        // 产品点击事件
        $products.on('click', '.product', (e) => {
            if (opening) {
                return;
            }
            opening = true;
            const $el = $(e.target).closest('.product');
            const iid = $el.data('iid');
            // 开团
            BB.callAPI({
                method: 'beibei.fightgroup.pusher.apply',
                data: {
                    iid,
                    group_code: 1
                },
                type: 'GET',
                success: (resp) => {
                    // 失败
                    if (!resp || !resp.success) {
                        popup.note(resp.message || '未知错误', {
                            mask: false
                        });
                    }
                    // 成功
                    if (resp.success) {
                        location.href = util.getAbsolutePath(`mpt/group/home.html?group_code=${resp.data}&needshare=1&source=bbts`);
                    }
                    opening = false;
                },
                error: () => {
                    opening = false;
                }
            });
        });
    },
    dataFormat: (resp) => {
        // 数据中间处理
        const data = resp.pusher_items;
        // 数据中间处理
        let tempPrice;
        _.each(data, (item, k) => {
            tempPrice = (item.group_price / 100).toString().split('.');
            _.extend(item, {
                index: (resp.page - 1) * resp.page_size + k + 1,// 从1开始记
                priceInt: tempPrice[0],
                priceDec: tempPrice[1] ? `.${tempPrice[1]}` : '',
                all_commission: (_.toNumber(item.all_commission) / 100),
                img: imageConvert.format200(item.img)
            });
        });
        return data;
    },
    loadAds: () => {
        // 广告加载
        adsHelper([1536], (ads) => {
            if (ads && ads.length) {
                // 渲染
                main.renderSliderAds(ads);
            }
        });
    },
    renderSliderAds: (ads) => {
        // 渲染广告
        const tplStr = new Xtemplate(topAdsTpl).render({
            ads
        });
        $('#J_slider').html(tplStr).removeClass('hidden');
        new Slider({
            container: '#J_slider',
            wrap: '#J_slider-outer',
            panel: '#J_slider-wrap',
            trigger: '#J_slider-status',
            fullScreen: 1,
            play: true,
            loop: true
        });
    },
    ptLog: () => {
        // 打点
        logCreater({
            page: '开始助力（贝贝赚宝）',
            rid: '85982',
            et: 'click'
        });
    },
    setSwitchEvent: () => {
        pageSwitcher.register('index', {
            pageIn: () => {
                // 从其他页面切换到本页面的回调
                main.setSearchMode('index');
                main.loadProducts(true);
            },
            pageOut: () => {
                // 离开页面时的回调
                $products.html('');
            }
        }, true);
    }
};
main.loadProducts();
main.loadAds();

authTool.init({
    isPusherCB: main.init
});
