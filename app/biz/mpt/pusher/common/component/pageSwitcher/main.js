/**
 * @desc    贝贝推手-页面切换组件
 * @author  wenjun.he@husor.com.cn
 * @date    16/09/09
 * @usega   import pageSwitcher from 'xxx/common/component/pageSwitcher/main';
 *          // 注册页面
 *          pageSwitcher.register('index', {
 *              pageIn: () => {
 *                  // 从其他页面切换到本页面的回调
 *              },
 *              pageOut: (args) => {
 *                  // 离开页面时的回调
 *              }
 *          },
 *          true // 传入的pageName是否为当前页面
 *          );
 *          // 切换到pageName, 可以带数据给即将跳转的页面
 *          pageSwitcher.switchTo(pageName, args);
 */
class PageSwitcher {
    constructor() {
        // 初始化
        this.pageOpt = {}; // 记录page名称、载入回调用、退出回调
    }
    register(pageName, opt, isCurrentPage) {
        if (isCurrentPage) {
            this.currentPage = pageName;
        }
        this.pageOpt[pageName] = opt;
    }
    switchTo(pageName, args) {
        if (pageName === this.currentPage) {
            return false;
        }
        const opt = this.pageOpt;
        if (opt[this.currentPage] && opt[this.currentPage].pageOut) {
            opt[this.currentPage].pageOut();
        }
        if (opt[pageName] && opt[pageName].pageIn) {
            opt[pageName].pageIn(args);
        }
        this.currentPage = pageName;
        return true;
    }
}

const instance = new PageSwitcher();
export default instance;
