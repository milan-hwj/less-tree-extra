// 头部

import Xtemplate from 'xtemplate/lib/runtime';
import tpl from './group_users.xtpl';
import './group_users.less';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';
import _ from 'lodash';

const render = function (data) {
    _.each(data.group_users, (item)=> {
        item.jpg = imageConvert.format100(item.jpg)
    });
    $('#J_container-details').append(new Xtemplate(tpl).render({ res: data }));
};

export default {
    render
};
