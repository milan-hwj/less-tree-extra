import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import Lazy from '@beibei/blazy';
import priceHandle from '../../util/priceHandle.js';
import Navmenu from './navmenu.js';
import common from '../../../../../../../unit/common/js/common/common';
import ptLog from '../../util/ptLog.js';
import './mores.less';
import imageConvert from 'unit/common/js/image_convert/image_convert';

import tpl from './tpl.xtpl';
import listTpl from './list.xtpl';
import navTpl from './nav.xtpl';


/**
 * 这里是options可传的参数
 * @param {boolean} [isSticky] navmenu是否吸顶
 * @param {number} [rid] 大数据打点的rid
 * @param {array} [sellerItems] 插入的置顶商品，由运营配置
 */

const params = {
    isLoading: false
};
let IID;
let rid;

const lazy = new Lazy({});

const catMap = {
    momthings: {
        name: '母婴',
        cid: '3_5_7'
    },
    house: {
        name: '百货',
        cid: '393_1285_1648'
    },
    children: {
        name: '童装',
        cid: '2_1230'
    },
    fooddrink: {
        name: '食品',
        cid: '328_1242'
    },
    beauty: {
        name: '美妆',
        cid: '591'
    },
    dress: {
        name: '服饰',
        cid: '6_449_562_571_1454_1455_1472_1485_1552'
    }
};

// 获取更多好团数据
const getMores = ({ iid }) =>
    (new Promise((resolve, reject) => {
        common.callAPI({
            url: `//sapi.beibei.com/item/fightgroup/more/${iid}.html`,
            type: 'GET',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupItemMoreGet',
            cache: true,
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
                console.log('getMores error! ');
            }
        });
    }));

// 获取更多好团数据 大数据接口
const bigDataGetMores = ({ event_id, iid, uid }) =>
    (new Promise((resolve, reject) => {
        common.callAPI({
            url: '//api.beibei.com/gateway/route.html',
            type: 'GET',
            xhrFields: {
                withCredentials: true
            },
            data: {
                method: 'beibei.recom.list.get',
                scene_id: 'h5_pintuan_detail_recom',
                event_id,
                iid,
                uid
            },
            noDialog: true,
            success(res) {
                resolve(res);
            },
            error(res) {
                reject(res);
                console.log('getMores error! ');
            }
        });
    }));

// 处理渲染list的数据
const processData = (data) => {
    if (data.fightgroup_items.length) {
        if (data.fightgroup_items.length % 2) {
            data.fightgroup_items.pop();
        }
        data.fightgroup_items.forEach((item) => {
            const price = priceHandle(item.group_price || item.price);
            Object.assign(item, {
                img: imageConvert.format320(item.img),
                priceInt: price.priceInt,
                priceDec: price.priceDec,
                originPrice: (item.price_ori || item.origin_price) / 100,
                formatNum: Math.floor(item.group_in_num / 10000)
            });
        });
    }
    return data;
};

// 商品打点
const clickPtLog = ({ $el, catName }) => {
    $el.on('click', '.J_mores-item', (e) => {
        const $item = $(e.currentTarget);
        const iid = $item.data('iid');
        const index = $item.index();
        ptLog.stat({
            et: 'click',
            rid,
            entity_type: 'item',
            entity_list: iid,
            json: {
                f_item_id: IID,
                block_name: 'mores_item',
                tab_name: catName,
                position: index
            }
        });
    });
};

// 切换list隐藏与展示
const switchHandle = (catName) => {
    params.catName = catName;
    $('#J_mores_list').find(`[data-cat=${catName}]`)
        .removeClass('hidden')
        .siblings()
        .addClass('hidden');
    lazy.revalidate();
};

// 渲染列表
const renderList = ({ data, catName }) => {
    catMap[catName].init = true;
    data = processData(data);
    const $el = $('#J_mores_list').find(`[data-cat=${catName}]`);
    $el.append(new Xtemplate(listTpl).render({ data }));
    clickPtLog({ $el, catName });
    switchHandle(catName);
};


