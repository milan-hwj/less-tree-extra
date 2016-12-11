import common from 'unit/common/js/common/common.js';

const loadList = ({ iid, page, PAGE_SIZE }) => (
    new Promise((resolve, reject) => {
        common.callAPI({
            method: 'beibei.fightgroup.duobao.groups.get',
            type: 'GET',
            noDialog: true,
            data: {
                iid,
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
const getDuobaoNotice = iid => (
    new Promise((resolve, reject) => {
        common.callAPI({
            url: `//sapi.beibei.com/fightgroup/duobao_notice/1-20-${iid}.html`,
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupDuobaoNoticeGet',
            cache: true,
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
    loadList,
    getDuobaoNotice
};
