/**
 * @desc    加入贝贝赚宝
 * @author  yi.feng@husor.com
 * @date    16/10/20
 */
import '@beibei/tingyun';
import isp from 'unit/common/js/isp';
import heatmap from '@beibei/statistics/statistics-heatmap'; // 热力图打点
import performance from '@beibei/statistics/statistics-performance'; // 页面性能统计
import httpapi from '@beibei/httpurl';
import popup from '@beibei/popup';
import lazyloadCreater from '@beibei/lazyload';
import Xtemplate from 'xtemplate/lib/runtime';
import common from 'unit/common/js/common/common';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading';
import mores from './mores/mores';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import joinTpl from './join.xtpl';
import './index.less';

isp();
heatmap();
performance();

const uid = httpapi.uri.params.uid;
const lazyload = lazyloadCreater({ useWebp: true });
const main = {
    init: () => {
        if (!uid) {
            popup.alert('无效的参数！');
            return;
        }
        main.getUserInvitationCode(uid).then(main.handle);
        mores.init();
    },
    getUserInvitationCode: opUid => (
        new Promise((resolve, reject) => {
            common.callAPI({
                type: 'GET',
                // mock
                // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.invite.code.get&version=5805de4cfd8d24c57585e53f&mock_index=0',
                method: 'beibei.pusher.invite.code.get',
                data: { op_uid: opUid },
                cache: true,
                noDialog: true,
                success: resolve,
                error: reject
            });
        })
    ),
    handle: (resp) => {
        resp.avatar = imageConvert.format160(resp.avatar);
        $('.join').append(new Xtemplate(joinTpl).render({ resp }));
        lazyload.getLazyImg();
        muiLoading.remove();
        window.localStorage.setItem('inviteCode', resp.invite_code);
    }
};

main.init();
