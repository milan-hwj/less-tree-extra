import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './index.xtpl';
import './index.less';

let renderStatus = false;

const render = () => {
    const bindEvent = () => {
        $('#J_showShare').on('click', () => {
            $('#J_share-mask').removeClass('hidden');
            $('#J_share_success').addClass('hidden');
        });
    };
    if (!renderStatus) {
        $('body').append(new Xtemplate(tpl).render());
        renderStatus = true;
    } else {
        $('#J_share_success').removeClass('hidden');
    }
    bindEvent();
};

export default {
    render
};
