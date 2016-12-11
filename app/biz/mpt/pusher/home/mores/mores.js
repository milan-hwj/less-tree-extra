import common from 'unit/common/js/common/common';
import lazyloadCreater from '@beibei/lazyload';
import Xtemplate from 'xtemplate/lib/runtime';
import _ from 'lodash';
import tpl from './mores.xtpl';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import './mores.less';

const lazyload = lazyloadCreater({ useWebp: true });
const mores = {
    init: (iid, uid, eventId) => {
        mores.getDate(iid, uid, eventId).then(mores.render);
    },
    getDate: (iid = 0, uid = 0, eventId = 0) => (
        new Promise((resolve, reject) => {
            common.callAPI({
                url: '//api.beibei.com/gateway/route.html',
                type: 'GET',
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    method: 'beibei.recom.list.get',
                    scene_id: 'h5_pintuan_detail_recom',
                    event_id: eventId,
                    iid,
                    uid
                },
                cache: true,
                noDialog: true,
                success: resolve,
                error: reject
            });
        })
    ),
    render: (resp) => {
        const data = mores.format(resp);
        $('.mores .list').append(new Xtemplate(tpl).render({ data }));
        lazyload.getLazyImg();
    },
    format: (resp) => {
        const result = resp.recom_items;
        _.each(result, (item) => {
            const price = mores.price(item.price);
            _.extend(item, {
                img:imageConvert.format320(item.img),
                priceInt: price.priceInt,
                priceDec: price.priceDec,
                originPrice: (parseInt(item.price_ori, 10) / 100).toFixed(2),
                link: `//m.beibei.com/mpt/group/detail.html?iid=${item.iid}`
            });
        });

        return result;
    },
    price: (num) => {
        const tempPrice = (num / 100).toString().split('.');
        return {
            priceInt: tempPrice[0],
            priceDec: tempPrice[1] ? `.${tempPrice[1]}` : ''
        };
    }
};

export default mores;
