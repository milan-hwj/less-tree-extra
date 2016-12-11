import '@beibei/tingyun';
import Xtemplate from 'xtemplate/lib/runtime';
import './index.less';
import TPL from './list.xtpl';
// import common from '../../../../../unit/common/js/common/common';
import common from 'unit/common/js/common/common';
import authTool from '../common/util/pusherAuth.js';
import util from '../common/util/util.js';
import lazyLoad from '@beibei/lazyload';
import popup from '@beibei/popup';
import tabTools from '../../../../../src/js/mp/pintuan/unit/tabTools.js';
import logCreater from '../common/util/ptLog.js';
import priceHandle from '../../group/common/util/priceHandle.js';
import muiLoading from '../../../../../unit/common/widget/pintuan/muiLoading/muiLoading.js'; // loading
import imageConvert from 'unit/common/js/image_convert/image_convert';

const lazyload = lazyLoad({
    useWebp: true
});

const tool = {
    getList(page, pageSize, status, callback) {
        common.callAPI({
            method: 'beibei.pusher.group.get',
            noDialog: true,
            type: 'GET',
            data: {
                page,
                status,
                pageSize
            },
            success: callback
        });
    },
    requestOpen(iid) {
        common.callAPI({
            method: 'beibei.fightgroup.pusher.apply',
            noDialog: true,
            type: 'GET',
            data: {
                iid,
                group_code: 1
            },
            success(res) {
                if (res.success && res.data) {
                    window.location.href =
                        util.getAbsolutePath(`mpt/group/home.html?group_code=${res.data}&needshare=1&source=bbts`);
                } else {
                    popup.note(res.message ? res.message : '未知错误，请稍后重试', {
                        closeTime: 1500,
                        position: 'center'
                    });
                }
            }
        });
    },
    renderList($container, tplString, data) {
        const $tpl = $(new Xtemplate(tplString).render({ data }));
        $tpl.find('.J_open').on('tap', (event) => {
            this.requestOpen($(event.target).data('iid'));
        });
        $container.append($tpl);


        $container.find('li').each((index, li) => {
            const $li = $(li);
            if ($li.find('.left').html().trim() === '' &&
                $li.find('.btn-area .btn').length === 0) {
                $li.find('.operate').hide();
            }
        });
    },
    renderEnd($container) {
        $container.append('<li class="z-end">没有啦</li>');
    },
    toDouble(num) {
        return num < 10 ? `0${num}` : `${num}`;
    },
    processData(resp) {
        if (resp.pusher_groups && resp.pusher_groups.length) {
            resp.pusher_groups.forEach((item) => {
                const date = new Date(Number(item.gmt_modified) * 1000);
                const price = priceHandle(item.group_price);
                Object.assign(item, {
                    lottery_date: `${date.getFullYear()}.${this.toDouble(date.getMonth() + 1)}.${this.toDouble(date.getDate())}`,
                    lottery_time: `${this.toDouble(date.getHours())}:${this.toDouble(date.getMinutes())}`,
                    group_price: item.group_price / 100,
                    priceInt: price.priceInt,
                    priceDec: price .priceDec,
                    img: imageConvert.format200(item.img),
                    url: util.getAbsolutePath(`mpt/group/home.html?group_code=${item.group_code}&source=bbts`),
                    joinUrl: util.getAbsolutePath(`mpt/group/home.html?group_code=${item.group_code}&needshare=1&source=bbts`)
                });
            });
        }
        return resp;
    }
};

(function () {
    const PAGE_SIZE = 20;
    const $win = $(window);
    const $doc = $(document);
    const $spinner = $('#J_spinner');
    const $containers = $('.J_group-list');
    const $noItemTip = $('#J_no-item-tip');
    const $groupListCont = $('#J_group-list-cont');
    const windowH = $win.height() - $('#J_tab-container').height()
        - $('.group-nav').height();

    const Status = {
        status: 0,
        isLoading: false
    };

    // tabIndex对应status的map
    const STATUSMAP = [0, 2, 1, 3];

    const statusCont = [{
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }, {
        page: 0,
        noItem: false,
        isEnd: false
    }];

    const renderNoItem = (noItem) => {
        $groupListCont[noItem ? 'hide' : 'show']();
        $noItemTip[noItem ? 'show' : 'hide']();
    };

    const getHeight = (winH, contH) => (winH > contH ? winH : contH);

    const loadList = (page, pageSize, status) => {
        $spinner.css('visibility', 'visible');
        tool.getList(page, PAGE_SIZE, status, (resp) => {
            $spinner.css('visibility', 'hidden');
            if (page === 1 &&
                (!resp.pusher_groups || !resp.pusher_groups.length)) {
                statusCont[status].noItem = true;
                renderNoItem(true);
            } else {
                statusCont[status].noItem = false;
                renderNoItem(false);
                tool.renderList($containers.eq(STATUSMAP[status]),
                    TPL, tool.processData(resp));
                lazyload.getLazyImg();
            }

            Status.isLoading = false;

            if (!resp.pusher_groups ||
                resp.pusher_groups.length < PAGE_SIZE) {
                statusCont[status].isEnd = true;
                $spinner.remove();
                tool.renderEnd($containers.eq(STATUSMAP[status]));
            }

            $groupListCont.height(getHeight(windowH,
                $containers.eq(STATUSMAP[status]).height()));
            muiLoading.remove();
        });
    };

    const loadMore = () => {
        $win.on('scroll', () => {
            const temp = statusCont[Status.status];
            if (!Status.isLoading && !temp.isEnd &&
                $win.scrollTop() + $win.height() > $doc.height() - 400) {
                Status.isLoading = true;
                temp.page++;
                loadList(temp.page, PAGE_SIZE, Status.status);
            }
        });
    };

    const switchTab = (index) => {
        Status.status = STATUSMAP[index];
        $win.scrollTop(0);
        $groupListCont.attr('data-active', index);

        if (statusCont[index].page === 0) {
            statusCont[index].page += 1;
            loadList(statusCont[index].page, PAGE_SIZE, STATUSMAP[index]);
        } else {
            renderNoItem(statusCont[STATUSMAP[index]].noItem);
            $groupListCont.height(
                getHeight(windowH, $containers.eq(index).height())
            );
        }
    };

    const ptLog = () => {
        logCreater({
            page: '成团进度（贝贝赚宝）',
            rid: '85982',
            et: 'click'
        });
    };

    const init = () => {
        tabTools.init('#J_tab-container',
            ['全部', '等待成团', '拼团成功', '拼团失败'],
            switchTab);
        $('body').css('min-height', $win.height());
        loadMore();
        ptLog();
    };
    authTool.init({
        isPusherCB() {
            init();
        }
    });
}());
