import "@beibei/tingyun";
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点
import httpapi from '@beibei/httpurl';
import env from '@beibei/env';
import template from '@beibei/template';
import share from 'unit/common/js/share';
import login from 'unit/common/js/login';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import lazyloadModule from '@beibei/lazyload';
import BB from 'unit/common/js/common';
import wxTools from 'src/js/mp/pintuan/unit/wxTools.js';
import bindDialog from 'src/js/mp/pintuan/unit/bindDialog.js';
import util from 'src/js/mp/pintuan/unit/util.js';
import mores from '../../common/component/mores/mores.js';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import './index.less';

const params = httpapi.uri.params;
const iid = params.iid;


isp();
performance();
heatmap();

const lazyload = lazyloadModule({
    useWebp: true,
    threshold: 200
});

const getLotteryDate = (time) => {
    const ts = new Date().getTime() + time * 1000;
    const date = new Date(ts);
    return date.getFullYear() + '-' +
        util.formatDateNumber(date.getMonth() + 1) + '-' +
        util.formatDateNumber(date.getDate());
};

const trySubmit = {
    // 初始化(入口)
    init() {

        if (!(iid)) {
            return;
        }
        $('.J_page').removeClass('hidden');

        //隐藏h5分享按钮
        share.setShare({ 'type': 'yes' });
        this.getInfo();
    },
    // 通用渲染
    render(obj) {
        const self = this;

        if (!obj || typeof obj !== 'object') {
            return '';
        }

        //缓存配置项
        const fn = obj.callBack,
            container = obj.container,
            tplcontainer = obj.tplcontainer,
            delTpl = obj.delTpl;

        let data = obj.data || {};

        data = data.hiddenbtn ? { 'html': data.html } : data;

        if (!container) {
            return;
        }
        // 编译渲染
        const $container = $(container),
            $template = $(tplcontainer),
            tpl = $template.html(),
            html = template(tpl, data);

        $container.append(html);
        // 是否渲染后删除模板
        if (delTpl) {
            $template.remove();
        }

        //回调处理
        fn && fn.call(self, data, $container);
    },
    // 渲染头部
    renderHeader(data) {
        this.render({
            container: '.J_result',
            tplcontainer: '#T_result',
            data: {
                lotteryDate: getLotteryDate(data.fightgroup_lottery_item.lave_time)
            },
            delTpl: true,
            callBack(data, $container) {
                $container.removeClass('hidden');
            }
        });
    },
    // 渲染商品
    renderProduct(data) {
        data = data.fightgroup_lottery_item;
        this.render({
            container: '.J_product',
            tplcontainer: '#T_product',
            data: {
                targetUrl: location.origin + '/gaea_pt/mpt/group/detail.html?iid=' + data.iid +
                '&beibeiapp_info={"target":"detail","iid":' + data.iid + '}',
                img: imageConvert.format200(data.img),
                title: data.title,
                price: data.price / 100
            },
            delTpl: true,
            callBack(data, $container) {
                $container.parent().removeClass('hidden');
            }
        });
    },
    // 获取数据
    getInfo() {
        const self = this;

        BB.callAPI({
            url: '//sapi.beibei.com/fightgroup/lottery_recom/' + iid + '.html',
            type: 'GET',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupLotteryRecomGet',
            cache: true,
            noDialog: true,
            success(resp) {
                // 移除loading
                muiLoading.remove();
                self.renderHeader(resp);
                self.renderProduct(resp);

                resp.fightgroup_items = resp.fightgroup_lottery_item_recoms;

                // 大数据－大家都在团
                mores.renderMores(resp, {
                    isSticky: true,
                    iid,
                    rid: 85999
                });
            }
        });
    }
};

// 检测登录
if (env.app.isWeixin) {
    wxTools.authInit(window.location.href, (result) => {
        if (result.isLogin) {
            bindDialog.hide();
            trySubmit.init();
        } else if (result.token) {
            muiLoading.remove();
            bindDialog.show();
            bindDialog.handle(result.token, () => {
                window.location.reload();
            });
        }
    });
} else {
    login.checkLogin((isLogin) => {
        if (isLogin) {
            trySubmit.init();
        } else {
            login.doLogin(() => {
                trySubmit.init();
            });
        }
    });
}
