/*
 * @Author: gyp
 * @Date:   2016-09-07 17:00:43
 * @Last Modified by:   yongpeng.guo
 * @Last Modified time: 2016-10-09 16:06:44
 */

'use strict';
// less
import './index.less';

/** 基础库start */
import '@beibei/tingyun'; // 听云监控
import isp from 'unit/common/js/isp/isp'; // 防拦截
import popup from '@beibei/popup';
import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import common from 'unit/common/js/common';
import lazyloadModule from '@beibei/lazyload';
import slider from '@beibei/slider';
import adsHelper from '@beibei/ads_helper';
import navmenu from '@beibei/navmenu'; // 顶部bar
import backtop from '@beibei/backtop';
import Xtemplate from 'xtemplate/lib/runtime'; // 模板js
import template from '@beibei/template';
import wx from 'unit/common/js/wx/wx';
import imageConvert from 'unit/common/js/image_convert';
/** 基础库 end */

/** 拼团自有组件库 start */
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import performance from '@beibei/statistics/statistics-performance';

import recToast from '../common/component/recToast/recToast';
import everydayHotGroup from 'unit/common/widget/pintuan/everydayHotGroup/edhg';
import adRowTpl from 'unit/common/widget/pintuan/adRowTpl/adRowTpl';

import channelList from '../common/component/channelList/channelList.js';
import locationBar from 'unit/common/widget/location-bar/location-bar';
import ptLog from '../common/util/ptLog.js';
import Lazy from '@beibei/blazy';

const lazy = new Lazy();

/** 拼团自有组件库 end */
import api from './api';

// 模板
import sliderListTpl from './sliderList.xtpl';
import navMenuTpl from './navMenu.xtpl';

isp();
performance();

const uri = httpurl.uri;
const lazyload = lazyloadModule({
    useWebp: true
});



