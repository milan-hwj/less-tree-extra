/**
 * 拼团-限时秒杀
 */
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import backtop from '@beibei/backtop';
import env from '@beibei/env';
import popup from '@beibei/popup';
import login from 'unit/common/js/login/login2';
import wx_login from 'app/biz/mpt/common/auth/login';
import login_hint from '../../common/component/login_hint/login_hint';
import bindDialog from 'src/js/mp/pintuan/unit/bindDialog.js';
import shareConfig from 'app/biz/mpt/common/share/share.js';

import Xtemplate from 'xtemplate/lib/runtime';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import ptLog from '../../common/util/ptLog';
import xtpl from './coupon.xtpl';
import './index.less';
import api from './api';

isp();
heatmap();
performance();
if (!env.app.isBeibei) {
    backtop();
}

const app = {
    init() {
        api.getGuessCouponItem().then((res) => {
            const newData = this.processData(res);
            // 移除loading
            muiLoading.remove();
            const html = new Xtemplate(xtpl).render({ data: newData.items });
            $('#J_container').append(html);
            this.changeChanceText(newData.last_channce_text);
        });
        ptLog.init({
            page: '猜价格免单开团'
        });
        this.bindEvent();
    },
    processData(data) {
        const obj = Object.assign({}, data);
        obj.items.forEach((el) => {
            el.img += '!320x320.jpg';
            el.is_soldout = (el.stock === 0);
            el.is_lock = (el.is_get_coupon === 0);
        }, this);
        obj.last_channce_text = this.getChanceText(obj.coupon_count);
        return obj;
    },
    getChanceText(count) {
        return count > 0 ?
            `您有${count}次0元开团的机会` : '机会用光了，参与猜价格赢取免单开团机会';
    },
    changeChanceText(text) {
        $('#J_last-channce').html(text);
    },
    removeSign($item) {
        $item.find('.item-tips').remove();
    },
    bindEvent() {
        const self = this;
        $(document).on('click', '.J_coupon-item', (event) => {
            const item = event.currentTarget;
            const $item = $(item);
            const event_id = $item.data('event_id');
            const iid = $item.data('iid');
            const title = $item.data('title');
            const type = $item.find('.item-tips').data('type');
            if (type === 'lock') {
                popup.confirm(`您确认要获取${title}的免费开团机会吗？`, () => {
                    // 点击确定
                    // 发起请求领取免单券
                    api.getGuessCoupon(event_id).then((res) => {
                        
                        popup.note(res.message, {
                            closeTime: 1500,
                            position: 'center',
                            mask: false
                        });
                        if (res.success) { // 领券成功
                            self.changeChanceText(self.getChanceText(res.coupon_count));
                            self.removeSign($item);
                        }
                    });
                }, () => {
                    // 点击取消
                }, {
                    actionConfig: [{
                        text: '取消'
                    }, {
                        text: '确定'
                    }]
                });
            } else if (type === 'soldout') {
                popup.note('哎呀，优惠券被抢光了！', {
                    closeTime: 1500,
                    position: 'center',
                    mask: false
                });
            } else {
                window.location.href = `//m.beibei.com/mpt/group/detail.html?iid=${iid}&beibeiapp_info={"target":"bb/base/product","iid":${iid}}`;
            }
        });
    }

};


// 检测用户是否已绑定过手机号码
const showBindDialog = () => {
    const dialog = wx_login.getDialog();
    dialog.show();
    // 手机弹窗绑定
    dialog.setCallback(() => {
        window.location.reload();
    });
};


// 检测登录
if (env.app.isWeixin) {
    wx_login.authInit(window.location.href, (result) => {
        if (result.isLogin) {
            app.init();
        } else if (result.token) {
            showBindDialog();
        }
    });
} else {
    login.checkLogin((isLogin) => {
        if (isLogin) {
            app.init();
        } else {
            // 还需判断是否在APP内
            if (env.app.isBeibei) {
                login_hint.show();
            }
            login.login(() => {
                app.init();
            });
        }
    });
}



// 分享设置(微信、app)
shareConfig({
    data: {
        share_channel: 'weixin',
        share_desc: '0元商品抢先看，喜欢的话就赶紧去参加活动吧，只要猜对价格就能获得免单的机会，快来一起猜猜猜~  ',
        share_icon: 'https://h0.hucdn.com/open/201642/d07b549a425a1518_100x100.jpg',
        share_link: window.location.protocol + '//m.beibei.com/mpt/group/party/guess_free_coupon.html',
        share_title: '【贝贝拼团11.11】猜价送免单，千元商品免费团'
    },
    successCb: () => {
        if (env.app.isWeixin) {
            // 统计加一
            ptLog.stat({
                json: {
                    share: 1
                }
            });
        }
    },
    cancelCb: () => {
    },
    configCb: (wxTool) => {
        wxTool.hideMenuItems(['menuItem:share:timeline', 'menuItem:share:email', 'menuItem:favorite']);
    }
});
