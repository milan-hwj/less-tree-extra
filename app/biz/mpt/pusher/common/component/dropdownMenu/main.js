/**
 * @desc    下拉菜单
 * @date    16/08/30
 * @usega   import dropdownMenu from 'dropdownMenu';
 *          dropdownMenu({
 *              $trigger: $dom,
 *              $menuContainer: $dom,
 *              items: [{
 *                  name: '按照xxx排序',
 *                  key: 'sortByxxx'
 *              }],
 *              itemOnClick: (key) => {
 *
 *              }
 *          });
 */
require('./index.less');
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './template.xtpl';

class DropdownMenu {
    constructor(opt) {
        this.initDom(opt.$trigger, opt.$menuContainer);
        this.initPopup(opt.$menuContainer, opt.items);
        this.bindEvent(opt);
        this.isOpen = false;
    }
    initDom($trigger, $menuContainer) {
        $trigger.html('排序<i class="ico-arrow-down"></i>');
        $menuContainer.addClass('hidden');
    }
    initPopup($container, items) {
        $container.html(
            new Xtemplate(tpl).render({
                items
            })
        );
    }
    bindEvent(opt) {
        opt.$trigger.on('click', (event) => {
            // 点击展示或收起
            if (this.isOpen) {
                opt.$trigger.removeClass('sort-open');
                opt.$menuContainer.addClass('hidden');
            } else {
                opt.$trigger.addClass('sort-open');
                opt.$menuContainer.removeClass('hidden');
            }
            this.isOpen = !this.isOpen;
            //打点
            // statistics.sendLog({
            //     et: 'click',
            //     entity_type: 'nav',
            //     json: {
            //         block_name: '导航栏-排序'
            //     }
            // });
        });
        opt.$menuContainer.on('click', '.item', (event) => {
            // 菜单项点击
            const $this = $(event.target).closest('.item');
            const key = $this.attr('data-sort');
            $this
                .addClass('current')
                .siblings()
                .removeClass('current');
            // 隐藏下拉菜单
            setTimeout(function() {
                opt.$menuContainer.addClass('hidden');
                opt.$trigger.removeClass('sort-open');
            }, 100);
            this.isOpen = false;
            opt.itemOnClick(key);
            //打点
        });
    }
}

const creater = (opt) => {
    return new DropdownMenu(opt);
};
export default creater;
