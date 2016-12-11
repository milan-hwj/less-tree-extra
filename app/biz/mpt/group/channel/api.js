// import common from 'unit/common/js/common/common.js';
import common from '../../../common/gaea/preload.js';

const getAds = adId => (
    new Promise((resolve, reject) => {
        const url = `http://sapi.beibei.com/resource/ads-android-${adId}.html`;
        common.callAPI({
            id: 'getAdsFromGaea',
            url,
            type: 'get',
            cache: true,
            noDialog: true,
            dataType: 'jsonp',
            jsonpCallback: 'ads',
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
            }
        });
    })
);

const getCategory = () => (
    new Promise((resolve, reject) => {
        const url = '//sapi.beibei.com/martgoods/category/fightgroup.html';
        common.callAPI({
            id: 'getCategoryFromGaea',
            url,
            type: 'get',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiMartgoodsCategoryGet',
            cache: true,
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
            }
        });
    })
);


export default {
    getAds,
    getCategory
};
