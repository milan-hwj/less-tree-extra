/**
 * Created by shuizai on 16/9/12.
 */

import Xtemplate from 'xtemplate/lib/runtime';
import env from '@beibei/env';
import livesTpl from './lives.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert.js';
import './lives.less';

// 根据评分判断高低
export const getDesc = (score) => {
    if (score >= 4.5) {
        return `<p class="high">${score}</p><p><span class="tag high">高</span></p>`;
    }
    //if (score >= 4.6) {
    //    return `<span class="mid"><i>${score}</i> <label>平</label></span>`;
    //}
    return `<p class="low">${score}</p><p class="tag low">低</p>`;
};

// 渲染专场信息
export default (data) => {
    Object.assign(data, {
        logo: imageConvert.format200(data.logo),
        shippingDesc: getDesc(data.shipping_rate),
        shipmentDesc: getDesc(data.shipment_rate),
        totalDesc: getDesc(data.total_rate)
    });
    $('#J_lives').html(new Xtemplate(livesTpl).render({ data }));

    if (env.app.isBeibei && data.seller_uid) {
        $('.J_liveInfo').on('tap', () => {
            window.location.href = `http://www.beibei.com?beibeiapp_info={"target":"shop_home","uid":"${data.seller_uid}","data":"1"}`;
        });

        $('#J_enter').removeClass('hidden');
    }
};