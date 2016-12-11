import _ from 'lodash';
import '@beibei/tingyun';
import Xtemplate from 'xtemplate/lib/runtime';
import './index.less';

import heatmap from '@beibei/statistics/statistics-heatmap'; // 页面性能统计
// import performance from '@beibei/statistics/statistics-performance';

// 临时页面流程性能打点
// TODO 一周后下线
import multiPagePerformance from 'src/js/mp/pintuan/unit/log/statistics-performance';

import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import Lazy from '@beibei/blazy';
import popup from '@beibei/popup';
import cookie from '@beibei/cookie';
import backtop from '@beibei/backtop';
import adsHelper from '@beibei/ads_helper';

import common from 'unit/common/js/common/common';
import tabTools from 'src/js/mp/pintuan/unit/tabTools.js';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js'; // loading
import priceHandle from '../common/util/priceHandle.js';
import skuModal from '../common/component/skuModal/skuModal.js';
import mores from '../common/component/mores/mores.js';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';
import isp from '../../../../../unit/common/js/isp/isp';

import wxFollow from 'app/biz/mpt/common/auth/follow.js';
import login from 'app/biz/mpt/common/auth/login.js';
import api from './api.js';
import {
    getGroupState,
    isNormal
    } from '../common/util/tools.js';

import ptLog from '../common/util/ptLog.js';
import { gapTime, downTimer } from '../common/util/utils.js';
import { sessionStatus } from '../../common/auth/tool.js';
import shareConfig from 'app/biz/mpt/common/share/share.js';

import recToast from '../common/component/recToast/recToast.js'; // 推荐toast

// 模版
import renderSlider from './banner/banner.js';
import renderDiscount from './discount/discount.js';
import renderPromotion from './promotion/promotion.js';
import renderInfos from './infos/infos.js';
import renderRules from './rules/rules.js';
import renderReviews from './reviews/reviews.js';
import renderDatail from './details/details.js';
import renderIcons from './icons/icons.js';
import renderLives from './lives/lives.js';
import renderRecommend from './recommend/recommend.js';
import renderRecommendSlide from './recommendSlide/recommendSlide.js';

import ptlist from './ptList.xtpl';
import footerButtonsTpl from './footerBtns.xtpl';

isp();
heatmap();

const lazy = new Lazy({
    error(ele) {
        $(ele).removeClass('b-lazy');
    }
});

// performance();

// 临时流程性能打点
const multiPageLog = multiPagePerformance();
const group_code = httpurl.uri.params.group_code || 1;
const isWeixin = env.app.isWeixin;
const $window = $(window);
const uid = cookie('_logged_') || 0;

const Status = {
    token: ''
};

