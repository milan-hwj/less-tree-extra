
import common from 'unit/common/js/common/common.js';
const api = {
    // 获取拼团详情数据
    getPintuanDetail: (group_code) =>
        (new Promise((resolve, reject) => {
            common.callAPI({
                method: 'beibei.fightgroup.item.detail.get',
                noDialog: true,
                data: {
                    token: group_code
                },
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    // 详情页 获取最新库存
    getNewestStock: ({ iid, type }) =>
        (new Promise((resolve, reject) => {
            common.callAPI({
                url: `//sapi.beibei.com/item/stock/${iid}.html${type === 'home' ? `?iids=${iid}` : ''}`,
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
        }))
};

export default api;
