
import common from 'unit/common/js/common/common.js';

const loadList = ({ iid, group_index, page, PAGE_SIZE }) => (
    new Promise((resolve, reject) => {
        common.callAPI({
            method: 'beibei.fightgroup.duobao.winners.get',
            type: 'GET',
            noDialog: true,
            data: {
                iid,
                group_index,
                page,
                page_size: PAGE_SIZE
            },
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
    loadList
};
