import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './seckill_list.xtpl';
import lazyloadModule from '@beibei/lazyload';
import popup from '@beibei/popup';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import './seckill_list.less';

const lazyload = lazyloadModule({
    useWebp: true
});
class SeckillList {
    render(data, $el) {
        data.fight_items.forEach((list) => {
            list.items.forEach((item)=> {
                item.img = imageConvert.format200(item.img);
            });
        });
        const html = new Xtemplate(tpl).render({ data: data.fight_items });
        $el.append(html);
        const $process = $('.J_processs');
        $process.forEach(function (cur, index) {
            const $cur = $(cur);
            $cur.css('width', $cur.data('precent') * (227 / 345) + '%');
        });
        this.bindSoldoutEvent(data.sold_out_tip);
        lazyload.getLazyImg();

    }
    bindSoldoutEvent(tips) {
        $('.J_item-list').on('click', '.J_end', function (event) {
            event.preventDefault();
            popup.note(tips, {
                mask: false
            });
        });
    }

}

export default SeckillList;