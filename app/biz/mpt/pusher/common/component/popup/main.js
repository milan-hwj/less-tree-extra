/**
 * @desc    贝贝推手-通知弹窗
 * @author  wenjun.he@husor.com.cn
 * @date    16/08/02
 * @usega   import footer from 'xxx/common/component/pusher-foot/main';
 *          footer.render('makeMoney');
 */
require('./index.less');

import _ from 'lodash';
import popup from '@beibei/popup';
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';

class CustomPopup {
    constructor(opt) {
        // 初始化
        this.opt = _.extend({
            contents: [],
            closeable: true,
            style: 'custom-popup',
            noTitle: !opt.title
        }, opt);

        if(!_.isFunction(this.opt.contents)) {
            this.createPopup();
        }
    }
    createPopup() {
        let contents = this.opt.contents;
        if(_.isFunction(this.opt.contents)) {
            contents = this.opt.contents();
        }
        this.popupInstance = popup(new Xtemplate(tpl).render(_.extend({}, this.opt, {
            contents
        }))).hide();
        this.confirm();
    }
    updateContents() {
        if(_.isFunction(this.opt.contents)) {
            const contents = this.opt.contents();
            this.popupInstance.$contnet.find('ul').html(
                $(new Xtemplate(tpl).render(_.extend({}, this.opt, {
                    contents
                }))).find('ul').html()
            );
        }
    }
    show() {
        if(!this.popupInstance) {
            this.createPopup();
        }
        this.popupInstance.show();
        return this;
    }
    hide() {
        this.popupInstance.hide();
        return this;
    }
    remove() {
        this.popupInstance.remove();
        return this;
    }
    confirm() {
        const el = this.popupInstance.$contnet.find('.btn');
        el.on('click', () => {
            this.popupInstance.hide();
        });
        return this;
    }
}

const creater = opt => new CustomPopup(opt);
export default creater;
