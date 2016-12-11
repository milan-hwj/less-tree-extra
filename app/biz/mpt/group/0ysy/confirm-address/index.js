import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点

import 'unit/common/js/wxHideNavbar';
import env from '@beibei/env';
import httpapi from '@beibei/httpurl';
import wxTools from 'src/js/mp/pintuan/unit/wxTools.js';
import bindDialog from 'src/js/mp/pintuan/unit/bindDialog.js';
import confirmAddress from 'src/js/mp/pintuan/unit/confirmAddress.js';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import login from 'unit/common/js/login/login2';
import login_hint from '../../common/component/login_hint/login_hint';

import api from './api';
import './index.less';

isp();
performance();
heatmap();

const params = httpapi.uri.params;
const iid = params.iid;

const callback = (resp) => {
    api.getPintuanDetail(resp.data).then((data) => {
        let url;
        if (data.status === 1) {
            url = new httpapi.httpurl(location.origin + '/mpt/group/0ysy/submit-success.html');
            url.params = {
                iid: iid
            };
            url = url.toString();
        } else {
            url = new httpapi.httpurl(location.origin + '/mpt/group/home.html');
            url.params = {
                group_code: resp.data,
                needshare: 1
            };
            url = url.toString();
            if (!env.app.isWeixin) {
                url = url + '&beibeiapp_info={"target":"bb/pintuan/detail","group_code":"' + resp.data + '","isShowShare":true}';
            }
        }
        location.replace(url);
    });
};

const option = {
    title: '免费试用',
    url: '//api.beibei.com/mroute.html?method=beibei.fightgroup.free.trial.apply',
    callback
};


// 检测登录
if (env.app.isWeixin) {
    wxTools.authInit(window.location.href, (result) => {
        if (result.isLogin) {
            bindDialog.hide();
            confirmAddress.init(option);
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
            confirmAddress.init(option);
        } else {
            // 还需判断是否在APP内
            if (env.app.isBeibei) {
                login_hint.show();
            }
            login.login(() => {
                confirmAddress.init(option);
            });
        }
    });
}
