import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import '@beibei/tingyun';

import priceHandle from '../common/util/priceHandle.js';
import skuModal from '../common/component/skuModal/skuModal.js';
import mores from '../common/component/mores/mores.js';
import isp from '../../../../../unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';// 页面性能统计
import Lazy from '@beibei/blazy';

// 临时页面流程性能打点
// TODO 一周后下线
import popup from '@beibei/popup';
import multiPagePerformance from '../../../../../src/js/mp/pintuan/unit/log/statistics-performance';
import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import common from '../../../../../unit/common/js/common/common';
import adsHelper from '@beibei/ads_helper';
import ptLog from '../common/util/ptLog.js';
import ptAppBar from '../common/util/appbar.js';
import cookie from '@beibei/cookie';
import muiLoading from '../../../../../unit/common/widget/pintuan/muiLoading/muiLoading.js';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import { processStatusData, addUrlUtmSource } from '../common/util/tools.js';
import { gapTime, timeFormat, downTimer, formatDateNumber } from '../common/util/utils.js';

import wxFollow from 'app/biz/mpt/common/auth/follow.js';
import login from 'app/biz/mpt/common/auth/login.js';
import shareConfig from 'app/biz/mpt/common/share/share.js';
import shareSuccess from './share_success/share_success.js';

import detailTpl from './detail.xtpl';
import groupTpl from './group.xtpl';
import stepsTpl from './steps.xtpl';
import maskTpl from './mask.xtpl';
import dropdownTpl from './dropdown.xtpl';

import './index.less';

isp();
heatmap();
// performance();

const multiPageLog = multiPagePerformance();
const uid = cookie('_logged_') || 0;

