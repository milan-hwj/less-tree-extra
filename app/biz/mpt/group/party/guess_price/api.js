
import common from 'unit/common/js/common/common';

const getQuestion = () => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.fightgroup.guess.item.get';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.item.get&version=5804bbeaef379cc87062ec1e&mock_index=0';
        common.callAPI({
            url,
            noDialog: true,
            dataType: 'json',
            success: resolve
        });
    })
);

const submitAnswer = ({ iid, price }) => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.fightgroup.guess.result.commit';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.result.commit&version=5805e5f5fd8d24c57585e544&mock_index=0';
        common.callAPI({
            url,
            type: 'POST',
            noDialog: true,
            data: {
                iid,
                price
            },
            dataType: 'json',
            success: resolve
        });
    })
);


const addChance = () => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.fightgroup.guess.chance.add';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.result.commit&version=5805e5f5fd8d24c57585e544&mock_index=0';
        common.callAPI({
            url,
            noDialog: true,
            dataType: 'json',
            success: resolve
        });
    })
);

const getGuessNotice = () => (
    new Promise((resolve) => {
        const url = '//sapi.beibei.com/fightgroup/guess_notice/1-20.html';
        // const url = 'http://devtools.husor.com/hif/mock?api=beibei.fightgroup.guess.notice.get&version=5805f1d7fd8d24c57585e54a&mock_index=0';
        common.callAPI({
            url,
            noDialog: true,
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupGuessNoticeGet',
            success: resolve
        });
    })
);

const addItemFavor = iid => (
    new Promise((resolve) => {
        const url = '//api.beibei.com/mroute.html?method=beibei.user.favor.item.add';
        common.callAPI({
            url,
            type: 'POST',
            data: {
                iid
            },
            noDialog: true,
            dataType: 'json',
            success: resolve
        });
    })
);

export default {
    getQuestion,
    submitAnswer,
    addChance,
    getGuessNotice,
    addItemFavor
};
