import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import '@beibei/tingyun';

import priceHandle from '../../common/util/priceHandle.js';
import skuModal from '../../common/component/skuModal/skuModal.js';
import mores from '../../common/component/mores/mores.js';


import heatmap from '@beibei/statistics/statistics-heatmap';// 页面性能统计

import popup from '@beibei/popup';
import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import hybrid  from '@beibei/hybrid'; // 引入window.bbhybrid
import cookie from '@beibei/cookie';
import lazyLoadModule from '@beibei/lazyload';
import adsHelper from '@beibei/ads_helper';

import common from 'unit/common/js/common/common';
import isp from 'unit/common/js/isp/isp';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import ptAppBar from 'src/js/mp/pintuan/unit/ptAppBar.js';

import {addUrlUtmSource } from '../../common/util/tools.js';
import { timeFormat, downTimer, formatDateNumber } from '../../common/util/utils.js';

import {processStatusData } from './tools.js';

import wx from 'unit/common/js/wx/wx.js';
import wxFollow from 'app/biz/mpt/common/auth/follow.js';
import login from 'app/biz/mpt/common/auth/login.js';
import { getShareImg } from 'app/biz/mpt/common/share/wxshare.js';
import ptLog from '../../common/util/ptLog.js';
import mpb from '../component/mainbox/mainbox';
import users from '../component/group_users/group_users';

import stepsTpl from '../../home/steps.xtpl';
import maskTpl from './mask.xtpl';
import subTpl from '../component/group_users/sub.xtpl';

import './index.less';
import api from './api';

isp();
heatmap();
const isWeixin = env.app.isWeixin;
const isBeibei = env.app.isBeibei;
const group_code = httpurl.uri.params.group_code; // 拼团码
// 是否展示分享popup
const needShare = parseInt(httpurl.uri.params.needshare, 10) === 1
    || window.localStorage.getItem('needshare');

const $window = $(window);
const lazyLoad = lazyLoadModule({
    useWebp: true,
    threshold: 200
});
const Status = {
    token: ''
};
const defaultAvatar =
    '//b3.hucdn.com/upload/face/1607/18/18407810631476_1600x1600.jpg';

// 处理用户头像切图
const avatarHandler = (url, type) => {
    url = url || defaultAvatar;
    return url.search(/b[134]\.hucdn/) > 0 ? `${url}!160x160.${type}` : url;
};

// 用户头像 & 拼团详情 数据处理
const processMembers = (data) => {
    const temp = {};
    const processMemberInfo = (item) => {
        Object.assign(item, {
            jpg: avatarHandler(item.avatar, 'jpg'),
            webp: avatarHandler(item.avatar, 'webp'),
            join_time_format: timeFormat({
                time: item.join_time
            })
        });
        return item;
    };

    // 增加group_head_map数组用于渲染
    Object.assign(temp, {
        group_head_map: data.group_users.map(processMemberInfo)
    });

    while (temp.group_head_map.length < data.require_num) {
        temp.group_head_map.push({ is_null: true });
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
const renderTop = (data) => {
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
        jpg: imageConvert.format200(`${data.product_img}!210x210.jpg`),
        originPrice: !(data.is_lottery_item || data.activity_type === 3) ? (data.origin_price / 100) : '',
        priceInt: price.priceInt,
        priceDec: price.priceDec,
        endtime: timeFormat({ time: data.event_gmt_end })
    });

    mpb.render(data);
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

    // 渲染group_users
    users.render(data);

    $('#J_container-details').on('tap', '#J_load-more', () => {
        getAllMembers((res) => {
            if (res.group_users && res.group_users.length) {
                _.forEach(res.group_users, (item) => {
                    Object.assign(item, {
                        jpg: avatarHandler(item.avatar, 'jpg'),
                        webp: avatarHandler(item.avatar, 'webp'),
                        join_time_format: timeFormat({
                            time: item.join_time
                        })
                    });
                });

                Object.assign(res, {
                    has_more_users: res.page * res.page_size < res.count
                });
                $('#J_load-more').remove();
                $('#J_dropdown-box').append(new Xtemplate(subTpl)
                    .render({ res }));
                lazyLoad.getLazyImg();
            }
        });
    });

    $(document).on('click', '.J_go-toplist', () => {
        if (Status.is_member || Status.is_join_group) {
            location.href = '/mpt/group/duobao/realtime-rank.html?iid=' + data.iid;
        } else {
            popup.note('加入战队后才能查看榜单哦！', {
                closeTime: 1500,
                position: 'center',
                mask: false
            });
        }
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
                rid: 85995,
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
        uid: data.uid,
        event_id: data.event_id,
        options: {
            isSticky: true,
            rid: 85995
        }
    }).then((res) => {
        moresLog({
            iid: data.iid,
            recom_id: res.recom_id,
            items: res.fightgroup_items
        });
    });
};

