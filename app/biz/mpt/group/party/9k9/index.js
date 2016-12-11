/*
 * @Author: gyp
 * @Date:   2016-08-30 19:12:27
 * @Last Modified by:   gyp
 * @Last Modified time: 2016-09-01 16:29:44
 */

// 基础模块
import '@beibei/tingyun';
import isp from 'unit/common/js/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import Xtemplate from 'xtemplate/lib/runtime';
import lazyloadModule from '@beibei/lazyload';
import backtop from '@beibei/backtop';
import env from '@beibei/env';
import common from '../../../../common/gaea/preload';
import imageConvert from 'unit/common/js/image_convert/image_convert';

// 业务模块
import './index.less';
import tabTools from 'src/js/mp/pintuan/unit/tabTools';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import ptLog from '../../common/util/ptLog.js';
import listTpl from './list.xtpl';


const isBeibei = env.app.isBeibei;
const lazyload = lazyloadModule({
    useWebp: true
});

isp();
heatmap();
performance();

if (!isBeibei) {
    backtop();
}

{
    const toDouble = num => {
        if (num < 10) {
            return `0${num}`;
        }
        return num.toString();
    };

    const formatPrice = price => {
        const value1 = (price - (price % 100)) / 100;
        const value2 = toDouble(price % 100);
        return {
            integer: value1.toString(),
            decimal: price > 0 ? `.${value2}` : ''
        };
    };

    const getList = (page, cate) => {
        const url = `//sapi.beibei.com/fightgroup/nine_freeship/${page}-40-${cate}.html`;
        return new Promise((resolve, reject) => {
            common.callAPI({
                id: 'getFreeshipFromGaea',
                once: true, // 因接口需要传动态参数, 只在gaea取一次
                url,
                noDialog: true,
                dataType: 'jsonp',
                jsonpCallback: 'BeibeiFightgroupNineFreeshipGet',
                type: 'GET',
                success: resolve,
                error: reject
            });
        });
    };

    const processData = (resp) => {
        if (resp.fightgroup_items && resp.fightgroup_items.length) {
            resp.fightgroup_items.forEach((item) => {
                let joinNumText = '';

                if (item.join_num >= 10000) {
                    joinNumText = `${(item.join_num / 10000).toFixed(1)}万`;
                } else {
                    joinNumText = item.join_num.toString();
                }

                Object.assign(item, {
                    join_num_text: joinNumText,
                    price_format: formatPrice(item.group_price),
                    jpg: imageConvert.format320(item.img)
                });
            });
        }
        return resp;
    };

    const renderEnd = ($container) => {
        $container.append('<li class="z-end">------ 没有啦 ------</li>');
    };

    const renderList = ($container, data) => {
        $container.append(new Xtemplate(listTpl).render({
            data
        }));
    };

    {
        const Status = {
            status: 'choice',
            isLoading: false
        };

        const statusCont = [{
            page: 0,
            cate: 'choice',
            noItem: false,
            isEnd: false
        }, {
            page: 0,
            cate: '99',
            noItem: false,
            isEnd: false
        }, {
            page: 0,
            cate: '199',
            noItem: false,
            isEnd: false
        }];

        const $spinner = $('.J_spinner');
        const $containers = $('.J_groupList');
        const $groupListCont = $('.J_groupListCont');
        const $noItemTip = $('.J_noItemTip');
        const $win = $(window);
        const $doc = $(document);
        const windowH = $win.height();


        const renderNoItem = noItem => {
            $groupListCont[noItem ? 'hide' : 'show']();
            $noItemTip[noItem ? 'show' : 'hide']();
        };

        const getHeight = (winH, contH) => {
            if (winH > contH) {
                return winH;
            }
            return contH;
        };

        // 加载列表
        const loadList = (page, status, index) => {
            $spinner.css('visibility', 'visible');
            getList(page, status)
                .then((resp) => {
                    muiLoading.remove();
                    $spinner.css('visibility', 'hidden');
                    // 没有任何数据
                    const cur = statusCont[index];

                    if (page === 1 &&
                            (!resp.fightgroup_items ||
                            !resp.fightgroup_items.length)) {
                        cur.noItem = true;
                        renderNoItem(true);
                    } else {
                        cur.noItem = false;
                        renderNoItem(false);

                        renderList($containers.eq(index), processData(resp));
                        lazyload.getLazyImg();
                    }

                    Status.isLoading = false;

                    if (!resp.fightgroup_items ||
                        resp.page * resp.page_size > resp.count) {
                        cur.isEnd = true;
                        $spinner.remove();
                        renderEnd($containers.eq(index));
                    }

                    $groupListCont.height(
                        getHeight(windowH, $containers.eq(index).height()));
                });
        };

        const init = () => {
            tabTools.init(
                '.J_tabContainer',
                ['精选', '9块9', '19块9'],
                (index) => {
                    const cur = statusCont[index];
                    const status = cur.cate;

                    $groupListCont.attr('data-active', index);
                    Status.status = status;
                    Status.index = index;
                    if (cur.page === 0) {
                        cur.page += 1;
                        loadList(cur.page, status, index);
                    } else {
                        renderNoItem(cur.noItem);
                        $groupListCont.height(
                            getHeight(windowH, $containers.eq(index).height()));
                    }
                });

            $('body').css('min-height', windowH);

            $win.on('scroll', () => {
                const temp = statusCont[Status.index];
                if (!Status.isLoading &&
                    !temp.isEnd &&
                    $win.scrollTop() + $win.height() > $doc.height() - 400) {
                    Status.isLoading = true;

                    Object.assign(temp, {
                        page: temp.page + 1
                    });
                    loadList(temp.page, Status.status, Status.index);
                }
            });

            // 打点初始化
            ptLog.init({
                page: '拼团9块9包邮'
            });
        };

        init();
    }
}
