

import common from 'unit/common/js/common/common.js';

const getWinnerList = (iid, option) => (
    new Promise((resolve, reject) => {
        const page_size = option && option.page_size || 10;
        const page = option && option.page || 1;
        const biz_status = option && option.biz_status;
        const biz_type = option && option.biz_type;
        common.callAPI({
            type: 'get',
            method: 'beibei.fightgroup.winners.get',
            data: {
                iid,
                biz_status,
                biz_type,
                page_size,
                page
            },
            dataType: 'json',
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

const getRecomLottery = (iid, option) => (
    new Promise((resolve, reject) => {
        let param = '';
        if (option && option.biz_type) {
            param = `?biz_type=${option.biz_type}`;
        }
        const url = `//sapi.beibei.com/fightgroup/lottery_recom/${iid}.html${param}`;
        common.callAPI({
            url,
            type: 'get',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupLotteryRecomGet',
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
    getWinnerList,
    getRecomLottery
};



