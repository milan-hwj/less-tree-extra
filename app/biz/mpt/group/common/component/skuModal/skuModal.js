import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import IScroll from 'iscroll/build/iscroll-lite.js';
import popup from '@beibei/popup';
import httpurl from '@beibei/httpurl';
import env from '@beibei/env';
import ptLog from '../../util/ptLog.js';
import cookie from '@beibei/cookie';
import area_limit from '../area_limit/area_limit.js';
import common from 'unit/common/js/common/common';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';

import '../amount/amount.js'; // 选择商品数量插件
import skuModalTpl from './skuModal.xtpl';
import Sku from '../../util/skuHandle.js';
import cartAnimation from '../cartAnimation/cartAnimation.js';
import { setRedirect } from '../../util/tools.js';
import wxFollow from '../../../../common/auth/follow.js';

import './index.less';

// import {
//    authInit,
//    dialog
// } from '../../../../common/auth/login.js';

const source = httpurl.uri.params.source; // 来源
const isWeixin = env.app.isWeixin;

const eventApi = (url, option) => (
    new Promise((resolve, reject) => {
        common.callAPI({
            url,
            type: 'post',
            data: {
                group_code: option.group_code,
                address_id: option.address_id,
                sku_id: option.sku_id,
                iid: option.iid
            },
            dataType: 'json',
            cache: true,
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
            }
        });
    })
);