const api = {
// 获取拼团详情数据
    getPintuanDetail: ({ group_code }) =>
        (new Promise((resolve, reject) => {
            common.callAPI({
                method: 'beibei.fightgroup.item.detail.get',
                noDialog: true,
                data: {
                    token: group_code
                },
                success(res) {
                    if (res.success) {
                        // 返回正确的数据
                        resolve(res);
                    } else {
                        // 返回异常的数据
                        popup.alert(res.message || res.err_msg);
                        muiLoading.remove();
                    }
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    // 详情页 获取最新库存
    getNewestStock: ({ iid, callback, type }) =>
        (new Promise((resolve, reject) => {
            common.callAPI({
                url: `//sapi.beibei.com/item/stock/${iid}.html${type === 'home' ? `?iids=${iid}` : ''}`,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiItemStockGet',
                cache: true,
                noDialog: true,
                success(res) {
                    resolve(res);
                    if (typeof callback === 'function') {
                        callback(res);
                    }
                },
                error(res) {
                    reject(res);
                }
            });
        }))
};

const isWeixin = env.app.isWeixin;
const group_code = httpurl.uri.params.group_code; // 拼团码
// 是否展示分享popup
const needShare = parseInt(httpurl.uri.params.needshare, 10) === 1
    || window.localStorage.getItem('needshare');

const $window = $(window);
const lazy = new Lazy({
    error(ele) {
        $(ele).removeClass('b-lazy');
    }
});
const Status = {
    token: ''
};
const defaultAvatar = '//b3.hucdn.com/upload/face/1607/18/18407810631476_1600x1600.jpg';

// 用户头像 & 拼团详情 数据处理
const processMembers = (data) => {
    const temp = {};
    const processMemberInfo = (item, index) => {
        // 红包头像
        if (data.redpack_info && data.redpack_info.words && data.redpack_info.words.length) {
            Object.assign(item, {
                redPackHead: data.redpack_info.words[index]
            });
        }
        Object.assign(item, {
            jpg: imageConvert.format200(item.avatar),
            join_time_format: timeFormat({
                time: item.join_time
            }),
            is_new_member: item.is_new_member && data.is3Q1 // 三缺一的商品才展示新人图标
        });
        return item;
    };

    // 增加group_head_map数组用于渲染
    Object.assign(temp, {
        group_head_map: [...data.group_users.map(processMemberInfo),
            ...Array.from({ length: data.require_num - data.group_users.length }, () => ({
                is_null: true
            }))]
    });
    // 每行显示的头像数
    const COUNT = 8;

    // 不需要省略的情况
    const noEllipsis = (data.require_num <= COUNT * 2) || (data.require_num < COUNT * 10 &&
        (((Math.ceil(data.require_num / COUNT) * COUNT) - data.group_users_count) < COUNT));
    if (noEllipsis) {
        return Object.assign(data, temp);
    }

    // 省略展示
    const tipsIndex = data.group_users_count >= 100 ? 80
        : (Math.ceil(data.group_users_count / COUNT) * COUNT) + (COUNT - 1);
    for (let i = tipsIndex - 1; i < temp.group_head_map.length; i++) {
        temp.group_head_map[i].className = 'J_noshow hidden';
    }

    // 插入省略的开关标志位
    const leftNum = data.require_num - data.group_users_count;

    if (leftNum) {
        temp.group_head_map.splice(tipsIndex, 0, { is_left: true });
        temp.left_num = leftNum;
    } else {
        temp.group_head_map.splice(tipsIndex, 0, { is_complete: true });
        temp.more_num = (data.group_users_count - tipsIndex) + 1;
    }
    return Object.assign(data, temp);
};


// 广告位加载
const renderAds = () => {
    const $el = $('#J_container-ads');
    window.setTimeout(() => {
        adsHelper([1520], (ads) => {
            let html = '';
            if (ads && ads.length) {
                ads[0].img = imageConvert.format750(ads[0].img);
                const img = `<img src="${ads[0].img}">`;
                if (ads[0].linkUrl) {
                    html = `<a href="${ads[0].linkUrl}" class="hmp-ad-entry">${img}</a>`;
                } else {
                    html = `<div class="hmp-ad-entry">${img}</div>`;
                }
                $el.html(html);
                $el.on('click', () => {
                    ptLog.stat({
                        et: 'click',
                        rid: 85994,
                        entity_type: 'ads',
                        json: {
                            block_name: 'home_advertisement'
                        }
                    });
                });
            } else {
                $el.addClass('hidden');
            }
        }, () => {
            $el.addClass('hidden');
        });
    }, 0);
};

// 顶部商品和拼团信息
const renderTop = (res) => {
    const data = Object.assign({}, res);
    const price = priceHandle(data.group_price);
    const formatRules = (rules) => {
        let result = [];
        if (typeof rules === 'string' && rules.indexOf('\n') !== -1) {
            result = rules.split('\n');
        } else {
            result.push(rules);
        }
        return result;
    };
    Object.assign(data, {
        rule_intr: formatRules(data.rule_introduce),
        jpg: imageConvert.format200(data.product_img),
        originPrice: !(data.is_lottery_item || data.activity_type === 3)
            ? (data.price / 100) : '',
        priceInt: price.priceInt,
        priceDec: price.priceDec
    });
    $('#J_container-details').html(new Xtemplate(detailTpl).render({ data, group_code }));

    $('#l-rule-show').on('click', (event) => {
        event.preventDefault();
        $('.J_rule-win').removeClass('hidden');
    });

    $('.J_rule-action').on('click', (event) => {
        event.preventDefault();
        $('.J_rule-win').addClass('hidden');
    });
};

// 拼团玩法
const renderSteps = (data) => {
    $('#J_container-steps').html(new Xtemplate(stepsTpl).render({ data }));
};

// 拼团详情
const renderGroup = (data) => {
    let isloadMore = true; // 拼团列表是否还有更多数据
    let pageMember = 2; // 拼团人员列表分页

    // 获取剩余未显示的用户数据
    const getAllMembers = (callback) => {
        if (isloadMore) {
            common.callAPI({
                method: 'beibei.fightgroup.member.get',
                data: {
                    page: pageMember, // 拼团人员列表分页
                    token: group_code
                },
                success(res) {
                    if (typeof callback === 'function') {
                        pageMember++;
                        callback(res);
                        isloadMore = true;
                    }
                },
                error() {
                    isloadMore = true;
                }
            });
            isloadMore = false;
        }
    };

    $('#J_container-details').append(new Xtemplate(groupTpl)
        .render({ res: data }))
        // 点击加载拼团列表的更多数据
        .on('tap', '#J_load-more', () => {
            getAllMembers((res) => {
                if (res.group_users && res.group_users.length) {
                    _.forEach(res.group_users, (item) => {
                        Object.assign(item, {
                            jpg: imageConvert.format(item.avatar),
                            join_time_format: timeFormat({
                                time: item.join_time
                            })
                        });
                    });

                    Object.assign(res, {
                        has_more_users: res.page * res.page_size < res.count
                    });
                    $('#J_load-more').remove();
                    $('#J_dropdown-box').append(new Xtemplate(dropdownTpl)
                        .render({ res }));
                    lazy.revalidate();
                }
            });
        });

    if (data.limitTime) {
        downTimer(
            {
                obj: data.limitTime,
                $DOM: $('#J_downTimer'),
                role: 'pintuan-home'
            });
    }

    // 拼团详情切换
    $('#J_btn-toggle').on('tap', (e) => {
        const $this = $(e.currentTarget);
        if ($this.hasClass('open')) {
            $('#J_dropdown-box').addClass('hidden');
            $('#J_load-more').addClass('hidden');
            $this.removeClass('open')
                .html('展开拼团详情<span class="dpbtn"></span>');
        } else {
            $('#J_dropdown-box').removeClass('hidden');
            $('#J_load-more').removeClass('hidden');
            $this.addClass('open')
                .html('收起拼团详情<span class="dpbtn show"></span></span><div class="triangle"></div>');
            lazy.revalidate();
        }
    });

    if (data.redpack_info) {
        data.redpack_info.rule_introduce = data.redpack_info.rule_introduce.replace(/\n/g, '<br/>');
        $('#J_repack-rule').on('tap', () => {
            popup.alert(`<div style="text-align: left;font-size: 0.6rem">${data.redpack_info.rule_introduce}</div>`)
        });
    }

    // 用户头像点击加载更多
    $('.J_user-more').on('tap', (event) => {
        event.preventDefault();
        $(event.currentTarget).parent().remove();
        $('.J_noshow').removeClass('hidden');
    });
};

// 底部按钮
const renderBtns = (data, sku) => {
    const bindEvents = () => {
        // 参团前检测用户是否已绑定过手机号码
        const showBindDialog = () => {
            const dialog = login.getDialog();
            dialog.show();

            // 手机弹窗绑定
            dialog.setCallback(() => {
                commonOprateSkuProcess();
            });
        };

        // 是否打开sku选择窗
        const shouldOpenSkuMask = () =>
            !(sku.sku.isSingleSku && data.limit_num <= 1);

        // 是否展示绑定手机框
        const checkBindMobile = () => {
            // 前提：有微信授权后的token，且未登录
            if (Status.token && !cookie('st_au')) {
                showBindDialog();
                return false;
            }
            return true;
        };

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

        // 再来一单
        $(document).on('click', '.J-one-more,.J_open-group', (event) => {
            event.preventDefault();
            // code传1新开一团
            sku.setGroupCode(1);
            commonOprateSkuProcess();
        });

        // 我要参团
        $(document).on('click', '.J_btn-join', (event) => {
            event.preventDefault();
            // code传null,在sku内部处理
            sku.setGroupCode(data.token);
            commonOprateSkuProcess();
        });

        // 喊人参团
        $(document).on('click', '.J_let-join', (event) => {
            event.preventDefault();
            $('#J_share-mask').removeClass('hidden');
        });
    };
    $('#J_container-btns').html(data.btnBuildHelper(data.btns));
    bindEvents();
};

// 分享遮罩
const renderMasks = (data) => {
    $('#J_container-masks').html(new Xtemplate(maskTpl).render({ res: data }));

    // 关闭分享遮罩
    $('#J_share-mask').on('click', (event) => {
        event.preventDefault();
        $(event.currentTarget).addClass('hidden');
    });
};


// 大家都在团打点
const moresLog = ({ iid, recom_id, items }) => {
    // list_show事件打点
    // {leading: false,trailing: false}
    // 在给定的时间内最多执行一次，并且尽快执行

    const $container = $('#J_container-mores');
    const winHeight = $window.height();
    const btnsHeight = $('#J_btns').height();

    $window.on('scroll.listShow', _.throttle(() => {
        if ($window.scrollTop() + winHeight > btnsHeight + $container.offset().top) {
            ptLog.stat({
                et: 'list_show',
                rid: 85990,
                json: {
                    block_name: '拼团承接页_大家都在团',
                    f_item_id: iid,
                    recom_id,
                    ids: _.map(items, (item) => (item.iid)).join(',')
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
            isSticky: true,
            rid: 85990,
            sellerItems:data.seller_recommend_items
        }
    }).then((res) => {
        moresLog({
            iid: data.iid,
            recom_id: res.recom_id,
            items: res.fightgroup_items
        });
    });
};

// utm_source 交易打点
const logUtmSourceTrade = (group_code) => {
    const allFee = window.sessionStorage.getItem('_all_fee_');
    // 拼团打点
    if (allFee) {
        ptLog.stat({
            et: 'pay',
            entity_type: 'order',
            rid: '85980',
            entity_list: '',
            json: {
                allFee,
                groupCode: group_code,
                uid
            }
        });
        window.sessionStorage.removeItem('_all_fee_');
    }
};

const render = (res) => {
    const data = Object.assign({}, res);
    const now = new Date() / 1000;
    // server队列任务有延时
    const isGroupEnd = (data.gmt_end < now / 1000); // 本期团购是否结束
    if (isGroupEnd && data.status === 2) {
        data.status = 3;
    }
    data.isGroupEnd = isGroupEnd;

    Object.assign(data, {
        is3Q1: data.activity_type === 1, // 是否三缺一
        isLdx: data.activity_type === 2, // 是否老带新
        has_more_users: data.group_users_count > 10,
        isLeader: data.member_first_uid === cookie('_logged_'),
        status_message: data.status_message &&
        data.status_message.replace(/(\d+)/gi, '<em>$1</em>'),
        limitTime: data.limitTime && _.mapValues(data.limitTime, formatDateNumber)
    });

    if (data.is_lottery_item) {
        // introduce = '恭喜本团的 xxxx 获得一等奖';
        const introduce = data.activity_introduce.split(' ');
        const sliceLenth = (window.dpr === 2 || window.dpr === 3) ? 7 : 5;
        const str = introduce[1];
        if (str && str.length > sliceLenth) {
            introduce[1] = `${str.slice(0, sliceLenth)}...`;
        }
        data.activity_introduce = introduce.join(' ');
    }

    renderTop(data);
    renderSteps(data);
    renderGroup(Object.assign({}, data, processMembers(data)));
    renderMasks(data);
    renderMores(data);
    // 订单支付到pay页面后，是未成团的单，再跳转回来这个页面弹出微信分享浮层
    if (isWeixin && needShare && (data.is_member || data.show_share)) {
        window.localStorage.removeItem('needshare');
        if (data.status === 2) {
            $('#J_share-mask').removeClass('hidden');
        }
    }

    muiLoading.remove();
    multiPageLog();
    ptAppBar.init('body', () => {
        renderAds();
    });

    // 打点初始化
    ptLog.init({
        entity_list: data.iid,
        status: data.status,
        page: '拼团承接页',
        json: {
            user_status: (+data.is_member)
        }
    });

    // 交易打点
    logUtmSourceTrade(group_code);
};

const init = () => {
    const pageInit = () => {
        api.getPintuanDetail({ group_code }).then((data) => {
            // 是否需要重定向到伙拼
            if (data.activity_type === 4) {
                window.location.replace(`/mpt/group/duobao/home.html?group_code=${data.token}`);
            }
            
            // 分享设置(微信、app)
            shareConfig({
                data: data.share_info,
                successCb: () => {
                    if (env.app.isWeixin) {
                        $('#J_share-mask').addClass('hidden');
                        if (data.is_member) {
                            shareSuccess.render();
                        }
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

            Object.assign(data, processStatusData(data));
            // 商品已下架
            if (data.event_gmt_end < new Date() / 1000) {
                renderBtns(data);
                render(data);
                return;
            }

            // 加载sku的数据
            api.getNewestStock({ iid: data.iid, type: 'home' }).then((resp) => {
                const result = {
                    imgs: resp.skus[0].imgs,
                    sku: {
                        sku_id_map: resp.skus[0].sku_id_map,
                        sku_kv_map: resp.skus[0].sku_kv_map,
                        sku_stock_map: resp.skus[0].sku_stock_map
                    },
                    group_price: data.group_price
                };

                // 临时fix 试用商品不管库存
                if (data.activity_type === 3) {
                    _.forEach(result.sku.sku_stock_map, (item) => {
                        if (item.stock <= 0) {
                            item.stock = 2;
                        }
                    });
                }
                // 和商详页保持字段一致
                Object.assign(data, {
                    main_img: data.product_img,
                    item_fight_group: {
                        limit_num: data.limit_num,
                        group_price: data.group_price,
                        activity_type: data.activity_type
                    }
                });

                skuModal.init({
                    container: '#J_sku-mask',
                    data: Object.assign(data, result)
                });

                renderBtns(data, skuModal);
            });
            render(data);
        });
    };

    // 微信环境下 先进行微信授权
    if (isWeixin) {
        login.authInit(window.location.origin + `/mpt/group/home.html?group_code=${group_code}`, (result) => {
            if (result.isLogin) {
                wxFollow.init();
            } else if (result.token) {
                Status.token = result.token;
            }
            pageInit();
        });
    } else {
        pageInit();
    }
};

init();
