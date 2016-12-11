/**
 * @desc    分享遮罩层
 * @author  wenjun.he@husor.com.cn
 * @date    16/10/20
 * @usega   import Mask from 'xxx';
 *          const m = Mask({
 *              tip: '分享给朋友来参团',
 *              content: '分享参团' // 也可以传入dom string, 如 <div>分享参团</div>
 *          });
 *          m.show();
 *          m.hide();
 */
require('./index.less');
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';

class Mask {
    constructor(opt) {
        // 初始化
        this.render(opt);
        this.bindEvent();
    }
    render(opt) {
        // 渲染
        this.$main = $(new Xtemplate(tpl).render(opt)).hide();
        $('body').append(this.$main);
    }
    bindEvent() {
        this.$main.on('click', (event) => {
            event.preventDefault();
            $(event.currentTarget).hide();
        });
    }
    show() {
        this.$main.show();
    }
    hide() {
        this.$main.hide();
    }
}

const creater = (opt) => {
    return new Mask(opt);
};
export default creater;
