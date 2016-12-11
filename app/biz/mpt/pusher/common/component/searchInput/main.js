/**
 * @desc    贝贝推手-搜索输入框
 * @author  wenjun.he@husor.com.cn
 * @date    16/09/10
 * @usega   import searchInput from 'xxx/common/component/pusher-foot/searchInput';
 *          const input = searchInput({
 *              style: 'custom-search-input', // 自定义样式
 *              container: $('xxx'), // 容器
 *              onCancel: () => {} // 点击取消按钮事件
 *              onSearch: () => {} // 确认搜索事件
 *          });
 *          input.clear(); // 清空内容
 *          input.setInputValue('xxx'); // 设置值
 *          input.getInputValue(); // 获取值
 *          input.cancel(); // 取消搜索
 */
require('./index.less');
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';

class SearchInput {
    constructor(opt) {
        // 初始化
        this.opt = opt;
        this.render(opt);
        this.bindEvent(opt);
    }
    render(opt) {
        // 渲染
        this.$tpl = $(new Xtemplate(tpl).render(opt));
        opt.container.append(this.$tpl);
    }
    bindEvent(opt) {
        const clearBtn = this.$tpl.find('.clear-btn');
        const cancelBtn = this.$tpl.find('.cancel-btn');
        const input = this.$tpl.find('input');
        this.$tpl.find('form').submit((e) => {
            e.preventDefault();
        });
        // 搜索事件
        input.on('search', () => {
            const inputVal = input.val().trim();
            if (inputVal === '') {
                // popup('请输入关键字进行搜索!');
            } else {
                opt.onSearch();
                this.hideKeyboard();
            }
        }).on('focus', () => {
            // 获取焦点
            if (!this.$tpl.hasClass('active')) {
                this.$tpl.addClass('active');
            }
        });
        // clearBtn 显隐
        input.on('keyup', (e) => {
            const inputVal = $(e.target).val();
            if (inputVal === '') {
                clearBtn.hide();
            } else {
                clearBtn.show();
            }
        });
        // 取消搜索
        cancelBtn.on('click', this.cancel.bind(this));
        // 清空内容
        clearBtn.on('click', () => {
            this.setInputValue('');
            clearBtn.hide();
        });
    }
    getInputValue() {
        return this.$tpl.find('input').val();
    }
    setInputValue(val) {
        this.$tpl.find('input').val(val);
    }
    cancel() {
        // 退出搜索
        this.$tpl.removeClass('active');
        this.$tpl.find('input').val(''); // 清空值
        this.$tpl.find('.clear-btn').hide(); // 清空按钮消失
        this.opt.onCancel(); // 回调
    }
    hideKeyboard() {
        // 隐藏输入框
        // http://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
    
        // this set timeout needed for case when hideKeyborad
        // is called inside of 'onfocus' event handler
        setTimeout(() => {
            // creating temp field
            const field = document.createElement('input');
            field.setAttribute('type', 'text');
            // hiding temp field from peoples eyes
            // -webkit-user-modify is nessesary for Android 4.x
            field.setAttribute('style', 'position:absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left:0px;');
            document.body.appendChild(field);
            // adding onfocus event handler for out temp field
            field.onfocus = () => {
                // this timeout of 200ms is nessasary for Android 2.3.x
                setTimeout(() => {
                    field.setAttribute('style', 'display:none;');
                    setTimeout(() => {
                        document.body.removeChild(field);
                        document.body.focus();
                    }, 14);
                }, 100);
            };
            // focusing it
            field.focus();
        }, 50);
    }
}

const creater = (opt) => {
    return new SearchInput(opt);
};
export default creater;
