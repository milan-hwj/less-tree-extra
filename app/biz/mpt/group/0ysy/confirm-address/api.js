

import common from 'unit/common/js/common/common.js';

const getPintuanDetail = groupCode => (
    new Promise((resolve, reject) => {
        common.callAPI({
            method: 'beibei.fightgroup.item.detail.get',
            data: {
                token: groupCode
            },
            noDialog: true,
            success(res) {
                if (res.success) {
                    // 返回正确的数据
                    resolve(res);
                } else {
                    reject(res);
                }
            },
            error(res) {
                reject(res);
            }
        });
    })
);

export default {
    getPintuanDetail
};
