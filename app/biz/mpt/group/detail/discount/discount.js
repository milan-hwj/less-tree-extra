/**
 * Created by shuizai on 16/9/29.
 */
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './discount.xtpl';

export default (data) => {
    $('#J_discount').append(new Xtemplate(tpl).render({ data }));
};