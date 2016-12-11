import './index.less';

export default (function cartAnimation() {
    const hint = {
        to: null,
        isShow: false,
        show() {
            $('.cart-hint').css('height', '1.7rem')
                .css('font-size', '.5rem');
            this.isShow = true;
        },
        hide() {
            $('.cart-hint').css('height', '0');
            this.isShow = false;
        },
        go() {
            if (!this.isShow) {
                this.show();
            }
            if (this.to) {
                clearTimeout(this.to);
            }
            this.to = setTimeout(() => {
                this.hide();
            }, 3500);
        }
    };
    const ball = {
        ot: null,
        compute() {
            const $window = $(window);

            return {
                begin: {
                    top: `${($window.height() - 90) * 0.38}px`,
                    left: `${$window.width() * 0.64}px`,
                    width: '3.2rem',
                    height: '3.2rem'
                },
                end: {
                    top: `${$window.height() - 90}px`,
                    left: `${$window.width() * 0.1}px`,
                    width: '0',
                    height: '0'
                }
            };
        },
        getImage(imgSrc) {
            // 获取当前显示的图片
            const img = new Image();
            img.src = imgSrc;
            return img;
        },
        go(imgSrc) {
            $('.cart-ball').remove();
            const c = this.compute();
            const img = this.getImage(imgSrc);
            const $b = $('<div class="cart-ball"></div>');
            if (this.ot) {
                clearTimeout(this.ot);
            }
            $b.append(img).css(c.begin).appendTo('body');
            setTimeout(() => {
                $b.css(c.end);
                this.ot = setTimeout(() => {
                    $('.cart-ball').remove();
                    hint.go();
                }, 1000);
            }, 20);
        }
    };

    return {
        go(src) {
            ball.go(src);
        },
        show() {
            const $hint = $('#J_cart-hint');
            $hint.removeClass('hidden');
            window.setTimeout(() => {
                $hint.addClass('hidden');
            }, 3000);
        }
    };
}());
