/**
 * Created by shuizai on 16/9/30.
 */
import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './rules.xtpl';
import './rules.less';

export default (data) => {
    $('#J_intro').append(new Xtemplate(tpl).render({ data }));
};