const render = (data) => {
    // server队列任务有延时
    const isGroupEnd = (data.gmt_end < Date.now() / 1000); // 本期团购是否结束
    if (isGroupEnd && data.status === 2) {
        data.status = 3;
    }
    data.isGroupEnd = isGroupEnd;
    Status.is_member = data.is_member;
    Status.is_join_group = data.is_join_group;

    Object.assign(data, processStatusData(data));
    Object.assign(data, {
        has_more_users: data.group_users_count > 10,
        isLeader: data.member_first_uid === cookie('_logged_'),
        status_message: data.status_message &&
        data.status_message.replace(/(\d+)/gi, '<em>$1</em>'),
        limitTime: data.limitTime && _.mapValues(data.limitTime, formatDateNumber)
    });

    renderTop(data);
    renderSteps(data);

    renderGroup(Object.assign(data, processMembers(data)));

    renderMasks(data);

    renderMores(data);

    muiLoading.remove();
    if (!isBeibei) {
        ptAppBar.init('body', () => {
            renderAds();
        });
    }
    // 订单支付到pay页面后，是未成团的单，再跳转回来这个页面弹出微信分享浮层
    if ((isWeixin || isBeibei) && needShare && (data.is_member || data.show_share)) {
        window.localStorage.removeItem('needshare');
        $('#J_share-mask').removeClass('hidden');
    }


    //APP内分享
    const processAppShareInfo = (share_info) => {
        return {
            platform: share_info.share_channel,
            url: share_info.share_link,
            title: share_info.share_title,
            comment: share_info.share_desc,
            desc: share_info.share_desc,
            image: share_info.share_icon,
            small_img: share_info.share_icon,
            large_img: share_info.share_icon
        };
    };

    const setAppShare = (share_info) => {
        const $appShare = $('#app_share_conf');
        const config = processAppShareInfo(share_info);
        $appShare.val(JSON.stringify(config));
    }

    // APP内分享
    if (isBeibei) {
        setAppShare(data.share_info);
        const monitorAction = {
            customNavBarRightBtn: 'optional'
        };
        const bbhybrid = window.bbhybrid;
        bbhybrid.config({
            jsApiList: monitorAction
        }, () => {
            bbhybrid.customNavBarRightBtn({
                hidden: false
            });
        });
    }

    // 打点初始化
    ptLog.init({
        entity_list: data.iid,
        status: data.status,
        page: '拼团承接页',
        json: {
            user_status: (+data.is_member)
        }
    });
};

const init = () => {
    const pageInit = () => {
        api.getPintuanDetail(group_code).then((data) => {
            if (data.success) {
                // 返回正确的数据
                if (env.app.isWeixin) {
                    wx.config(() => {
                        wx.shareConfig({
                            title: data.share_info.share_title,
                            desc: data.share_info.share_desc,
                            // 添加sessionStorage中的utm_source 用于交易链路打点
                            link: addUrlUtmSource(data.share_info.share_link),
                            imgUrl: getShareImg(data.share_info.share_icon),
                            success: () => {
                                $('#J_share-mask').addClass('hidden');
                                // 统计加一
                                ptLog.stat({
                                    json: {
                                        share: 1
                                    }
                                });
                            },
                            cancel: () => {
                                $('#J_share-mask').addClass('hidden');
                            }
                        });
                        wx.hideMenuItems(['menuItem:share:timeline']);
                    });
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
            } else {
                // 返回异常的数据
                popup.alert(data.message || data.err_msg);
                muiLoading.remove();
            }
        });
    };

    // 微信环境下 先进行微信授权
    if (isWeixin) {
        login.authInit(window.location.origin + `/mpt/group/duobao/home.html?group_code=${group_code}`, (result) => {
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