(() => {
    // 全局变量初始化
    let g_tag = 'today_group'; // 全局变量
    let g_cat = '';
    let g_pid = uri.params.pid || 0; // 当前省份id,默认全国为0
    let g_province = uri.params.province || '全国';

    const isWeixin = env.app.isWeixin;
    let index_insert_ads; // 首页穿插广告位
    let cate_insert_ads; // 分类穿插广告位

    const $catTitle = $('.category-title');
    // @DOM 类目页头部icon
    const $ads = $('#J_ads');
    const $T_ads = $('#T_ads');
    // @DOM 首屏navmenu
    const $nav = $('#J_nav-menu');

    // @DOM 首屏silder
    const $silder = $('#J_slider-list');

	// @DOM 商品容器
    const $container = $('#J_container-list');
    const rid = {
        fruit: '1506',
        fooddrink: '1507',
        house: '1508',
        beauty: '1509',
        momthings: '1510',
        dress: '1529'
    };


    // 事件绑定
    const bindEvent = () => {
        // 加载更多
        const loadMore = () => {
            const $win = $(window);
            const $doc = $(document);
            $win.on('scroll', () => {
                if (!channelList.status.isEnd && !channelList.status.isLoading && $win.scrollTop() + $win.height() > $doc.height() - 400) {
                    channelList.status.page += 1;
                    channelList.getGroupList({
                        $container,
                        cat: g_cat,
                        pid: g_pid,
                        pageName: 'channel'
                    });
                }
            });
        };

        loadMore();

        // 回到顶部
        backtop();

        // 类目广告位打点
        $(document).on('click', '.J_adIcons-icon', (event) => {
            const el = $(event.currentTarget);
            ptLog.stat({
                json: {
                    tab: g_cat,
                    tab_name: el.find('p').html(),
                    position: el.index(),
                    rid: el.attr('data-rid'),
                    block_name: '类目广告位Icon'
                }
            });
        });
        // 首屏icon打点
        $(document).on('click', '.J_first-screen-icon', (event) => {
            const el = $(event.currentTarget);
            ptLog.stat({
                json: {
                    tab: 'all',
                    tab_name: el.find('p').html(),
                    position: el.index(),
                    block_name: '首屏Icon'
                }
            });
        });

        $(document).on('click', '.J_insert-ad', (event) => {
            const el = $(event.currentTarget);
            const data = $(el).data();
            $.extend(data, {
                et: 'click',
                tab: g_cat,
                block_name: '拼团首页_穿插活动的商品'
            });
            ptLog.stat({
                json: data
            });
        });
    };

    const switchView = (cat) => {
        [$('#J_top-insert-ad'), $('#J_everyday-hotgroup'), $('#J_location-bar')].forEach((el) => {
            el.toggleClass('hidden', cat);
        });
    };

    const setCurrent = (tag, cat) => {
        g_tag = tag;
        g_cat = cat;
    };

    const insertAds = (ads) => {
        const groupItems = $('.J_group-item');
        const len = ads && ads.length;
        if (len) {
            for (let i = 0; i < ads.length; i++) {
                const ad = ads[i];
                let index = ad.position;
                // 如果position是偶数，加1
                if (index % 2 === 0) {
                    index += 1;
                }
                if (ad.ad_kids && ad.ad_kids.length >= 3) { // 三个以上才展示
                    const adsData = adRowTpl.formatData(ad);
                    if (groupItems.eq(index).length) {
                        adRowTpl.init(adsData, groupItems.eq(index)); // 存在此元素
                    }
                }
            }
        }
    };

    const processTopAdsData = (ad_kids, img) => {
        const item = ad_kids[0];
        item.origin_price = item.price_ori;
        item.rect_img = img;
        return channelList.formatListData([item]);
    };

    const insertTopAds = (ad) => {
        channelList.renderData({
            $container: $('#J_top-insert-ad'),
            data: { resp: ad }
        });
        lazy.revalidate();
    };

    // 定位用户省份
    const locateProvince = () => {
        $(document).on('click', '.J_location-switch', (event) => {
            // 带参数传递
            const url = encodeURIComponent(window.location.origin + '/gaea_pt/mpt/group/channel.html');
            window.location.href = '/mpt/group/province-selector.html' +
                '?redirecturl=' + url + '&pid=' + g_pid;
        });
        const _loc = locationBar.getUserLocation();

        const changeProvince = (cur) => {
            $('.J_loc-province').text(cur.province);
            locationBar.storeUserLocation(cur);

            channelList.reset($container);
            g_pid = cur.pid;
            channelList.getGroupList({
                $container,
                cat: g_cat,
                pid: g_pid,
                pageName: 'channel',
                callback: () => {
                    $(document).trigger('channel:complete');
                }
            });
        };

        const locationBarCb = (curProvince) => {
            if (curProvince.pid) {
                switchProvince(curProvince);
            }
        };

        const switchProvince = (cur) => {
            popup.confirm('是否将地址切换为</br>【' + cur.province + '】', () => {
                changeProvince(cur);
            }, function () {
                // 点击取消
            });
        };

        // 说明从省份选择那跳回来,不需要定位
        if (uri.params.pid) {
            changeProvince({
                pid: uri.params.pid,
                province: uri.params.province
            });
        } else if (_loc) { // 有历史记录时
            changeProvince(_loc);
        } else {
            // 需重新定位
            // 拼团list 判断地区todo

            channelList.getGroupList({
                $container,
                cat: g_cat,
                pid: g_pid,
                pageName: 'channel',
                callback: () => {
                    $(document).trigger('channel:complete');
                }
            });

            // 还需要考虑定位失败时 TODO
            // locationBar.init(locationBarCb);
        }
    };

    // 顶部filterbar点击
    const onfilterBarClick = ($item) => {
        const tag = $item.attr('data-tab');
        let cat = $item.attr('data-cat');
        if (cat === 'all') {
            cat = '';
        }


        channelList.reset($container); // 重置全局变量
        switchView(cat); // 判断是否需要隐藏 每日热团&置顶商品
        setCurrent(tag, cat);

        channelList.getGroupList({
            $container,
            cat: g_cat,
            pid: g_pid,
            pageName: 'channel',
            callback: () => {
                if (!cat && index_insert_ads) {
                    insertAds(index_insert_ads);
                } else if (cat && cate_insert_ads && cate_insert_ads[cat]) {
                    insertAds(cate_insert_ads[cat]);
                }
            }
        });

        // 请求类目页广告icon
        ((version) => {
            $ads.toggleClass('hidden', !cat || cat === 'tomorrow');
            $catTitle.toggleClass('hidden', !cat || cat === 'tomorrow');

            if (!rid[cat]) {
                $ads.addClass('hidden');
                return;
            }
            adsHelper(rid[cat], (resp) => {
                const versionToNum = string => (string ? parseInt(string.replace(/[^0-9]/g, ''), 10) : 0);
                resp = resp.filter((i) => {
                    const min = versionToNum(i.includeVersion.min);
                    const max = versionToNum(i.includeVersion.max);
                    const versionNum = versionToNum(version);
                    return i.version === version ||
                        (min <= versionNum && (!max || max >= versionNum));
                });

                if (resp.length < 4) {
                    $ads.addClass('hidden');
                    return;
                }

                resp.forEach((i) => {
                    i.name = i.name.replace(/[^\u4E00-\u9FA5]/g, '');
                    i.img = imageConvert.format160(`${i.img}!160x160.jpg`);
                });
                const tpl = $T_ads.html();
                const html = template(tpl, { list: resp });
                $ads.html(html);
                lazyload.getLazyImg();
            });
        })('4.5.0');

        // 打点
        ptLog.stat({
            et: 'click',
            json: {
                tab: $item.html(),
                tab_name: $item.attr('data-cat'),
                block_name: '顶部Tab导航'
            }
        });

        // 非首屏 隐藏轮播及入口
        $('#J_slider-icons').toggleClass('hidden', cat);
        $(window).scrollTop(0);
    };

    const filterBarinitedCb = () => {
        // 外链直接跳转到特定类目
        const cat = uri.params.cat;
        if (cat) {
            setTimeout(() => {
                $('.nav-menu-item[data-cat=' + cat + ']').trigger('click');
            }, 1000);
        }
    };

    const init = () => {
        const splitAdsByRid = (ads, rid) => {
            let result = [];

            if (ads.length) {
                ads.forEach((ad) => {
                    if (parseInt(ad.rid) === parseInt(rid)) {
                        result = result.concat(ad);
                    }
                });
            }

            return result.sort((left, right) => {
                return parseInt(left.priority) - parseInt(left.priority);
            });
        };

        // 轮播无广告
        const renderSliderWhenNoAds = () => {
            $silder.addClass('hidden');
        };

        // 渲染轮播广告
        const renderSliderAds = (ads) => {
            if (!ads.length) {
                renderSliderWhenNoAds();
                return;
            }

            $silder.html(new Xtemplate(sliderListTpl).render({ list: ads }));
            const sliderPic = new slider({
                container: '#J_slider-list',
                wrap: '#J_slider-outer',
                panel: '#J_slider-wrap',
                trigger: '#J_slider-status',
                play: true,
                loop: true
            });
        };

        // 渲染icon入口 如果没有有默认的
        const renderEntryIcons = (ads) => {
            let html = '';
            if (!ads.length) {
                return;
            }

            ads.forEach((ad) => {
                html += `<a href="${ad.linkUrl}" class="J_first-screen-icon">
                    <i class="icon-shot" style="background-image:url(${ad.img})"></i>
                    <p>${ad.text}</p>
                </a>`;
            });

            $('.J_entryIcons').html(html);
        };

        // 初始化微信分享
        if (isWeixin) {
            wx.config(() => {
                wx.shareConfig({
                    title: '贝贝拼团',
                    desc: '优选好货，低价限量，妈妈们都抢疯了！',
                    link: window.location.origin + '/gaea_pt/mpt/group/channel.html',
                    imgUrl: 'https://h0.hucdn.com/open/201620/1463732877_65fb6a0901caab59_100x100.png'
                });
            });
        }

        adsHelper('1534_1759', (resp) => {
            resp.forEach((i) => {
                i.img = imageConvert.format750(i.img);
            });

            // 首屏轮播
            renderSliderAds(splitAdsByRid(resp, 1534));
            // icon入口
            // renderEntryIcons(splitAdsByRid(resp, 1759));

        }, renderSliderWhenNoAds);


        // 广告位
        // 212 首页穿插广告
        // 186 每日九点上新
        // 343 分类穿插广告
        // 344 首页置顶广告
        api.getAds('0--212_186_343_344-4.2.0-').then((res) => {
            const groupItems = $('.J_group-item');
            // 每日热团
            if (res.fight_group_items_ads[0]) {
                let egd = res.fight_group_items_ads[0];
                egd = everydayHotGroup.formatData(egd);
                // 获取并渲染每日热团
                everydayHotGroup.init(egd);
            } else {
                $('#J_everyday-hotgroup').remove();
            }
            // 212 广告位
            if (res.fight_group_index_insert_ads) {
                index_insert_ads = res.fight_group_index_insert_ads;
                if (groupItems.length) { // 列表已经渲染好
                    insertAds(index_insert_ads);
                } else {
                    $(document).on('channel:complete', () => {
                        insertAds(index_insert_ads);
                    });
                }
            }
            // 344 置顶广告位
            const topAds = res.fight_group_today_group_top_ads;
            if (topAds.length) {
                // 因后端限制，图片取外层的，数据取里层的
                insertTopAds(processTopAdsData(topAds[0].ad_kids, topAds[0].img));
            }

            // 343 分类穿插广告位 先存起来
            if (res.fight_group_cate_insert_ads) {
                cate_insert_ads = res.fight_group_cate_insert_ads;
            }
        });

        // 首页热点广告位
        api.getAds('32912--373-4.8.0-19').then((res) => {
            if (res.pintuan_hotspot_ads && res.pintuan_hotspot_ads.length) {
                const data = res.pintuan_hotspot_ads[0];
                const $dom = $('#J_hotspot-ads');
                data.width = `${data.width / 46.875}rem`;
                data.height = `${data.height / 46.875}rem`;
                $dom.append($(
                    `<a style="display: block;
                            height: ${data.height};
                            width: ${data.width};
                            background-image: url(${data.img});
                            background-size:100% auto"
                        href='${data.target}'>
                    </a>`
                ));
                data.hotspots.forEach((i) => {
                    i.rectWidth = `${(i.rect[2] - i.rect[0]) / 46.875}rem`;
                    i.rectHeight = `${(i.rect[3] - i.rect[1]) / 46.875}rem`;
                    i.rect = i.rect.map(j => `${j / 46.875}rem`);
                    $dom.append($(
                        `<a style="display: block;
                                position: absolute;
                                left: ${i.rect[0]};
                                top: ${i.rect[1]};
                                height: ${i.rectHeight};
                                width: ${i.rectWidth};"
                            href='${i.target}'>
                        </a>`
                    ));
                });
            }
        });

        // 顶部筛选渲染&初始化
        api.getCategory().then((resp) => {
            const data = resp.fightgroup.cats;
            const html = new Xtemplate(navMenuTpl).render({
                tab: data[0].key,
                list: data[0].children
            });
            $nav.html(html);
            new navmenu('#J_nav-menu', {
                isSticky: true,
                onItemSelect: onfilterBarClick
            });
            filterBarinitedCb();
        });

        // 绑定事件
        bindEvent();

        // 定位用户省份
        locateProvince();

        // 打点初始化
        ptLog.init({
            page: '拼团首页'
        });
        // 移除loading
        muiLoading.remove();

        recToast.init({
            className: 'toast-channel'
        });
    };

    init();
})();
