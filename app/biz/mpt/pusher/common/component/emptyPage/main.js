/**
 * @desc    贝贝推手-通用空页面
 * @author  wenjun.he@husor.com.cn
 * @date    16/08/08
 * @usega   import emptyPage from 'xxx/common/component/emptyPage/main';
 *          emptyPage({
 *             // 所有属性均为非必需
 *             container: $('xxx'), // 建议配置, default: $('body')
 *             style: 'className', // 自定义class将会加在页面组件最外层
 *             contents: '显示内容',
 *             img: '图片路径',
 *             href: '按钮跳转地址',
 *             onclick: '按钮事件' // 配置后将会覆盖href效果
 *          });
 */
require('./index.less');
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';
import _ from 'lodash';

class EmptyPage {
    constructor(opt) {
        // 初始化
        this.opt = _.extend({
            $container: $('body'),
            img: '//h0.hucdn.com/open/201632/6a7d65c1055a37b6_200x200.png',
            contents: [
                '钱包空空',
                '快去邀请好友来参团~'
            ],
            href: '/mpt/pusher/pusher-products.html',
            btnTitle: '去开团'
        }, opt);
        if (opt.onclick) {
            this.opt.href = '#';
        }
        this.render();
    }
    render() {
        // 渲染
        const tplStr = new Xtemplate(tpl).render(this.opt);
        const $container = this.opt.$container;
        $container.append(tplStr);
        if (this.opt.onclick) {
            // 自定义点击事件
            $container.find('.empty-page .btn').on('click', this.opt.onclick);
        }
    }
}

const creater = (opt) => {
    return new EmptyPage(opt);
};
export default creater;
