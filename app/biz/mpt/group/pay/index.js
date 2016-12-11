import '@beibei/tingyun';
import Xtemplate from 'xtemplate/lib/runtime';
// 页面性能统计
import performance from '@beibei/statistics/statistics-performance.js';
// import env from '@beibei/env';
import httpurl from '@beibei/httpurl';
import cookie from '@beibei/cookie';
import libLazyload from '@beibei/lazyload';
import popup from '@beibei/popup';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import common from '../../../../../unit/common/js/common/common.js';
import appbar from '../../../../../unit/common/js/appbar/appbar.js' // 下载贝贝提示
import isp from '../../../../../unit/common/js/isp/isp.js';

// 拼团共用模块
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import { setWxShare } from 'app/biz/mpt/common/share/wxshare.js';
import mores from '../common/component/mores/mores.js';
import { gapTime, downTimer } from '../common/util/utils.js';
import ptLog from '../common/util/ptLog.js';

import detailsTpl from './details.xtpl';
import stepsTpl from './steps.xtpl';
import maskTpl from './mask.xtpl';
import couponTpl from './coupon.xtpl';

import './index.less';

isp();
performance();

const lazyload = libLazyload({
    useWebp: true
});

// const isBeibei = env.app.isBeibei || env.app.isBeibeiHD;

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
        }))
};

const app = (() => {
    const group_code = httpurl.uri.params.group_code;
    // 渲染拼团详情
    const renderDetails = (data) => {
        const bindEvents = () => {
            // 喊人参团
            $('#J_let-join').on('tap', () => {
                $('#J_share-mask').removeClass('hidden');
            });

            // 下载提示
            $('.J_down-load').on('tap', () => {
                // 打开遮罩
                $('#J_download-mask').removeClass('hidden');
            });
        };

        // 预处理模板数据
        data.statusClass = mapStateToClass(data.status);

        // 处理group_users
        data.group_users.forEach((item) => {
            item.jpg = imageConvert.format200(item.avatar || '//b3.hucdn.com/upload/face/1607/18/18407810631476_1600x1600.jpg');
        });

        if (data.group_users.length >= 4) {
            data.group_user_more = true;
            data.group_user_more_num = data.group_users.length - 3;
            data.group_users = data.group_users.slice(0, 3);
        } else {
            data.group_user_more = false;
        }

        if (data.require_num >= 3) {
            data.group_users_show_num = 3;
        } else {
            data.group_users_show_num = 2;
        }

        data.limitTime = gapTime(new Date() / 1000 | 0, data.gmt_end | 0);

        $('#J_container-details').html(new Xtemplate(detailsTpl).render({ res: data }));

        // 执行倒计时
        downTimer({
            obj: data.limitTime,
            $DOM: $('#J_downTimer'),
            role: 'pintuan-pay'
        });

        // 获取图片
        lazyload.getLazyImg();

        // 设置微信分享的内容
        setWxShare(data.share_info, () => {
            $('#J_share-mask').addClass('hidden');
        });

        bindEvents();

    };

    // 渲染步骤
    const renderSteps = (data) => {
        $('#J_container-steps').html(new Xtemplate(stepsTpl).render({ res: data, iid: data.iid }));
    };

    // 渲染60元红包
    const renderCoupon = (data) => {
        const bindEvents = () => {
            // 领取60元红包
            $(document).on('tap', '#J_btn-receive', () => {
                appbar.getDownloadLink((res) => {
                    window.location.href = res;
                });
            });
        };
        $('#J_container-coupon').html(new Xtemplate(couponTpl).render({ res: data.user_tag & 0x04 }));

        // 注入用户的电话号码的尾号
        $('.J_user-tel').html(data.tel.split('*').pop());
        bindEvents();
    };

    // 渲染遮罩层组
    const renderMasks = (data) => {
        const bindEvents = () => {
            // 关闭分享遮罩
            $('#J_share-mask').on('click', function () {
                $(this).addClass('hidden');
            });

            // 关闭下载贝贝APP的遮罩
            $('#J_btn-cancel').on('click', () => {
                $('#J_download-mask').addClass('hidden');
            });

            // 下载贝贝App
            $('#J_btn-download').on('click', () => {
                appbar.getDownloadLink((res) => {
                    window.location.href = res;
                });
            });
        };
        $('#J_container-masks').html(new Xtemplate(maskTpl).render({ res: data }));
        bindEvents();
    };

    // 获取用户基本信息
    const getUserInfo = (callback) => {
        // 登录拦截
        if (common.isLogin()) {
            common.callAPI({
                method: 'beibei.user.get',
                cache: true,
                success(resp) {
                    if (resp.err_code * 1 === 2) {
                        // err_code === 2:无效的会话，需要重新登录
                        common.callAPI({
                            method: 'beibei.h5.logout',
                            success() {
                                window.location.href = `/login/login.html?redirect=${encodeURIComponent(window.location.href)}}`
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
                    } else {
                        if (typeof callback === 'function') {
                            callback(resp);
                        }
                    }
                },
                error() {
                    console.log('person error!');
                }
            });
        }
    };

    // 大数据－大家都在团
    const renderMores = (data) => {
        mores.bigDataInit({
            iid: data.iid,
            uid: data.uid,
            event_id: data.event_id,
            options: {
                isSticky: true,
                rid: 85980
            }
        });
    };

    const stateClassMap = ['over', 'win', 'wait', 'failed'];
    // 映射拼团状态对应的Class
    const mapStateToClass = state => (stateClassMap[state] || '');

    const showShareMask = (state) => {
        if (state === 2) {
            $('#J_share-mask').removeClass('hidden');
        }
    };

    const init = () => {
        api.getPintuanDetail({ group_code }).then((data) => {
            // 待成团订单调整到承接页
            if (data.status === 2) {
                window.location.href = `/mpt/group/home.html?group_code=${group_code}`;
            }

            // 移除loading
            renderDetails(data);
            // 渲染steps
            renderSteps(data);

            // 渲染mask
            renderMasks(data);
            renderMores(data);
            // 加载用户信息
            getUserInfo(renderCoupon);


            // 是否待成团订单,是则显示分享浮层
            showShareMask(data.status);

            ptLog.init({
                page: '支付完成页',
                entity_list: data.token
            });

            muiLoading.remove();
        });

        appbar.init(appbar.TYPE.index); // 下载体验条
    };
    init();
})();
