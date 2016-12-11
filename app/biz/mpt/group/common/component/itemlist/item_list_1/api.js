

import common from 'app/biz/common/gaea/preload';

export default {
    getGroupList: ({ page, pagesize, tag, cat }) => (
        new Promise((resolve, reject) => {
            const url = `//sapi.beibei.com/item/fightgroup/${page}-${pagesize}-${tag}-${cat}.html`;
            common.callAPI({
                id: 'getGroupListFromGaea',
                once: true,
                url,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupItemGet',
                cache: true,
                noDialog: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    getTryItemList: ({ type }) => (
        new Promise((resolve, reject) => {
            const url = `//sapi.beibei.com/fightgroup/trial/1-200-${type}.html`;
            common.callAPI({
                id: 'getTryItemListFromGaea',
                once: true,
                url,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: `BeibeiFightgroupTrialGet${type}`,
                cache: true,
                noDialog: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    getFreeTrialList: ({ page, pagesize }) => (
        new Promise((resolve, reject) => {
            const url = `//sapi.beibei.com/fightgroup/free_trial/${page}-${pagesize}.html`;
            common.callAPI({
                url,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupFreeTrialGet',
                cache: true,
                noDialog: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    getNewUserOnlyList: ({ iid }) => (
        new Promise((resolve, reject) => {
            const url = `//sapi.beibei.com/fightgroup/trial_lottery/${iid}.html`;
            common.callAPI({
                url,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupTrialLotteryGet',
                cache: true,
                noDialog: true,
                success(res) {
                    resolve(res);
                },
                error(res) {
                    reject(res);
                }
            });
        })),
    // 1元购
    getSeckillList: ({ page, pagesize, tag, cat }) => (
        new Promise((resolve, reject) => {
            const url = `//sapi.beibei.com/item/fightgroup/${page}-${pagesize}-${tag}-${cat}.html`;
            common.callAPI({
                id: 'getSeckillFromGaea',
                once: true,
                url,
                type: 'get',
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupItemGet',
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

