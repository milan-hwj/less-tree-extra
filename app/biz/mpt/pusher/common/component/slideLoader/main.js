/**
 * @desc    贝贝推手-通用懒加载控制器
 * @author  wenjun.he@husor.com.cn
 * @date    16/08/05
 * @usega   import LazyControll from 'xxx/common/component/slideLoader/main';
 */
require('./index.less');
import _ from 'lodash';

const controllers = [];

class LazyLoaderController {
    constructor(opt) {
        // 初始化
        _.extend(this, {
            pageIndex: 1, // 当前页码
            pageSize: 20, // 每页条数
            isActive: true, // 是否激活，非激活状态不会响应scroll事件
            loading: false, // 加载标志
            opening: false, // 正在开团标志
            isOver: false, // 是否已加载所有数据
            closeLoad: false, // 关闭懒加载事件
            $loading: $('<div class="pusher-loadstatus"></div>')
                .insertAfter(opt.$container)
        }, opt);
        this.bindLoadMore();
    }
    bindLoadMore() {
        const $win = $(window);
        const $doc = $(document);
        $win.on('scroll', () => {
            if(!this.isActive) {
                return;
            }
            if (this.closeLoad) {
                return;
            }
            if (this.loading || this.isOver) {
                return;
            }
            if ($win.scrollTop() + $win.height() > $doc.height() - 100) {
                this.$loading.html('正在加载...').show();
                this.loading = true;
                const opt = [
                    this.pageIndex + 1,
                    this.pageSize,
                    this.updateStatus.bind(this)
                ];
                if (this.context) {
                    this.loadDataHandle.call(
                        this.context,
                        ...opt
                    );
                } else {
                    this.loadDataHandle(...opt);
                }
            }
        });
    }
    close() {
        // 关闭滑动懒加载
        this.closeLoad = true;
    }
    updateStatus(resp) {
        // 请求回调
        this.loading = false;
        if (!resp) {
            // 请求失败
            return;
        }
        this.pageIndex = resp.page;
        if (resp.page * resp.page_size >= resp.total_count) {
            // 没有更多
            this.isOver = true;
            if(resp.page !== 1) {
                this.$loading.html('没有啦').show();
            } else {
                this.$loading.hide();
            }
        } else {
            this.isOver = false;
            this.$loading.hide();
        }
    }
    active() {
        _.each(controllers, (instance) => {
            instance.isActive = false;
        });
        controllers[this.index].isActive = true;
    }
}

let index = 0;
const creater = (opt) => {
    opt.index = index;
    const instance = new LazyLoaderController(opt);
    controllers.push(instance);
    index++;

    return instance;
};
export default creater;
