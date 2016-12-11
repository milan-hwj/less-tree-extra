import common from 'unit/common/js/common/common.js';

/**
 * @desc    通用取数据接口
 * @author  wenjun.hwj@husor.com.cn
 * @date    16/10/11
 */ 
const requestHistory = {};
const getDataFromGaea = (id, isJSONP) => {
    const $data = $('#' + id);
    const loaded = $data.attr('loaded');
    let data_arr = '';
    let data_json = {};
    
    if (loaded !== null) {
        data_arr = $data.html();
        try {
            data_json = JSON.parse(data_arr);
            if (data_json) {
                return data_json;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    } else {
        return false;
    }
}
const callAPI = (opt) => {
    const data = getDataFromGaea(opt.id, !!opt.jsonpCallback);
    if(!data ||
        (opt.once && requestHistory[opt.id])) {
        // 前端重新获取:
        // 1 gaea无数据或数据错误 
        // 2 once === true, 代表该接口数据只在gaea取一次
        common.callAPI(opt);
    } else if (opt.success) {
        opt.success(data);
    }
    requestHistory[opt.id] = true;
}

export default {
    callAPI
};
