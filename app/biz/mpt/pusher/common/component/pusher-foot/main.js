/**
 * @desc    贝贝推手-底部导航条
 * @author  wenjun.he@husor.com.cn
 * @date    16/08/02
 * @usega   import footer from 'xxx/common/component/pusher-foot/main';
 *          footer.render('makeMoney');
 */
require('./index.less');
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';

class Footer {
    constructor() {
        // 初始化
        const urlPrefix = '//h0.hucdn.com/open/';
        this.opt = [{
            key: 'makeMoney',
            title: '我要赚钱',
            normalUrl: `${urlPrefix}201631/913685dc82c599d4_72x72.png`,
            activeUrl: `${urlPrefix}201631/77bf9cb99117f97c_72x72.png`,
            url: 'http://www.baidu.com'
        }, {
            key: 'progress',
            title: '成团进度',
            normalUrl: `${urlPrefix}201631/a572d6162cd3a789_72x72.png`,
            activeUrl: `${urlPrefix}201631/ff075a6e9ceaa0ad_72x72.png`,
            url: ''
        }, {
            key: 'withdrawals',
            title: '我要提现',
            normalUrl: `${urlPrefix}201631/b4c50f145654b4c9_72x72.png`,
            activeUrl: `${urlPrefix}201631/08cc6e7d47c1f54f_72x72.png`,
            url: ''
        }];
    }
    render(active = 'makeMoney') {
        // 渲染
        const tplStr = new Xtemplate(tpl).render({
            opt: this.opt,
            active
        });
        $('body').append(tplStr);
    }
}

const instance = new Footer();
export default instance;