(function app() {
    const iid = httpurl.uri.params.iid;
    const wxAuth = (callback) => {
        login.authInit(`${window.location.origin}${window.location.pathname}?iid=${iid}`, (result) => {
            if (result.isLogin) {
                wxFollow.init();
                // 临时性能打点
                // 一周后下线
                multiPageLog();
            } else if (result.token) {
                Status.token = result.token;
            }

            callback();
        });
    };

    const renderAds = () => {
        adsHelper([1462], (ads) => {
            let html = '';
            if (ads && ads.length) {
                ads[0].img = imageConvert.format750(ads[0].img);
                html = `<img src="${ads[0].img}">`;
                const link = ads[0].linkUrl;
                if (link && link.indexOf('http') !== -1) {
                    html = `<a href="${link}" class="hmp-ad-entry">${html}</a>`;
                } else {
                    html = `<div class="hmp-ad-entry">${html}</div>`;
                }
                const $el = $(html);
                $el.on('click', () => {
                    ptLog.stat({
                        et: 'click',
                        rid: 85993,
                        entity_type: 'ads',
                        json: {
                            block_name: 'home_advertisement'
                        }
                    });
                });
                $('#J_details').prepend($el);
            }
        });
    };

    // 大家都在团打点
    const moresLog = ({ recom_id, items }) => {
        // list_show事件打点
        // {leading: false,trailing: false}
        // 在给定的时间内最多执行一次，并且尽快执行

        const $container = $('#J_container-mores');
        const winHeight = $window.height();
        const btnsHeight = $('#J_btns').height();

        $window.on('scroll.listShow', _.throttle(() => {
            if ($window.scrollTop() + winHeight
                > btnsHeight + $container.offset().top) {
                ptLog.stat({
                    et: 'list_show',
                    rid: 85991,
                    json: {
                        block_name: '拼团详情页_大家都在团',
                        f_item_id: iid,
                        recom_id,
                        ids: _.map(items, item => (item.iid)).join(',')
                    }
                });
                $window.off('scroll.listShow');
            }
        }, 80));
    };

    // 大数据－大家都在团
    const renderMores = (data) => {
        mores.bigDataInit({
            iid: data.iid,
            uid,
            event_id: data.event_id,
            options: {
                rid: 85991
            }
        }).then((res) => {
            moresLog({
                iid: data.iid,
                recom_id: res.recom_id,
                items: res.fightgroup_items
            });
        }).catch((e) => {
            console.warn(e);
        });
    };

    // 获取推荐商品接口
    const getRecommend = eventId => new Promise((resolve, reject) => {
        const baseUrl = '//api.beibei.com/gateway/route.html?';
        const search = `method=beibei.recom.list.get&scene_id=app_item_detail_sold_out_recom&iid=${iid}&event_id=${eventId}&uid=${uid}`;
        common.callAPI({
            url: baseUrl + search,
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
            }
        });
    });

    // 贝妈推荐
    const getRecommendSlide = eventId => new Promise((resolve, reject) => {
        const baseUrl = '//api.beibei.com/gateway/route.html?';
        const search = `method=beibei.recom.list.get&scene_id=app_item_detail_bei_ma_recom&iid=${iid}&event_id=${eventId}&uid=${uid}`;
        common.callAPI({
            url: baseUrl + search,
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
            }
        });
    });


    // 渲染邀请列表
    const renderGroup = (data) => {
        if (data && data.length) {
            data.forEach((item) => {
                Object.assign(item, {
                    ipg: imageConvert.format160(item.avatar),
                    nick: item.nick || '系统昵称',
                    limitTime: gapTime(parseInt(new Date() / 1000, 10), item.gmt_end),
                    needNum: (item.require_num * 1) - (item.group_users_count * 1)
                });
            });
            $('#J_ptList').html(new Xtemplate(ptlist).render({ data }));

            // 执行倒计时
            data.forEach((item, i) => {
                downTimer({
                    obj: item.limitTime,
                    $DOM: $('.J_group_countdown').eq(i),
                    role: 'pintuan-home'
                });
            });
        }
        lazy.revalidate();
    };

    const initTabTools = () => {
        tabTools.init('.J_tabContainer', ['商品详情', '问题咨询'], (() => {
            const $tabItemCont = $('.J_tabItemCont');
            let isFirstTabSwitch = true;
            let hasRemoved = false;

            return (index) => {
                $tabItemCont.attr('data-active', index);
                if (index === 1) {
                    $('#J_rules').removeClass('hidden');
                }
                $('.J_tab_item').eq(index)
                    .css('height', 'auto')
                    .siblings()
                    .css('height', '1px');
                if (isFirstTabSwitch) {
                    isFirstTabSwitch = false;
                } else if (!hasRemoved) {
                    $tabItemCont.removeClass('z-first-state');
                    hasRemoved = true;
                }
            };
        })());
    };

    // 渲染按钮组
    const renderBtns = ({ data, sku }) => {
        /**
         * [calGroupOpenHour 计算几点开抢]
         * @param  {[type]} groupTime [description]
         * @return {[int]}           [几点]
         */
        const calGroupOpenHour = (groupTime) =>
            new Date(groupTime * 1000).getHours();
        /**
         * [calGroupOpenDay description]
         * @param  {[type]} groupTime [description]
         * @return {[int]}           [距当前时间的天数]
         */
        const calGroupOpenDay = (groupTime) => {
            const now = new Date();
            const time = gapTime(now.getTime() / 1000, groupTime);
            if (calGroupOpenHour(groupTime) <= now.getHours()) {
                time.day += 1;
            }
            return time.day;
        };
        const getDayText = (day) => {
            const textMap = ['今日', '明日'];
            return textMap[day] || `${day}天后`;
        };
        /**
         * [times description]
         * @param  {[type]} beginTime [服务端返回的开抢时间 单位 s]
         * @return {[type]}      [description]
         */
        const getTimesTips = beginTime =>
            `${getDayText(calGroupOpenDay(beginTime))}${calGroupOpenHour(beginTime)}点开抢，等你来哦`;

        const getPromotion = () => new Promise((resolve, reject) => {
            $.ajax({
                url: '//api.beibei.com/mroute.html?method=beibei.item.promotion.get',
                type: 'get',
                dataType: 'json',
                cache: true,
                data: {
                    iid
                },
                xhrFields: {
                    withCredentials: true
                },
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        });

        const commonOprateSkuProcess = () => {
            // 注册成功后刷新页面
            if (checkBindMobile()) {
                if (shouldOpenSkuMask()) {
                    sku.show();
                } else {
                    if (sku.sku.getSku()) {
                        sku.submit();
                    } else {
                        sku.show();
                    }
                }
            }
        };

        const showBindDialog = () => {
            const dialog = login.getDialog();

            dialog.show();
            // 手机弹窗绑定
            dialog.setCallback(() => {
                if (sku.getBuyType() === 'single') {
                    $('#J_buy-single').trigger('click');
                } else {
                    commonOprateSkuProcess();
                }
            });
        };

        // 参团前检测用户是否已绑定过手机号码
        const checkBindMobile = () => {
            // 前提：有微信授权后的token，且未登录
            if (Status.token && !cookie('st_au')) {
                showBindDialog();
                return false;
            }
            return true;
        };

        // 是否打开sku选择窗
        const shouldOpenSkuMask = () => {
            if (sku.sku.isSingleSku &&
                ((sku.getBuyType() === 'single' && data.limit_num <= 1) ||
                (sku.getBuyType() === 'group' &&
                data.item_fight_group.limit_num <= 1))) {
                return false;
            }
            return true;
        };

        const bindEvents = () => {
            $('#J_buy-single-disabled').on('click', () => {
                popup.note('此类商品暂不支持单独购买！', {
                    closeTime: 1500,
                    position: 'center',
                    mask: false
                });
            });

            $('#J_buy-single').on('click', (e) => {
                e.preventDefault();
                sku.setBuyType('single');
                if (checkBindMobile()) {
                    if (isWeixin && !!data.is_foreign_pay) {
                        popup.note('境外商品暂不支持购买，请前往客户端购买', {
                            closeTime: 1500,
                            position: 'center'
                        });
                        return;
                    }
                    if (shouldOpenSkuMask()) {
                        sku.show();
                    } else if (sku.sku.getSku()) {
                        sku.submit();
                    } else {
                        sku.show();
                    }
                }
            });

            // 开团购买
            $('#J_buy-tuan').on('click', (e) => {
                e.preventDefault();
                sku.setBuyType('group');
                sku.beforeShow();
                commonOprateSkuProcess();
            });
        };

        const price = priceHandle(data.price);

        const renderCallback = (res) => {
            $('#J_btns').html(new Xtemplate(footerButtonsTpl)
                .render({ data: res, group_code }));
            bindEvents();
        };

        Object.assign(data, {
            priceSigleInt: price.priceInt,
            priceSigleDec: price.priceDec,
            tuanDesc: `${data.requireNum}人成团`
        });

        if (data.isWait) {
            Object.assign(data, {
                timeTips: getTimesTips(data.gmt_begin)
            });
            $(document).on('touchend', '#J_btn-tomorrow', (event) => {
                event.preventDefault();
                popup.note(`${calGroupOpenHour(data.gmt_begin)}点准时开抢`, {
                    mask: false
                });
            });
        }

        if (data.showState !== 1 || !sessionStatus.isLogin()) {
            renderCallback(data);
            // 查看是否有免单券
        } else {
            getPromotion().then((res) => {
                Object.assign(data, {
                    hasFreeCoupon: res && res.has_free_coupon,
                    tuanDesc: `${data.requireNum}人拼团`
                });
                renderCallback(data);
            }).catch((e) => {
                console.warn(e);
                renderCallback(data);
            });
        }
    };

    const skuModalHandle = data => new Promise((resolve) => {
        const $skuBar = $('#J_skus');

        const renderSkuBar = () => {
            $skuBar.find('.J_skuText').html(skuModal.sku.getInfo());
        };
        skuModal.init({
            container: '#J_sku-masks',
            data,
            onHide: renderSkuBar,
            onInit: renderSkuBar
        });

        // 打开商品选择sku
        $skuBar.on('click', () => {
            skuModal.show();
        });

        resolve({ data, sku: skuModal });
    });


    const request = () => {
        const p1 = api.getItemDetail(iid);
        const p2 = api.getNewestStock(iid);
        const p3 = api.getPromotion({ iid, uid });

        return Promise.all([p1, p2, p3]).then((resArray) => {
            const [res1, res2, res3] = resArray;
            if (res1.success === false) {
                muiLoading.remove();
                popup.alert(res1.message, {}, () => {
                    window.location.replace('/gaea_pt/mpt/group/channel.html');
                });
                return;
            }

            // 拼团商品失效状态
            if (!res1.item_fight_group) {
                const redirect = `/detail/detail.html?iid=${res1.iid}&beibeiapp_info={"target":"detail","iid":${res1.iid}}`;
                // 客户端跳native界面特殊处理
                if (env.app.isBeibei) {
                    window.location.href = redirect;
                    window.setTimeout(() => {
                        window.history.go(-1);
                    }, 500);
                } else {
                    window.location.replace(redirect);
                }
                return;
            }
            const now = new Date() / 1000;
            Object.assign(res1, {
                isWait: res1.gmt_begin > now,
                isOver: res1.gmt_end < now
            });
            if (res1.item_fight_group) {
                Object.assign(res1, {
                    joinedNum: res1.item_fight_group.join_num,
                    needNum: res1.item_fight_group.require_num - 1,
                    requireNum: res1.item_fight_group.require_num
                });

                // 折扣前的拼团价
                const oriGroupPrice = priceHandle(res1.item_fight_group.group_price);
                Object.assign(res1, {
                    oriPriceInt: oriGroupPrice.priceInt,
                    oriPriceDec: oriGroupPrice.priceDec
                });
            }

            // 分享设置(微信、app)
            shareConfig({
                data: res1.share_info,
                successCb: () => {
                    if (env.app.isWeixin) {
                        $('#J_share-mask').addClass('hidden');
                        // 统计加一
                        ptLog.stat({
                            json: {
                                share: 1
                            }
                        });
                    }
                },
                cancelCb: () => {
                    if (env.app.isWeixin) {
                        $('#J_share-mask').addClass('hidden');
                    }
                },
                configCb: (wxTool) => {
                    wxTool.hideMenuItems(['menuItem:share:timeline', 'menuItem:share:email', 'menuItem:favorite']);
                }
            });

            // 渲染商品轮播
            renderSlider(res1.imgs);
            if (res3.promotions && res3.promotions.length) {
                // 只取第一个促销活动
                const promotion = res3.promotions[0];
                // 活动是否生效
                const isEventValid = (res1.gmt_begin < now && res1.gmt_end > now)
                    && (promotion.promotion_type === 4 && promotion.cal_num * 1 > 0)
                    || (promotion.promotion_type === 3 && now < promotion.promotion_end);
                if (isEventValid) {
                    // 注意！！限时限量立减生效时覆盖了group_price字段
                    res1.item_fight_group.group_price = res1.item_fight_group.group_price - (promotion.sale_off * 1);
                }
                renderPromotion(res3, res1);
            }

            // 处理按钮展示价格的整数与分数
            const price = priceHandle(res1.item_fight_group.group_price);
            Object.assign(res1, {
                priceInt: price.priceInt,
                priceDec: price.priceDec
            });
            renderDatail([res1.product_props, res1.detail]);
            renderInfos(res1);

            if (isNormal(res1.item_fight_group)) {
                renderDiscount(res1);
            }
            muiLoading.remove();
            renderIcons(res1);
            renderLives(res1);
            renderRules(res1);

            initTabTools();

            // 获取最新的库存并赋值
            Object.assign(res1.sku, {
                sku_stock_map: res2.sku_stock_map
            });

            // 根据最新的库存计算最新的总库存
            Object.assign(res1, {
                stock: _.reduce(res1.sku.sku_stock_map,
                    (result, item) => (result + item.stock), 0)
            });

            // 底部按钮状态计算
            Object.assign(res1, {
                showState: getGroupState(res1)
            });
            skuModalHandle(res1).then(renderBtns).catch((e) => {
                console.warn(e);
            });
            // 贝妈推荐
            getRecommendSlide(res1.event_id)
                .then(res => renderRecommendSlide(res, iid, () => {
                    renderMores(res1);
                })).catch((e) => {
                    console.warn(e);
                });
            renderAds();
            $(document).on('ready', () => {
                recToast.init({
                    className: 'toast-detail'
                });
            });
            // 大家都在团

            // 商品已抢光、已结束，增加商品推荐
            if (res1.showState === 3 || res1.showState === 4) {
                getRecommend(res1.event_id).then(renderRecommend);
            }
        }).catch((e) => {
            console.warn(e);
        });
    };

    const bindEvents = () => {
        // 问题咨询
        $(document).on('tap', '#J_contactLink', (e) => {
            e.preventDefault();
            window.location.href =
                `/help/myService.html?type=pintuan&iid=${iid}`;
        });

        // 跳转到图文详情
        $(document).on('tap', '#J_goto-detail', () => {
            window.scrollTo(0, $('#J_details').offset().top);
        });

        // 回到顶部
        backtop();
    };

    const init = () => {
        const pageInit = () => {
            request();
            // 详情位置广告位加载

            api.getReviews(iid).then(res => renderReviews(res, iid)).catch((e) => {
                console.warn(e);
            });
            // 游客拼团功能
            api.getRecGroups(iid).then(renderGroup).catch((e) => {
                console.warn(e);
            });
            // 最新团购toast

            bindEvents();

            ptLog.init({
                entity_list: iid,
                page: '拼团详情页'
            });
        };

        // 微信环境下 先进行微信授权
        if (isWeixin) {
            wxAuth(pageInit);
        } else {
            pageInit();
        }
    };

    init();

    setTimeout(() => {
        wxFollow.init();
    }, 3000);
}());
