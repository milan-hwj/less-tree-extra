import popup from '@beibei/popup';
import FastClick from '../../../../../../../unit/common/js/fastclick/fastclick.js';
import './amount.less';

(function ($, window, undefined) {
    if (typeof $ === 'undefined') {
        throw new Error('zepto.amount\'s script requires Zepto');
    }
    const instance = {};
    let id = 1;

    const defaults = {
        max: 9999,
        min: 1,
        num: 1,
        name: 'quantity',
        step: 1,
        onPlus() {
        },
        onMinus() {
        },
        onChange() {
        }
    };

    function init(options) {
        var _this = this;

        _this.settings = $.extend(defaults, options);
        _this.num = _this.settings.num;
        _this.bindEvents();
        _this.refresh();
    }

    function Amount($this, option) {
        this.$el = $this;
        init.call(this, option);
    }

    $.extend(Amount.prototype, {
        constructor: Amount,
        bindEvents: function () {
            const $el = this.$el;
            const _this = this;

            // 兼容Fastclick的amd与cmd不统一
            const attach = FastClick.attach || FastClick;
            attach($el.find('.J_amount-minus')[0]);
            attach($el.find('.J_amount-plus')[0]);

            $el.on('tap', '.J_amount-minus', (e) => {
                if (_this.num > _this.settings.min) {
                    _this.num -= _this.settings.step;
                }
                _this.refresh();
                _this.settings.onMinus.call(_this);
                _this.settings.onChange.call(_this);
            });

            $el.on('tap', '.J_amount-plus', (e) => {
                const noteText = _this.settings.max ?
                    `每人最多只能购买${_this.settings.max}件` : '来晚了：所选商品已抢光';

                if (_this.num === _this.settings.max) {
                    popup.note(noteText, {
                        closeTime: 1500,
                        position: 'center'
                    });
                }

                if (_this.num < _this.settings.max) {
                    _this.num += _this.settings.step;
                }

                _this.refresh();
                _this.settings.onPlus.call(_this);
                _this.settings.onChange.call(_this);
            });
        },
        refresh: function () {
            this.$el.find('.J_amount').html(this.num);
        },
        setMax: function (max) {
            var _this = this;
            if (_this.settings.max == max) {
                return
            }
            if (_this.num > max) {
                _this.num = max;
                _this.refresh();
                _this.settings.onChange.call(_this);
            } else if (_this.num === 0 && max !== 0) {
                _this.num = 1;
                _this.refresh();
                _this.settings.onChange.call(_this);
            }
            _this.settings.max = max;
        },
        getNum: function () {
            return this.num;
        }
    });


    $.fn.amount = function (option) {
        const $this = $(this);
        if (!$this.data("amount")) {
            instance[id] = new Amount($this, option);
            $this.data("amount", id);
            id++;
        }
        return instance[$this.data('amount')];
    };

    $.fn.amount.version = '1.0.0';
}(Zepto, window));



