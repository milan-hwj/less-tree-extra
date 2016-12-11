/**
 * @desc    推手商品页-搜索
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/09/08
 */
require('./search.less');
import pageSwitcher from '../../common/component/pageSwitcher/main';
import emptyPage from '../../common/component/emptyPage/main';

const main = {
    init: () => {
        pageSwitcher.register('search', {
            pageIn: main.pageIn,
            pageOut: main.pageOut
        });
    },
    pageOut: () => {
        // 页面退出动画
        $('body')
            .removeClass('pusher-index-animation-tosearch')
            .addClass('pusher-index-animation-toindex');
        $('.products').html('');
    },
    pageIn: () => {
        // 页面载入动画
        $('body')
            .removeClass('pusher-index-animation-toindex')
            .addClass('pusher-index-animation-tosearch');
    },
    renderEmpty: () => {
        emptyPage({
            $container: $('.products'),
            style: 'custom-empty-page',
            contents: [
                '暂未搜索到您需要的商品',
                '再去列表页逛逛把~'
            ],
            btnTitle: '去逛逛',
            onclick: () => {
                // 回到搜索页
                pageSwitcher.switchTo('index');
            }
        });
    }
};
main.init();
export default main;
