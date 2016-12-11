import '@beibei/tingyun';
import './index.less';

import common from '../../../../../unit/common/js/common/common';
import authTool from '../common/util/pusherAuth.js';
import popup from '@beibei/popup';


init();

function init() {
    // if (authTool.getPusherCookie()) {
    //     redirect();
    //     return;
    // }
    authTool.init({
        isPusherCB() {
            redirect();
        },
        notPusherCb() {
            $('#J_container').removeClass('hidden');
            $('#J_code').val(window.localStorage.getItem('inviteCode'));
            bindEvents();
        }
    });
};

function bindEvents() {
    const $footer = $('#J_footer');
    $('#J_code').on('focus', () => {
        $footer.hide();
    }).on('blur', () => {
        $footer.show();
    });

    $('#J_submit').on('click', () => {
        const code = $('#J_code').val();
        if (!code) {
            popup.note('请输入验证码', {
                closeTime: 1500,
                position: 'center'
            });
            return;
        }
        common.callAPI({
            type: 'POST',
            // url: 'http://devtools.husor.com/hif/mock?api=beibei.pusher.invitecode.verify&version=57a19e46360467b94c920419&mock_index=0',
            // TODO mock
            method: 'beibei.pusher.invitecode.verify',
            data: {
                code
            },
            success(res) {
                if (res.success) {
                    authTool.setPusherCookie();
                    redirect();
                }
                else {
                    popup.note(res.message || '未知错误，请稍后重试', {
                        closeTime: 1500,
                        position: 'center'
                    });
                }
            },
            error(res) {
                popup.note(res.message ? res.message : '未知错误，请稍后重试', {
                    closeTime: 1500,
                    position: 'center'
                });
            }
        });
    });
}

function redirect() {
    window.location.replace('/mpt/pusher/pusher-products.html');
}
