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
import BB from 'app/biz/common/gaea/preload';
import lazyloadCreater from '@beibei/lazyload';
import popup from '@beibei/popup';
import httpurl from '@beibei/httpurl';
import authTool from '../common/util/pusherAuth.js';
import util from '../common/util/util.js';
import muiLoading from '../../../../../unit/common/widget/pintuan/muiLoading/muiLoading.js'; // loading
import tpl from './share-pop/pop.xtpl';
import maskContentTpl from './mask/mask.xtpl';
import Mask from 'app/biz/mpt/common/component/shareMask/main';
import shareConfig from 'app/biz/mpt/common/share/share.js';
import Hammer from '@beibei/navmenu/bin/hammer.js';
import imageConvert from 'unit/common/js/image_convert/image_convert';

const lazyload = lazyloadCreater({
    useWebp: true
});
const mask = Mask({
    tip: '发送给朋友或群聊',
    content: new Xtemplate(maskContentTpl).render()
});
const main = {
    init: () => {
        // 初始化
        BB.callAPI({
            type: 'GET',
            method: 'beibei.pusher.invite.code.get',
            success: (resp) => {
                const data = main.dataFormat(resp);
                main.pop(data);
                main.shareInit(data);
                main.bindEvent(data.qr);
                muiLoading.remove();
            }
        });
    },
    pop: (data) => {
        const tplStr = new Xtemplate(tpl).render(data);
        $('.pop-container').append(tplStr);
        lazyload.getLazyImg();
    },
    shareInit: (data) => {
        // 分享设置
        // 1 url带needshare=1则弹出分享遮罩层
        const needShare = parseInt(httpurl.uri.params.needshare, 10) === 1;
        if(needShare) {
            mask.show();
        }
        // 2 分享参数设置
        shareConfig({
            data: {
                share_channel: "weixin_copy",
                share_desc: "贝贝赚宝,精选拼团,低价正品,更有海外正品直采,海量好货,等你来挑~",
                share_icon: "https://h0.hucdn.com/open/201642/e399392f39ddfe25_120x120.png",
                share_link: window.location.protocol + `//zb.beibei.com/mpt/pusher/home.html?uid=${data.uid}`,
                share_title: "我在贝贝赚宝,发现更多拼团快乐!"
            },
            successCb: () => {
                mask.hide();
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
    },
    bindEvent: (qrcode) => {
        // 长按复制
        const $dom = $('.fingerprint');
        // $('.abc').on('click', function(e){
        //     $('.abc').css({'margin-top':"-120px"});
        // });

        // const $tip = $('.share-popup .tip');
        // if (navigator.userAgent.match(/android/gi)) {
        //     // Android不支持纯js复制
        //     $dom.hide();
        //     $tip.html('(长按验证码选中复制)');
        //     return;
        // }
        // // IOS支持纯JS复制
        // new Hammer($dom[0], {
        //     domEvents: true
        // });
        // $dom.on("click", function(e) {
        //     superClipBoard.copy(qrcode, {
        //         success: () => {alert(11);},
        //         error: () => {alert(22);}
        //     });
        //     popup.note('内容已复制到剪切板', {
        //         closeTime: 1500,
        //         position: 'bottom',
        //         mask: false 
        //     });
        //     e.preventDefault();
        // });
    },
    dataFormat: (data) => {
        // 数据处理
        return _.extend({}, data, {
            avatar_img: imageConvert.format160(data.avatar)
        });
    }
};
//main.init();
authTool.init({
    isPusherCB: main.init
});
