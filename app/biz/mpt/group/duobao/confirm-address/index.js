import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp'; //防拦截
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import heatmap from '@beibei/statistics/statistics-heatmap'; //热力图打点

import 'unit/common/js/wxHideNavbar';
import env from '@beibei/env';
import httpapi from '@beibei/httpurl';
import confirmAddress from 'src/js/mp/pintuan/unit/confirmAddress.js';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import login from 'unit/common/js/login';
import wxLogin from 'app/biz/mpt/common/auth/login.js';

import './index.less';

isp();
performance();
heatmap();

const option = {
    title: '0元伙拼',
    url: '//api.beibei.com/mroute.html?method=beibei.fightgroup.duobao.apply',
    callback(resp) {
        const url = new httpapi.httpurl(location.origin + '/mpt/group/duobao/home.html');
        url.params = {
            group_code: resp.data,
            needshare: 1
        };
        location.replace(url.toString());
    }
};

// 检测登录
if (env.app.isWeixin) {
    wxLogin.authInit(window.location.href, result => {
        if (result.isLogin) {
            confirmAddress.init(option);

        } else if (result.token) {
            const dialog = wxLogin.getDialog();

            muiLoading.remove();
            dialog.show();
            dialog.setCallback(() => {
                window.location.reload();
            });
        }
    });
} else {
    login.checkLogin((isLogin) => {
        if (isLogin) {
            confirmAddress.init(option);
        } else {
            login.doLogin(() => {
                confirmAddress.init(option);
            })
        }
    });
}
