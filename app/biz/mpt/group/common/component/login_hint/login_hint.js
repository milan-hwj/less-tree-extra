
import popup from '@beibei/popup';
import login from 'unit/common/js/login/login2';
import './login_hint.less';

const show = () => {
    popup.confirm('亲，需要先登录噢', () => {
        login.login(() => {
            window.location.reload();
        });
        show();
    }, () => {
        window.location.href = '/gaea_pt/mpt/group/channel.html?beibeiapp_info={%22target%22:%20%22bb/pintuan/home%22}';
    }, {
        actionConfig: [{
            text: '去逛逛'
        }, {
            text: '去登录'
        }]
    });
};

export default {
    show
};
