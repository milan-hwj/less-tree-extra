
import common from 'unit/common/js/common/common';

const getGuessCouponItem = () => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.fightgroup.guess.coupon.item.get';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.coupon.item.get&version=580600a38b6538b963006567&mock_index=0';
        common.callAPI({
            url,
            noDialog: true,
            success: resolve
        });
    })
);

const getGuessCoupon = (event_id) => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.fightgroup.guess.coupon.get';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.coupon.get&version=580602a58b6538b96300656a&mock_index=0';
        common.callAPI({
            url,
            noDialog: true,
            data: {
                event_id
            },
            success: resolve
        });
    })
);


export default {
    getGuessCouponItem,
    getGuessCoupon
};
