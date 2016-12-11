import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import lazyloadModule from '@beibei/lazyload';
import httpapi from '@beibei/httpurl';
import backtop from '@beibei/backtop';
import popup from '@beibei/popup';
import env from '@beibei/env';
import common from 'unit/common/js/common/common';
import share from 'unit/common/js/share';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import Xtemplate from 'xtemplate/lib/runtime';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import listTpl from './list.xtpl';
import filterTpl from './filter.xtpl';

import './index.less';

isp();
heatmap();
performance();

if (!env.app.isBeibei) {
    backtop();
}

{
    const lazyload = lazyloadModule({ useWebp: true });
    const [cat, index] = [httpapi.uri.params.cat, httpapi.uri.params.sub_cat_index];

    const [$win, $doc, $tab, $filter, $spinner, $itemList, $filterLayer, $filterOptions, $listContainer] =
        [$(window), $(document), $('.J_tab'), $('#J_filter'), $('#J_spinner'), $('#J_item-list'),
        $('#J_filter-layer'), $('#J_filter-options'), $('#J_list-container')
    ];

    /**
     * config.filter  筛选条件（综合hot、价格price_asc/desc、销量sale_desc）
     * config.cid     筛选TAB下的类别ID, 0表示全部
     * config.bid     筛选TAB下的品牌ID, 0表示全部
     */
    const config = {
        filter: 'hot',
        cid: '0',
        bid: '0'
    };

    const status = {
        page: 1,
        hasMore: true,
        isLoading: false
    };

    const getData = (page = 1, pageSize = 20) => new Promise((resolve, reject) => {
        status.isLoading = true;
        common.callAPI({
            url: `//sapi.beibei.com/fightgroup/item_search/${page}-${pageSize}-${cat}-${index}-${config.filter}-${config.cid}-${config.bid}.html`,
            jsonpCallback: 'BeibeiFightgroupItemSearch',
            dataType: 'jsonp',
            noDialog: true,
            success: resolve,
            error: reject,
            complete: () => {
                status.isLoading = false;
            }
        });
    });

    const handleData = (data) => {
        if (!(data && data.length)) return data;

        const result = data.concat();
        result.forEach((item) => {
            const tempPrice = (item.group_price / 100).toString().split('.');
            item.jpg = imageConvert.format320(item.img);
            item.priceInt = tempPrice[0];
            item.priceDec = tempPrice[1] ? `.${tempPrice[1]}` : '';
            item.originPrice = item.origin_price / 100;
            item.link = `//m.beibei.com/gaea_pt/mpt/group/detail.html?iid=${item.iid}&beibeiapp_info={"target":"detail","iid":${item.iid}}`;
            item.group_in_num = item.group_in_num > 10000 ? `${(item.group_in_num / 10000).toFixed(1)}万` : item.group_in_num;
        });
        return result;
    };

    const renderData = ($container, tplString, data) => {
        $container.append(new Xtemplate(tplString).render({ data }));
    };

    const renderList = (data) => {
        renderData($itemList, listTpl, handleData(data.fightgroup_items));
        lazyload.getLazyImg();

        status.hasMore = data.total_count > (data.page * data.page_size);
        if (!status.hasMore) {
            $itemList.append('<li class="z-end">------ 没有啦 ------</li>');
            $spinner.addClass('hidden');
        }
    };

    const setTitle = (title = '贝贝拼团') => {
        if (env.app.isBeibei) {
            share.setShare({ type: 'yes', title });
        } else {
            document.title = title;
            if (env.app.isWeixin && env.os.isIOS) {
                const $body = $('body');
                const $iframe = $('<iframe src="/favicon.ico"></iframe>');
                $iframe.on('load', () => {
                    setTimeout(() => {
                        $iframe.off('load').remove();
                    }, 0);
                }).appendTo($body);
            }
        }
    };

    const reset = () => {
        status.page = 1;
        status.hasMore = true;
        status.isLoading = false;
        $itemList.empty();
        $spinner.removeClass('hidden');
    };

    const bindEvent = () => {
        // 点击综合、价格、销量
        $doc.on('click', '.J_tab', (e) => {
            $filterLayer.addClass('hidden');
            $listContainer.removeClass('hidden');

            let filter;
            const $price = $tab.eq(1);
            const $this = $(e.currentTarget);
            $tab.removeClass('active');
            $this.addClass('active');

            if ($this.index() === 1) {
                if ($price.hasClass('sort-asc')) {
                    $price.removeClass('sort-asc').addClass('sort-desc');
                    filter = 'price_desc';
                } else {
                    $price.removeClass('sort-desc').addClass('sort-asc');
                    filter = 'price_asc';
                }
            } else if ($this.index() === 0) {
                $price.attr('class', 'tab J_tab');
                filter = 'hot';
            } else {
                $price.attr('class', 'tab J_tab');
                filter = 'sale_desc';
            }
            if (filter === config.filter) return;

            config.filter = filter;
            reset();
            getData().then(renderList);
        });

        // 点击筛选
        $filter.on('click', (e) => {
            const $this = $(e.currentTarget);
            $('#J_cats').find('span').each((i, el) => {
                const $el = $(el);
                $el.removeClass('active');
                config.cid.split('_').forEach((item) => {
                    if (item === $el.attr('data-cid')) {
                        $el.addClass('active');
                    }
                });
            });

            $('#J_brands').find('span').each((i, el) => {
                const $el = $(el);
                $el.removeClass('active');
                config.bid.split('_').forEach((item) => {
                    if (item === $el.attr('data-bid')) {
                        $el.addClass('active');
                    }
                });
            });

            if ($filterLayer.hasClass('hidden')) {
                $filterLayer.removeClass('hidden');
                $listContainer.addClass('hidden');
                $this.addClass('on');
            } else {
                $filterLayer.addClass('hidden');
                $listContainer.removeClass('hidden');
                $this.removeClass('on');
            }
        });

        // 选择类别/品牌
        $doc.on('click', '.J_option', function () {
            const $this = $(this);
            const $head = $(this).siblings().eq(1);
            if ($this.hasClass('active')) {
                $this.removeClass('active');
                if (!$this.parent().find('.active').length) {
                    $head.addClass('active');
                }
            } else {
                $this.addClass('active');
                $head.removeClass('active');
            }
        });

        // 选择全部
        $doc.on('click', '.J_option-all', function () {
            $(this).addClass('active').siblings().removeClass('active');
        });

        // 重置
        $doc.on('click', '#J_empty', () => {
            $('.J_option-all').trigger('click');
        });

        // 完成
        $doc.on('click', '#J_submit', () => {
            const cidArray = [];
            const bidArray = [];
            $('#J_cats').find('.active').each((i, el) => {
                cidArray.push($(el).attr('data-cid'));
            });
            $('#J_brands').find('.active').each((i, el) => {
                bidArray.push($(el).attr('data-bid'));
            });

            $filterLayer.addClass('hidden');
            $listContainer.removeClass('hidden');

            const cidString = cidArray.join('_');
            const bidString = bidArray.join('_');
            if (!(config.cid === cidString && config.bid === bidString)) {
                config.cid = cidString;
                config.bid = bidString;
                reset();
                getData().then(renderList);
            }

            const bool = config.cid === '0' && config.bid === '0';
            $filter.toggleClass('active', !bool);
            $filter.removeClass('on');
        });

        // 滚动加载
        $win.on('scroll', () => {
            if (!status.isLoading && status.hasMore && $win.scrollTop() + $win.height() > $doc.height() - 100) {
                getData(++status.page).then(renderList);
            }
        });
    };


    const init = () => {
        if (!(cat && index)) {
            popup.note('无效的参数！');
            return;
        }

        getData().then((resp) => {
            muiLoading.remove();
            // 渲染商品列表
            renderList(resp);
            // 渲染过滤菜单
            renderData($filterOptions, filterTpl, resp.cate_and_brand);
            // 修改title
            setTitle(resp.sub_tab_name);
            // 绑定事件
            bindEvent();
        }).catch((error) => {
            console.error('getData error!', error);
        });
    };

    init();
}
