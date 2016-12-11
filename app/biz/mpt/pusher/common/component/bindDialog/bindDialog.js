import Xtemplate from 'xtemplate/lib/runtime';
import './index.less';
import tpl from './tpl.xtpl';
import bindDialog from '../../../../../../../src/js/mp/pintuan/unit/bindDialog.js';
import popup from '@beibei/popup';

(function () {
    const $tpl = $(new Xtemplate(tpl).render());
    $('body').append($tpl);
    const codeInput = $('#J_Code');
    $('#J_btn-confirm').on('touchend', (e) => {
        const code = codeInput.val();
        if (code.length !== 4) {
            popup.note('请输入您收到的4位数验证码', { 'mask': false });
            e.stopPropagation();
        }
    });
}());

export default bindDialog;
