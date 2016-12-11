
import common from 'unit/common/js/common/common.js';
const getSeckillList = () => (
    new Promise((resolve) => {
        const url = '//sapi.beibei.com/fightgroup/1-300-perseckill_get-.html';
        common.callAPI({
            url,
            noDialog: true,
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupPerSeckillGet',
            success: resolve
        });
    })
);

export default {
    getSeckillList
};
