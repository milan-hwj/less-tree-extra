/**
 * @Author: gyp
 * @Date:   2016-06-29 19:24:56
 * @Last Modified by:   gyp
 * @Last Modified time: 2016-07-25 16:58:46
 */
import '@beibei/tingyun';
import env from '@beibei/env';
import popup from '@beibei/popup';
import http from '@beibei/httpurl';
import backtop from '@beibei/backtop';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import isp from 'unit/common/js/isp/isp';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import wxTools from 'src/js/mp/pintuan/unit/wxTools';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import itemTitle from 'src/js/mp/pintuan/unit/item-title-1';
import Xtemplate from 'xtemplate/lib/runtime';
import mores from '../common/component/mores/mores.js';
import ptLog from '../common/util/ptLog.js';


import api from './api';
import listTpl from './list.xtpl';
import './index.less';

isp();
heatmap();
performance();

{
    const params = http.uri.params;
    const iid = params.iid;
    const isBeibei = env.app.isBeibei;
    if (!isBeibei) {
        backtop();
    }

    const status = {
        page: 0,
        hasMore: false
    };

    const $tab = $('.J_tab');
    const $hasMore = $('.J_has-more');
    const $containers = $('.J_group-list');
    const $dropdownBox = $('.J_dropdown-box');
    const $winnerListCont = $('#J_winner-list-cont');

    const handleDetail = (res) => {
        muiLoading.remove();
        itemTitle.init(res.fightgroup_lottery_item);

        // 设置分享的内容
        if (env.app.isWeixin) {
            wxTools.setWxShare(res.fightgroup_lottery_item.share_info, () => {
                // 抽奖频道分享打点
                // 统计加一
                ptLog.stat({
                    json: {
                        share: 1
                    }
                });
            });
        } else if (env.app.isBeibei) {
            const $input = $('#app_share_conf');
            const base = {
                title: res.fightgroup_lottery_item.share_info.share_title,
                desc: res.fightgroup_lottery_item.share_info.share_desc,
                url: res.fightgroup_lottery_item.share_info.share_link,
                platform: res.fightgroup_lottery_item.share_info.share_channel
            };
            $input.attr('value', JSON.stringify(base));
        }

        // 渲染大家都在团
        res.fightgroup_items = res.fightgroup_lottery_item_recoms;
        mores.renderMores(res, {
            isSticky: true,
            iid,
            rid: 86000
        });
    };

    const renderWinnerList = (data) => {
        if (!status.hasMore) {
            $hasMore.remove();
        }

        $dropdownBox.append(new Xtemplate(listTpl).render({ data }));
    };

    const handleWinnerList = (res) => {
        status.hasMore = res.count > res.page * res.page_size;

        const result = [];
        if (res.fightgroup_winners instanceof Array) {
            res.fightgroup_winners.forEach((el) => {
                const tmp = Object.assign({}, el);
                tmp.avatar = imageConvert.format160(tmp.avatar);
                result.push(tmp);
            });
            if (result.length > 0) {
                renderWinnerList(result);
            }
        }
    };

    const bindEvent = () => {
        $(document).on('click', '.J_has-more', (event) => {
            event.preventDefault();
            if (status.hasMore) {
                api.getWinnerList(iid, {
                    biz_status: 1,
                    biz_type: 6,
                    page: ++status.page
                }).then(handleWinnerList);
            }
        });
    };

    const init = () => {
        if (!iid) {
            popup.note('链接有误');
        }

        api.getWinnerList(iid, {
            biz_status: 1,
            biz_type: 6,
            page: ++status.page
        }).then(handleWinnerList);

        api.getRecomLottery(iid).then(handleDetail);
        bindEvent();

        // 打点初始化
        ptLog.init({
            page: '实时中奖名单'
        });
    };

    init();
}