// 获取品类列表
const getList = ({ catName, iid, cid }) =>
    (new Promise((resolve, reject) => {
        if (!catMap[catName]) {
            return;
        }
        if (params.isLoading) {
            return;
        }
        catMap[catName].page = catMap[catName].page || 1;
        const page = catMap[catName].page;
        params.isLoading = true;
        common.callAPI({
            url: `//sapi.beibei.com/fightgroup/item_more_by_cid/${iid}-${cid}-${page}-50.html`,
            type: 'GET',
            dataType: 'jsonp',
            jsonpCallback: 'BeibeiFightgroupItemMoreByCidsGet',
            success(res) {
                catMap[catName].page++;
                params.isLoading = false;
                if (res.fightgroup_items.length < 40) {
                    catMap[catName].isEnd = true;
                }
                resolve({ data: res, catName });
            },
            error(res) {
                reject(res);
                params.isLoading = false;
                console.log('getMores error! ');
            }
        });
    }));

const loadMore = () => {
    const $win = $(window);
    const $doc = $(document);
    $win.on('scroll', _.throttle(
            () => {
                const cat = catMap[params.catName];
                if ($win.scrollTop() + $win.height() > $doc.height() - 400) {
                    if (cat && cat.page < 5 && !cat.isEnd) {
                        getList({
                            catName: params.catName,
                            iid: IID,
                            cid: catMap[params.catName].cid
                        }).then(renderList).catch((e) => {
                            console.warn(e);
                        });
                    }
                }
            }, 80)
    );
};

// 切换tab回调
const switchTab = (el) => {
    const catName = $(el).data('cat');
    const cat = catMap[catName];

    ptLog.stat({
        et: 'click',
        rid,
        entity_type: 'item',
        entity_list: IID,
        json: {
            block_name: 'tab_click',
            tab_name: catName
        }
    });

    if (cat) {
        if (cat.init) {
            switchHandle(catName);
        } else {
            getList({ catName, iid: IID, cid: cat.cid }).then(renderList);
        }
    } else {
        // 切换到‘推荐’tab
        switchHandle('mores');
    }
};

// 渲染更多好团
const renderMores = (data, options) => {
    IID = IID || options.iid;
    rid = options.rid || rid;
    data = processData(data);
    $('#J_container-mores').append(new Xtemplate(tpl).render({ data, list: catMap }));
    $('#J_nav_menu').append(new Xtemplate(navTpl).render({ data, list: catMap }));

    new Navmenu('#J_nav_menu', {
        isSticky: (options && options.isSticky) || false,
        onItemSelect: switchTab
    });
    const $el = $('#J_mores_list').find('[data-cat=mores]');
    if (data.fightgroup_items.length) {
        $el.append(new Xtemplate(listTpl).render({ data }));
        clickPtLog({ $el, catName: 'mores' });
        lazy.revalidate();
        loadMore();
    }
};

const init = ({ iid, options }) =>
    (new Promise((resolve) => {
        getMores({ iid }).then((data) => {
            IID = iid;
            rid = options.rid || 85990;
            // 运营需求，在商品最上面插商品
            if (options.sellerItems && options.sellerItems.length) {
                data.fightgroup_items = [...options.sellerItems, ...data.fightgroup_items];
            }
            renderMores(data, options);
            resolve(data);
        });
    }));

// 请求大数据的推荐商品接口
// option对象需要包含iid、uid和event_id三个属性
const bigDataInit = ({ iid, uid, event_id, options }) =>
    (new Promise((resolve) => {
        bigDataGetMores({ iid, uid, event_id }).then((data) => {
            IID = iid;
            rid = options.rid || 85990;
            // 运营需求，在商品最上面插商品
            if (data.recom_items && data.recom_items.length) {
                if (options.sellerItems && options.sellerItems.length) {
                    data.recom_items = [...options.sellerItems, ...data.recom_items];
                }
                Object.assign(data, {
                    f_item_id: iid,
                    fightgroup_items: data.recom_items
                });
                renderMores(data, options);
                resolve(data);
            } else {
                init({ iid, options });
            }
        });
    }));

export default {
    init,
    bigDataInit,
    renderMores
};