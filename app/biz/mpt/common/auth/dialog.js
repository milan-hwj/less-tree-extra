import './dialog.less';
import Xtemplate from 'xtemplate/lib/runtime';

import common from 'unit/common/js/common/common';
import cookie from '@beibei/cookie';
import popup from '@beibei/popup';
import tpl from './dialog.xtpl';

import {
    lastShowTime,
    wxSourceToken,
    openidStorage
} from './tool.js';

class LoginDialog {
    constructor(options) {
        const defaults = {
            type: 1,
            token: '',
            callback(){
            }
        };
        this.options = Object.assign({}, defaults, options);
    }

    setCallback(CB) {
        this.options.callback = CB;
        return this;
    }

    destroy() {
        this.$el.remove();
        return this;
    }

    show() {
        if (this.$el) {
            this.$el.addClass('show');
        } else {
            this._render();
        }
        
        // 更新最后展示时间
        lastShowTime.update();

        return this;
    }

    hide() {
        this.$el.removeClass('show');
        return this;
    }

    _bindEvents() {
        // 取消
        this.$el.find('.J_login_cancel').on('touchend click', (event) => {
            event.stopPropagation();
            this.hide();
        });

        // 获取验证码
        this.$el.find('#J_login_code').on('touchend click', (e) => {
            e.stopPropagation();
            const $this = $(e.currentTarget);
            const _tel = this.$el.find('input[name=phone]').val();
            if ($this.hasClass('disabled')) {
                return
            }
            if (_tel.length !== 11) {
                popup.note('请输入以1开头的11位数字！', { 'mask': false });
                return
            }
            if (_tel.length === 11) {
                common.callAPI({
                    type: 'POST',
                    method: 'beibei.user.code.send',
                    data: {
                        key: 'quick_access',
                        tel: _tel.replace(/\s/g, '')
                    },
                    success: function (resp) {
                        if (resp.success) {
                            $this.removeClass('resend').addClass('disabled');
                            let i = 60;
                            (function timer() {
                                if (i <= 0) {
                                    $this.html('重新发送').removeClass('disabled').addClass('resend');
                                    return;
                                }
                                $this.html(i-- + 's后重发');
                                window.setTimeout(timer, 1000);
                            })();
                        }
                        popup.note(resp.message, { 'mask': false });
                    },
                    error: function () {
                        console.log("sendMessage error!");
                    }
                });
            }
        });

        this.$el.find('.J_login_submit').on('touchend click', () => {
            const _tel = this.$el.find('input[name=phone]').val().replace(/\s/g, ''); // 11位手机号码
            const _code = this.$el.find('input[name=code]').val(); // 短信验证码（线下测试时默认8888）
            const token = this.options.token;

            if (_tel && _code && token) {
                common.callAPI({
                    type: 'POST',
                    method: 'beibei.h5.quick.access',
                    data: {
                        token: token,
                        code: _code,
                        tel: _tel,
                        // 1表示特卖，7表示拼团；默认使用贝贝特卖公众号进行授权登录
                        wx_type: this.options.type
                    },
                    success: (resp) => {
                        // 注册／登录成功后，直接进行后续操作
                        if (resp.success) {
                            this.destroy();

                            // 清除token的cookie
                            wxSourceToken.clear();

                            openidStorage.setFromMap(resp.op_map);

                            if (typeof this.options.callback === 'function') {
                                this.options.callback();
                            }
                        } else {
                            // 注册／登录失败
                            popup.alert(resp.err_msg || resp.message);
                        }
                    },
                    error() {
                        throw new Error('quickRequest error!');
                    }
                });
            }
        });
    }

    _render() {
        this.$el = $(new Xtemplate(tpl).render({ data: this.options }));
        $('body').append(this.$el);
        this._bindEvents();
    }
}

export default LoginDialog;