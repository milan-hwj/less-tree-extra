import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import imageConvert from 'unit/common/js/image_convert/image_convert';
import wx from 'unit/common/js/wx/wx';
import common from 'unit/common/js/common/common';
import env from '@beibei/env';
import backtop from '@beibei/backtop';
import lazyloadModule from '@beibei/lazyload';
import tabTools from 'src/js/mp/pintuan/unit/tabTools';
import Xtemplate from 'xtemplate/lib/runtime';
import muiLoading from 'unit/common/widget/pintuan/muiLoading/muiLoading.js';
import ptBottomBar from 'unit/common/widget/pintuan/bottomBar/bottomBar.js';
import login from 'app/biz/mpt/common/auth/login.js';
import ptLog from '../common/util/ptLog.js';
import listTpl from './list.xtpl';
import './index.less';


isp();
heatmap();
performance();

if (!env.app.isBeibei) {
    backtop();
}

const lazyload = lazyloadModule({
    useWebp: true,
});

(() => {
    const PAGE_SIZE = 10;

    const getList = (page, status) => new Promise((resolve, reject) => {
        common.callAPI({
            method: 'beibei.fightgroup.mine.get',
            noDialog: true,
            type: 'GET',
            data: {
                page: page,
                status: status,
                page_size: PAGE_SIZE,
            },
            success(res) {
                resolve(res);
            },
            error(res) {
                console.log('getList error！');
                reject(res);
            },
        });
    });

    const renderList = ($container, tplString, data) => {
        $container.append(new Xtemplate(tplString).render({ data }));
    };

    const renderEnd = ($container) => {
        $container.append('<li class="z-end">------ 没有啦 ------</li>');
    };

    const toDouble = (num) => num < 10 ? `0${num}` : `${num}`;

    const formatPrice = (price) => ({
        integer: '' + ((price - price % 100) / 100),
        decimal: price > 0 ? `.${toDouble(price % 100)}` : '',
    });

    const processData = (resp) => {
        if (resp.fightgroup_items && resp.fightgroup_items.length) {
            resp.fightgroup_items.forEach((item) => {
                item.img = imageConvert.format200(item.img);
                item.price_format = formatPrice(item.group_price);
            });
        }
        return resp;
    };

    // 业务层逻辑
    (() => {
        let Status = {
            status: 0,
            isLoading: false,
        };

        let statusCont = [{
            page: 0,
            noItem: false,
            isEnd: false,
        }, {
            page: 0,
            noItem: false,
            isEnd: false,
        }, {
            page: 0,
            noItem: false,
            isEnd: false,
        }, {
            page: 0,
            noItem: false,
            isEnd: false,
        }];

        const $spinner = $('.J_spinner');
        const $containers = $('.J_groupList');
        const $groupListCont = $('.J_groupListCont');
        const $needNum = $('#J_need-Number');
        const $noItemTip = $('.J_noItemTip');
        const $win = $(window);
        const $doc = $(document);
        const isWeixin = env.app.isWeixin;
        const windowH = $win.height();

        const getStatusOrIndex = (num) => {
            switch (num) {
                case 0:
                    return 0;
                case 1:
                    return 2;
                case 2:
                    return 1;
                case 3:
                    return 3;
                default:
                    return 0;
            }
        };

        const renderNoItem = (noItem) => {
            $groupListCont[noItem ? 'hide' : 'show']();
            $noItemTip[noItem ? 'show' : 'hide']();
        };

        const getHeight = (winH, contH) => winH > contH ? winH : contH;

        const loadList = (page, status) => {
            $spinner.css('visibility', 'visible');
            getList(page, status).then((resp) => {
                // 移除loading
                muiLoading.remove();

                let index = getStatusOrIndex(status);

                $spinner.css('visibility', 'hidden');
                // 没有任何数据
                if (page === 1 &&
                    (!resp.fightgroup_items || !resp.fightgroup_items.length)) {
                    statusCont[status].noItem = true;
                    renderNoItem(true);
                } else {
                    statusCont[status].noItem = false;
                    renderNoItem(false);
                    renderList($containers.eq(index), listTpl, processData(resp).fightgroup_items);
                    lazyload.getLazyImg();
                }

                Status.isLoading = false;

                if (!resp.fightgroup_items || resp.fightgroup_items.length < PAGE_SIZE) {
                    statusCont[status].isEnd = true;
                    $spinner.remove();
                    renderEnd($containers.eq(index));
                }

                $groupListCont.height($containers.eq(index).height());
            });
        };


        const init = () => {
            tabTools.init('.J_tabContainer', ['全部', '等待成团', '拼团成功', '拼团失败'], (index) => {
                let status = getStatusOrIndex(index);

                Status.status = status;

                $win.scrollTop(0);
                $groupListCont.attr('data-active', index);

                if (statusCont[status].page === 0) {
                    statusCont[status].page += 1;
                    loadList(statusCont[status].page, status);
                } else {
                    renderNoItem(statusCont[status].noItem);
                    $groupListCont.height($containers.eq(index).height());
                }
            });

            $('body').css('min-height', windowH);

            $doc.on('tap', '#J_share-mask', () => {
                $(this).addClass('hidden');
            });

            $win.on('scroll', () => {
                let temp = statusCont[Status.status];
                if (!Status.isLoading && !temp.isEnd && ($win.scrollTop() + $win.height() > $doc.height() - 400)) {
                    Status.isLoading = true;
                    temp.page = temp.page + 1;
                    loadList(temp.page, Status.status);
                }
            });

            ptLog.init({ page: '我的拼团' });
        };

        // 微信环境下 先进行微信授权
        if (isWeixin) {
            login.authInit(window.location.origin + '/mpt/group/i.html', (result) => {
                if (result.isLogin) {
                    init();

                } else if (result.token) {
                    let dialog = login.getDialog();

                    muiLoading.remove();
                    $spinner.css('visibility', 'hidden');

                    // 手机弹窗绑定
                    dialog.setCallback(() => {
                        window.location.reload();
                    });
                    dialog.show();
                }
            });
        } else {
            init();
        }

    })();
})();