const api = {
    addCart: options => (
        new Promise((resolve, reject) => {
            common.callAPI({
                method: 'beibei.cart.add',
                type: 'POST',
                data: options,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })
    ),
    submitTrial: options => (
        eventApi('//api.beibei.com/mroute.html?' +
            'method=beibei.fightgroup.free.trial.apply', options)
    ),
    submitDuobao: options => (
        eventApi('//api.beibei.com/mroute.html?' +
            'method=beibei.fightgroup.duobao.apply', options)
    )
};

const errorHandler = (res) => {
    popup.note(res.message ? res.message : '未知错误，请稍后重试', {
        closeTime: 1500,
        position: 'center'
    });
};

const logout = () => {
    common.callAPI({
        type: 'GET',
        method: 'beibei.h5.logout',
        data: {},
        success() {
            window.location.href =
                `/login/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        },
        error() {
            popup.confirm('发生错误，请重新登录后再试', () => {
                window.location.href = '/i/account-index.html';
            }, () => {
            }, {
                actionConfig: [{
                    text: '取消'
                }, {
                    text: '我的账户'
                }]
            });
        }
    });
};

const initAreaLimit = () => {
    area_limit.init({
        leftText: '继续购买',
        rightText: '修改默认地址'
    }, () => {
        window.location.href = '/gaea_pt/mpt/group/channel.html';
    }, () => {
        window.location.href = '/i/address-manage.html';
    });
};

const skuModal = {
    init({ container, data, onHide = () => {
    }, onInit = () => {
    } }) {
        this.data = data;
        this.sku = new Sku(data);
        // 购买的类型 group：拼团 single 单独购买
        this.buyType = 'group';
        Object.assign(this.sku, {
            main_img: imageConvert.format200(data.main_img),
            imgs: data.imgs,
            iid: data.iid,
            uid: data.uid,
            event_id: data.event_id,
            group_price: data.item_fight_group &&
            data.item_fight_group.group_price
        });
        this.render({ container, data: this.sku });
        this.num = 1; // 默认购买1件
        this.onHide = onHide;
        initAreaLimit();
        this._bindEvents(data);
        this._initAmount();
        this.renderSku();
        this._renderInfo();
        this._renderImage();
        (typeof onInit === 'function') && onInit();
        return this;
    },
    // 渲染sku窗口
    render({ container, data }) {
        this.$modal = $(new Xtemplate(skuModalTpl).render({ data }));
        $(container).append(this.$modal);
        return this;
    },
    // 设置购买方式:1.group(团购) 2.single(单独购买)
    setBuyType(type = 'group') {
        this.buyType = type;
    },
    // 获取购买方式
    getBuyType() {
        return this.buyType;
    },
    _bindEvents(data) {
        // 关闭sku弹窗
        this.$modal.find('#J_sku-closed').on('touchend click', (e) => {
            e.preventDefault();
            this.setBuyType(); // 默认是拼团的方式购买
            this.hide();
        });
        //  选择规格
        this.$modal.on('tap', '.sku-item', (event) => {
            const $this = $(event.target);
            const id = $this.data('id');
            if ($this.hasClass('disabled')) {
                return;
            }
            if (!$this.hasClass('active')) {
                this.renderSku(this.sku.add(id));
                this._setMax();
                this._renderImage(id);
            } else {
                this.renderSku(this.sku.remove(id));
            }
            this._renderInfo();
        });
        // 购买
        this.$modal.find('#J_sku-seleted').on('click', () => {
            if (!this.sku.getSku()) {
                popup.note(this.sku.getInfo(), {
                    closeTime: 1000,
                    position: 'center',
                    mask: false
                });
            } else {
                this.submit(data);
            }
        });
    },
    // 显示sku窗口
    show() {
        this.$modal.addClass('show');
        this.beforeShow();
        if (!$('.J_sku-cover')[0]) {
            window.setTimeout(() => {
                $('<div class="J_sku-cover sku-cover"></div>').on('click', (e) => {
                    e.preventDefault();
                    this.hide();
                }).appendTo('body');
            }, 0);
        }
        if (!this.skuModalIscroll) {
            this.skuModalIscroll = new IScroll('#J_scroll-container', {
                mouseWheel: true,
                scrollbars: false
            });
        }
        return this;
    },
    // 隐藏sku窗口
    hide() {
        this.$modal.removeClass('show');
        (typeof this.onHide === 'function') && this.onHide();
        $('.J_sku-cover').remove();
    },
    // 显示sku窗口前处理数据
    beforeShow() {
        this.renderPrice();
        this._setMax();
    },
    // 根据购买方式，修改sku窗口的价格
    renderPrice() {
        let price;
        if (this.getBuyType() === 'group') {
            price = this.sku.group_price / 100;
        } else {
            price = this.data.price / 100;
        }
        this.$modal.find('#J_sku-price').html(price);
    },
    // 初始化选择数量组件
    _initAmount() {
        const _this = this;
        this.$amount = this.$modal.find('#J_container-amount').amount({
            onChange() {
                _this.num = this.num;
            }
        });
    },
    // 设置购买
    _setMax() {
        let max;
        const sku = this.sku.getSku();
        const skuMax = sku ? sku.stock : this.data.stock;
        if (this.getBuyType() === 'group') {
            max = Math.min(this.data.item_fight_group &&
                this.data.item_fight_group.limit_num, skuMax);
        } else {
            max = Math.min(this.data.limit_num, skuMax);
        }
        this.$amount.setMax(max);
    },
    // 渲染sku窗口各规格按钮状态
    renderSku() {
        const _this = this;
        this.$modal.find('.sku-item').each(function () {
            const status = _this.sku.map[$(this).data('id')];
            if (status === 1) {
                $(this).addClass('active').removeClass('disabled');
            } else if (status === 0) {
                $(this).removeClass('active').removeClass('disabled');
            } else {
                $(this).removeClass('active').addClass('disabled');
            }
        });
    },
    // 渲染规格信息 "已选 XXXXX"
    _renderInfo() {
        this.$modal.find('.txt').html(this.sku.getInfo());
    },
    // 渲染sku窗口中的商品图片
    _renderImage(id) {
        let image;
        if (!id) {
            image = this.sku.imgs[
                _.find(this.sku.selectedPropsList,
                        imgId => this.sku.imgs[imgId])];
        } else {
            image = this.sku.imgs[id];
        }
        if (image) {
            this.image = image;
            this.$modal.find('#J_sku-img')
                .attr('src', imageConvert.format320(image));
        }
    },
    // 设置组件提交接口的group_code参数
    setGroupCode(val) {
        this.group_code = val;
    },
    // 提交
    submit() {
        const data = this.data;
        const checkCondition =
            wxFollow.checkCondition(data.item_fight_group.group_price);
        const type = wxFollow.getShowFollowType();
        const isTrialGood = data.item_fight_group &&
            (data.item_fight_group.activity_type === 3);
        const isDuobaoGood = data.item_fight_group &&
            (data.item_fight_group.activity_type === 4);
        //  微信,满足产品关注条件 并且不是公众号入口进去
        const needToFollow = isWeixin && checkCondition && !(source === 'bbtm' || source === 'bbpt') && type;
        const skuId = this.sku.getSku().sku_id;
        const iid = data.iid;
        // const _uid = data.uid;
        const group_code = this.group_code || httpurl.uri.params.group_code || 1;
        const num = this.num || 1;

        if (needToFollow) {
            wxFollow.show(type);
            setRedirect(window.location.href);
            ptLog.stat({
                json: {
                    tofollow: 1
                }
            });
            return;
        } else if (isTrialGood || isDuobaoGood) {
            if (skuId) {
                let apiUrl = `/mpt/group/${isTrialGood ? '0ysy' : 'duobao'}/confirm-address.html?iid=${iid}&sku_id=${skuId}&group_code=${group_code}`;
                if (env.app && env.app.isBeibei) {
                    apiUrl = window.location.origin + apiUrl;
                    apiUrl = `beibei://bb/base/webview?url=${encodeURIComponent(apiUrl)}`;
                }

                if (cookie('st_au')) {
                    const option = {
                        group_code,
                        address_id: '-1',
                        sku_id: skuId,
                        iid
                    };
                    api[isTrialGood ? 'submitTrial' : 'submitDuobao'](option)
                        .then((res) => {
                            if (res.success) {
                                window.location.href = apiUrl;
                            } else {
                                const [msg] = res.message.split('[');
                                popup.note(msg, {
                                    closeTime: 1500,
                                    position: 'center',
                                    mask: false
                                });
                            }
                        });
                } else {
                    window.location.href = apiUrl;
                }
                return;
            }
            return;
        }

        if (skuId) {
            if (this.getBuyType() === 'group') {
                api.addCart({
                    iid,
                    sku_id: skuId,
                    group_code,
                    pay_direct: true,
                    pay_direct_type: 8,
                    num
                }).then(
                    (res) => {
                        if (res.cart_id) {
                            window.location.href = `/trade/trade.html?_cart_id=${res.cart_id}&group_code=${group_code}&nums=${num}`;
                        } else if (res.data === 'fightgroup_deny') {
                            popup.confirm(res.message, () => {
                                // 3缺1、老带新 --> 开新团
                                api.addCart({
                                    iid,
                                    sku_id: skuId,
                                    group_code: 1,
                                    pay_direct: true,
                                    pay_direct_type: 8,
                                    num
                                }).then((resp) => {
                                    if (resp.cart_id) {
                                        window.location.href = `/trade/trade.html?_cart_id=${resp.cart_id}&group_code=1&nums=${num}`;
                                    }
                                    if (!resp.success) {
                                        errorHandler(res);
                                    }
                                });
                            }, () => {
                            }, {
                                mainStyle: {
                                    width: '70%',
                                    'max-width': '70%',
                                    left: '-35%'
                                },
                                actionConfig: [{ text: '取消' }, { text: '我去开团' }]
                            });
                        } else if (res.data === 'shipping_deny') { // 生鲜地址不发货
                            this.hide();
                            if (res.message) {
                                area_limit.setTips(res.message);
                            }
                            area_limit.show();
                        } else {
                            errorHandler(res);
                        }
                    }
                );
            } else {
                // 单独购买
                api.addCart({
                    iid,
                    sku_id: skuId,
                    check_shipping: 1,
                    num
                }).then((res) => {
                    if (res.success === true) {
                        this.hide();
                        cartAnimation.show();
                        // 成功加入购物车动画
                        cartAnimation.go(imageConvert.format320(this.image));
                    } else if (res.err_code * 1 === 2) {
                        // err_code === 2:无效的会话，需要重新登录
                        logout();
                    } else if (res.data === 'shipping_deny') {
                        // 生鲜地址不发货
                        this.hide();
                        if (res.message) {
                            area_limit.setTips(res.message);
                        }
                        area_limit.show();
                    } else {
                        errorHandler(res);
                    }
                });
            }
        }
    }
};

export default skuModal;
