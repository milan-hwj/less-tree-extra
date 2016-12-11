/**
 * Created by shuizai on 16/10/9.
 */
import common from '../../../common/gaea/preload.js';

export default {
    // 获取拼团商品详情页 两个待成团的数据
    getRecGroups: iid => (
        new Promise((resolve, reject) => {
            common.callAPI({
                //id: 'getRecGroups',
                url: `//sapi.beibei.com/fightgroup/visitor_recom/${iid}-1.html`,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupRecommendGet',
                noDialog: true,
                cache: true,
                success(res) {
                    resolve(res.recom_fightgroups);
                },
                error(res) {
                    reject(res);
                }
            });
        })
    ),
    getItemDetail: iid => (
        new Promise((resolve, reject) => {
            common.callAPI({
                id: 'getItemDetail',
                url: `//sapi.beibei.com/item/detail/${iid}.html?biz=pintuan`,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiItemDetailGet',
                cache: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })
    ),
// 获取评论接口
    getReviews: iid => (
        new Promise((resolve, reject) => {
            common.callAPI({
                id: 'getReviews',
                url: `//sapi.beibei.com/item/rate/0-${iid}-1-10.html`,
                type: 'get',
                dataType: 'jsonp',
                cache: true,
                jsonpCallback: 'BeibeiItemRateGet',
                success(res) {
                    resolve(res, iid);
                },
                error(res) {
                    reject(res);
                }
            });
        })
    ),
    getNewestStock: iid => (
        new Promise((resolve, reject) => {
            common.callAPI({
                url: `//sapi.beibei.com/item/stock/${iid}.html`,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiItemStockGet',
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
    ),
    getPromotion: ({ iid, uid }) => (
        new Promise((resolve, reject) => {
            common.callAPI({
                url: '//api.beibei.com/mroute.html?method=beibei.item.promotion.activity.get',
                // url: 'http://devtools.husor.com/hif/mock?api=beibei.item.promotion.activity.get&version=57e8c02aef379cc87062eb00&mock_index=0',
                type: 'get',
                dataType: 'json',
                noDialog: true,
                data: {
                    iid,
                    uid: (uid || 0)
                },
                cache: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })
    )
};