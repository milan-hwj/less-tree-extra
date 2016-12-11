/**
 * 拼团-猜拼团价赢免费.
 */
import '@beibei/tingyun';
import _ from 'lodash';
import Xtemplate from 'xtemplate/lib/runtime';
import isp from 'unit/common/js/isp/isp';
import heatmap from '@beibei/statistics/statistics-heatmap';
import performance from '@beibei/statistics/statistics-performance';
import popup from '@beibei/popup';
import env from '@beibei/env';
import cookie from '@beibei/cookie';
import wx_login from 'app/biz/mpt/common/auth/login';
import wxTools from 'src/js/mp/pintuan/unit/wxTools';
import ptLog from '../../common/util/ptLog';
import mores from '../../common/component/mores/mores';
import api from './api';
import './index.less';

import login from 'unit/common/js/login/login2';
import login_hint from '../../common/component/login_hint/login_hint';


isp();
heatmap();
performance();
ptLog.init({
    page: '猜拼团价赢免单'
});

// 引入Hilo库 ================== start ============================
const Hilo = require('unit/common/js/hilo/core/Hilo.js');
Hilo.Class = require('unit/common/js/hilo/core/Class.js');
Hilo.Ticker = require('unit/common/js/hilo/util/Ticker.js');
Hilo.TextureAtlas = require('unit/common/js/hilo/util/TextureAtlas.js');
Hilo.View = require('unit/common/js/hilo/view/View.js');
Hilo.Stage = require('unit/common/js/hilo/view/Stage.js');
Hilo.LoadQueue = require('unit/common/js/hilo/loader/LoadQueue.js');
Hilo.Container = require('unit/common/js/hilo/view/Container.js');
Hilo.Text = require('unit/common/js/hilo/view/Text.js');
Hilo.Bitmap = require('unit/common/js/hilo/view/Bitmap.js');
Hilo.DOMElement = require('unit/common/js/hilo/view/DOMElement.js');
Hilo.Button = require('unit/common/js/hilo/view/Button.js');
// Hilo.Graphics = require('unit/common/js/hilo/view/Graphics.js');
Hilo.Sprite = require('unit/common/js/hilo/view/Sprite.js');
// Hilo.Drawable = require('unit/common/js/hilo/view/Drawable.js');
Hilo.Tween = require('unit/common/js/hilo/tween/Tween.js');

// 引入Hilo库 ================== end ============================

// const fastClick = require('unit/common/js/fastclick/fastclick.js');



// 定义图片常量
const IMG_BG = '//h0.hucdn.com/open/201643/4133385a4d5bf8a0_750x1249.jpg';// 背景图
const IMG_RULE_DETAIL = '//h0.hucdn.com/open/201644/bad450bc2fe3f547_750x836.png'; // 规则详细图
const IMG_BTN = '//h0.hucdn.com/open/201642/7f90c15e81128854_164x155.png'; // 按钮未按下
const IMG_BTN_ON = '//h0.hucdn.com/open/201642/8fa1b6add00c6836_165x144.png'; // 按钮按下
const IMG_BTN_GROUP = '//h0.hucdn.com/open/201643/5c7da85dca9b194c_400x880.png';
const IMG_LIGHT_ON = '//h0.hucdn.com/open/201643/d529c73b9abc3e59_49x50.png';
const IMG_ARROW = '//h0.hucdn.com/open/201643/fa2023c0ab788b89_39x21.png';



const IMG_RES_RIGHT = '//h0.hucdn.com/open/201643/8c4ad3f1c2810fe2_571x564.png'; // 猜对了

const IMG_RES_WRONG = '//h0.hucdn.com/open/201643/1cf92beb7f471b84_571x564.png'; // 猜错了

const IMG_RES_NEEDSHARE = '//h0.hucdn.com/open/201644/27f622251f0efbeb_571x564.png'; // 提示机会用完，需要分享

const IMG_RES_CHANCE_ADDED = '//h0.hucdn.com/open/201642/69b8baec150746d1_571x564.png'; // 提示已增加一次机会


// 定义常量

const WINDOW_WIDTH = $(window).width();
const WINDOW_HEIGHT = $(window).height();
const STAGE_WIDTH = 750;
const STAGE_HEIGHT = 1249;
const SCALE = WINDOW_WIDTH / STAGE_WIDTH;
const CANVAS_WIDTH = WINDOW_WIDTH;
const CANVAS_HEIGHT = STAGE_HEIGHT * SCALE;

const URL_GUESS_FREE_COUPON = '/mpt/group/party/guess_free_coupon.html';
const URL_MAIN_PARTY = 'http://mp.beibei.com/hms2_page_n/BBS11/PTZHC.html';
const FRAME = 960;

// 尺寸适配

const Util = {
    fit(size = 0) {
        return SCALE * size;
    },
    formatPrice(price = 0) {
        return price / 100;
    },
    getTime(ts) {
        const date = new Date(ts);
        return `${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}点`;
    }
};



/**
 * copy from beibei_party
 * 创建舞台实例并绑定计时器
 * 所有可见对象都要添加到舞台或其子容器后，才会被渲染出来
 */
const stage = (() => {
    // 定义舞台的基本样式
    const _stageDom = document.getElementById('stage');
    _stageDom.style.backgroundColor = '#650055';
    _stageDom.style.height = CANVAS_HEIGHT + 'px';
    _stageDom.style.width = CANVAS_WIDTH + 'px';
    _stageDom.style.minHeight = CANVAS_HEIGHT + 'px';
    // 创建舞台实例
    const _instance = new Hilo.Stage({
        container: _stageDom,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        scale: SCALE
    });
    // 创建定时器
    _instance.ticker = new Hilo.Ticker(FRAME);
    _instance.ticker.addTick(_instance);
    _instance.ticker.start(true);

    _instance.changeEvent = (bool) => { // 开启舞台的DOM事件响应，然后就可以使用View.on()来响应事件
        typeof bool === 'boolean' && _instance.enableDOMEvent(['click', 'touchstart', 'touchend'], bool);
    };
    return _instance;
})();

const PRELOAD_RESOURCE = [];

// 将必须的资源放到MUST_RESOURCE常量中，页面加载时就加载其中所有的资源
const MUST_RESOURCE = [{
    "id": "IMG_BG",
    "src": IMG_BG
}, {
    "id": "IMG_BTN",
    "src": IMG_BTN
}, {
    "id": "IMG_BTN_ON",
    "src": IMG_BTN_ON
}, {
    "id": "IMG_BTN_GROUP",
    "src": IMG_BTN_GROUP,
    "sprite": {
        "btn": {
            frames: [
                [1, 1, 200, 220],
                [201, 1, 200, 220],
                [1, 221, 200, 220],
                [201, 221, 200, 220],
                [1, 441, 200, 220],
                [201, 441, 200, 220],
                [1, 660, 200, 220]
            ],
            sprites: {
                btns: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0],
                btns_up: [5, 4, 3, 2, 1, 0]
            }
        }
    }
}, {
    "id": "IMG_LIGHT_ON",
    "src": IMG_LIGHT_ON,
    "sprite": {
        "loopLight": {
            frames: [
                [102, 358],
                [179, 336],
                [257, 328],
                [341, 325],
                [432, 325],
                [525, 333],
                [613, 362],
                [635, 435],
                [634, 515],
                [628, 588],
                [624, 658],
                [613, 725],
                [547, 749],
                [478, 749],
                [408, 749],
                [343, 749],
                [273, 749],
                [206, 749],
                [138, 749],
                [92, 706],
                [82, 638],
                [77, 571],
                [72, 503],
                [73, 433]
            ]
        }
    }
}, {
    "id": "IMG_ARROW",
    "src": IMG_ARROW
}, {
    "id": "IMG_RULE_DETAIL",
    "src": IMG_RULE_DETAIL
}, {
    "id": "IMG_RES_RIGHT",
    "src": IMG_RES_RIGHT
}, {
    "id": "IMG_RES_WRONG",
    "src": IMG_RES_WRONG
}, {
    "id": "IMG_RES_NEEDSHARE",
    "src": IMG_RES_NEEDSHARE
}, {
    "id": "IMG_RES_CHANCE_ADDED",
    "src": IMG_RES_CHANCE_ADDED
},];


const Rule = {
    init() {
        const self = this;
        $('.J_rule-modal').css('backgroundImage', `url(${IMG_RULE_DETAIL})`);
        App.gameUI.getChildById('RULE').on('click', () => {
            self.show();
        });
        $('.J_rule-close').on('click', () => {
            self.hide();
        });
    },
    show() {
        $('#J_rule-detail').removeClass('hidden');
    },
    hide() {
        $('#J_rule-detail').addClass('hidden');
    }
};

const Modal = {
    $modal: $('#guess_result'),
    $win: $('.J_res-modal'),
    $msg: $('.J_res-msg'),
    $btn_left: $('.J_btn-left'),
    $btn_right: $('.J_btn-right'),
    $close: $('.J_close'),
    show(type, res) {
        const self = this;
        const iid = App.data.iid;
        switch (type) {
        case 'right':
            this.$win.css('backgroundImage', `url(${IMG_RES_RIGHT})`);
            this.$msg.html(res.message).addClass('right').removeClass('wrong');
            this.$btn_left.off().on('click', () => {
                // 跳转免费开团
                window.location.href = URL_GUESS_FREE_COUPON;
            });
            this.$btn_right.off().on('click', () => {
                // 收藏该商品
                self.collect(iid);
            });
            break;
        case 'wrong':
            this.$win.css('backgroundImage', `url(${IMG_RES_WRONG})`);
            this.$msg.html(res.message).addClass('wrong').removeClass('right');
            this.$btn_left.off().on('click', () => {
                // 继续挑战
                self.continue();
            });
            this.$btn_right.off().on('click', () => {
                // 收藏该商品
                self.collect(iid);
            });
            break;
        case 'need_share':
            this.$win.css('backgroundImage', `url(${IMG_RES_NEEDSHARE})`);
            this.$msg.html('');
            this.$btn_left.off().on('click', () => {
                // 唤起分享
                self.share();
            });
            this.$btn_right.off().on('click', () => {
                // 收藏该商品
                self.collect(iid);
            });
            break;
        case 'chance_add':
            this.$win.css('backgroundImage', `url(${IMG_RES_CHANCE_ADDED})`);
            this.$msg.html('');
            this.$btn_left.off().on('click', () => {
                self.hide();
            });
            this.$btn_right.off().on('click', () => {
                self.hide();
            });
            break;
        default:
            break;
        }
        this.$close.off().on('click', () => {
            self.hide();
            App.getQuestion((result) => {
                App.renderQuestion(result);
            });
        });

        this.$modal.removeClass('hidden');
    },
    hide() {
        this.$modal.addClass('hidden');
    },
    continue() { // 继续挑战
        // 继续挑战
        this.hide();
        App.getQuestion((result) => {
            App.renderQuestion(result);
        });
    },
    collect(iid) { // 收藏该商品
        // this.hide();
        addItemFavor(iid);
    },
    share() { // 分享
        if (env.app.isWeixin) {
            // 微信的分享
            popup.note('请点击微信右上角分享按钮进行分享', {
                mask: false
            });
        } else if (env.app.isBeibei) {
            const _config = JSON.parse($('#app_share_conf').val());
            window.location.href = 'beibei://action?target=share&platform=' + _config.platform +
                        '&url=' + encodeURIComponent(_config.url) +
                        '&title=' + encodeURIComponent(_config.title) +
                        '&desc=' + encodeURIComponent(_config.comment) +
                        '&comment=' + encodeURIComponent(_config.comment) +
                        '&small_img=' + encodeURIComponent(_config.image) +
                        '&large_img=' + encodeURIComponent(_config.image) +
                        '&image=' + encodeURIComponent(_config.image) + '&callback=shareCallBack()';
        } else {
            popup.note('只有在贝贝APP或微信内进行分享机会才会增加喔！', {
                mask: false
            });
        }
    }
};

/*
 * 资源加载类
 * 资源异步加载方案
 * 因为资源分为必须资源和后续资源,并且两者的实例使用条件不一样,所以该函数可以直接实例化和当做函数调用
 */
const Loader = (() => {
    var queueInstance = null;
    var Loader = function(resource, callback) {
        if (this instanceof Loader) {
            this.queue = new Hilo.LoadQueue(resource);
            this.queue.maxConnections = 6;
        } else {
            if (queueInstance instanceof Hilo.LoadQueue) {
                queueInstance.add(resource);
            } else {
                queueInstance = new Hilo.LoadQueue(resource);
                queueInstance.maxConnections = 2;
            }
            callback = typeof callback === 'function' ? callback : function() { this.off() };
            return queueInstance.on('complete', callback, true).start();
        }
    }
    Loader.prototype.on = function(type, callback, context) {
        if ((type !== 'load' && type !== 'complete') || typeof callback !== 'function') return;
        typeof context === 'object' && typeof callback === 'function' && (callback = callback.bind(context));
        this.queue.on(type, callback);
        return this;
    }
    Loader.prototype.start = function() {
        this.queue.start();
        return this;
    };
    return Loader;
})();


/*
 * Preload类,预加载UI类,显示进度百分比
 */
const PreLoad = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(originFont) {
        PreLoad.superclass.constructor.call(this, originFont);
        this.originFont = originFont;
        this.init(originFont);
    },
    init: function(originFont) {
        this.loader = new Loader(PRELOAD_RESOURCE);
        this.res = this.loader.queue;
       
        this.loadInfo = new Hilo.Text({ // 创建加载中展示文案样式
            text: originFont,
            textAlign: 'center',
            color: '#fff',
            font: Util.fit(36) + 'px arial',
            width: CANVAS_WIDTH,
            maxWidth: CANVAS_WIDTH
        });
        this.loadInfo.y = (WINDOW_HEIGHT - this.loadInfo._fontHeight) / 2;

        this.addChild(this.loadInfo);
    },
    setProcess: function(data) {
        this.loadInfo.text = this.originFont + data;
    },
    destory: function() {
        $('#stage').css('backgroundColor', '#7022b2');
        this.loadInfo = null;
    }
});


const Main = function () {
    this.loader = new Loader(MUST_RESOURCE); // 站内资源列表
    this.res = this.loader.queue;
    this.preLoadUI = new PreLoad('正在加载...').addTo(stage);
};

Main.prototype = {
    constructor: Main,
    data: {
        is_share: 0,
        guess_chance: 1,
        item: {},
        iid: 1
    },
    gameUI: {},
    init: function() {
        const self = this;
        this.loader
            .on('load', function() {
                this.preLoadUI.setProcess(Math.ceil(this.res.getLoaded() / this.res.getTotal() * 100) + '%');
            }, this)
            .on('complete', function() {
                this.res.off();
                this.preLoadUI.destory();
                
                // 初始化逻辑
                this.renderStage();
                this.getQuestion((res) => {
                    self.renderQuestion(res);
                    stage.changeEvent(true); // 开启点击事件响应
                    Rule.init();
                    more()({
                        iid: res.item.iid,
                        uid: parseInt(cookie('_logged_'), 10),
                        event_id: res.item.event_id
                    });
                    self.gameUI.getChildById('go_miandanquan').on('click', () => {
                        window.location.href = URL_GUESS_FREE_COUPON;
                    });
                    self.gameUI.getChildById('jump_main').on('click', () => {
                        window.location.href = URL_MAIN_PARTY;
                    });
                });
                NoticeLoop.init();
            }, this)
            .start();
        return this;
    },
    renderQuestion(res) {
        const ques = res;
        const item = ques.item;
        const iid = item.iid;
        const self = this;
        // 处理数据
        ques.item.begin_format = Util.getTime(ques.item.gmt_begin * 1000);
        ques.item.price_format = ques.item.question.map(value => `${Util.formatPrice(value)}元`);
        
        this.data.iid = iid;
        // 改变元素
        this.gameUI.getChildById('item_tips').text = `${item.begin_format}  半价开抢的价格是？`;

        $('#item_title').html(item.title);
        this.gameUI.getChildById('lastchance_tips').text = `您今天还有${ques.guess_chance}次猜价格的机会`;
        
        // 手动延迟，可能到这步时dom还没生成好，具体原因做完再查。
        setTimeout(() => {
            document.getElementById('item_img').src = item.rect_img;
        }, 100);
        this.data.guess_chance = res.guess_chance;
        this.data.is_share = res.is_share;
        // 改变btn text
        ques.item.price_format.forEach((v, i) => {
            self.btnGroup.getChildById(`btn${i + 1}_text`).text = v;
        });

        this.btnGroup.choiceBtn.off().on('click', function () {
            this.currentFrame = 0;
            this.play();
            setTimeout(function() {
                self.submitAnswer(iid, item.question[0], self.submitAnswerCb);
            }, 200);

        });

        this.btnGroup.choiceBtn2.off().on('click', function () {
            this.currentFrame = 0;
            this.play();
            setTimeout(function() {
                self.submitAnswer(iid, item.question[1], self.submitAnswerCb);
            }, 200);
        });

        this.btnGroup.choiceBtn3.off().on('click', function () {
            this.currentFrame = 0;
            this.play();
            setTimeout(function() {
                self.submitAnswer(iid, item.question[2], self.submitAnswerCb);
            }, 200);
        });

        this.btnGroup.choiceBtn4.off().on('click', function () {
            this.currentFrame = 0;
            this.play();
            setTimeout(function() {
                self.submitAnswer(iid, item.question[3], self.submitAnswerCb);
            }, 200);
        });
    },
    renderStage() {
        this.gameUI = new Game({
            res: this.res
        }, ['stage'], stage).addTo(stage);


        this.btnGroup = new Btn({
            res: this.res
        }).addTo(stage);
    },
    getQuestion(cb) {
        if (this.data.guess_chance <= 0 && this.data.is_share) {
            return;
        }
        api.getQuestion().then(res => cb && cb(res));
    },
    submitAnswer(iid, price, cb) {
        api.submitAnswer({ iid, price }).then(res => cb && cb(res));
    },
    submitAnswerCb(res) {
        const self = this;
       
        if (res.success) {
            if (res.result) { // 猜对了
                // 弹出框
                Modal.show('right', res);
            } else { // 猜错了
                Modal.show('wrong', res);
            }
        } else if (res.guess_chance === 0) {
            Modal.show('need_share', res);
        }
    }
};


// 依赖注入
function DI(injectArr, instances) {
    if (injectArr instanceof Array && instances instanceof Array) {
        injectArr.forEach(function(v, k) {
            this[v] = instances[k];
        }, this);
    }
}

const Game = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties, injectArr) {
        this.properties = properties || {};
        Game.superclass.constructor.call(this, this.properties);
        // 注入依赖
        injectArr && DI.call(this, injectArr, [].slice.call(arguments, 2));
        this.ticker = new Hilo.Ticker(10);
        this.ticker.start();
        this.init(this.properties.res);
    },
    init: function(res) {
        if (!res) return;
        this.bg = new Hilo.Bitmap({
            id: 'IMG_BG',
            image: res.getContent('IMG_BG'),
            width: Util.fit(750),
            height: Util.fit(1249),
            x: 0,
            y: 0
        });

        this.rule = new Hilo.Button({
            id: 'RULE',
            width: Util.fit(150),
            height: Util.fit(150),
            x: Util.fit(600),
            y: 0
        });

        this.item_tips = new Hilo.Text({
            id: 'item_tips',
            text: '',
            textAlign: 'center',
            color: '#fff',
            font: 'normal ' + Util.fit(24) + 'px arial',
            maxWidth: Util.fit(3705),
            x: Util.fit(195),
            y: Util.fit(416)
        });

        this.item_title = new Hilo.DOMElement({
            id: 'item_title',
            height: Util.fit(30),
            width: Util.fit(380),
            x: Util.fit(190),
            y: Util.fit(700),
            element: Hilo.createElement('p', {
                style: {
                    'textAlign': 'center',
                    'color': '#ffeb4b',
                    'font-size': Util.fit(26) + 'px',
                    'overflow': 'hidden',
                    'white-space': 'nowrap',
                    'word-break': 'break-all',
                    'text-overflow': 'ellipsis'
                }
            })
        });

        this.lastchance_tips = new Hilo.Text({
            id: 'lastchance_tips',
            text: '',
            textAlign: 'center',
            color: '#ff0000',
            font: 'normal ' + Util.fit(26) + 'px arial',
            maxWidth: Util.fit(380),
            x: Util.fit(220),
            y: Util.fit(968)
        });

        this.item_img = new Hilo.DOMElement({
            id: 'item_img',
            width: Util.fit(425),
            height: Util.fit(216),
            x: Util.fit(164),
            y: Util.fit(450),
            element: Hilo.createElement('img', {
                src: '//h0.hucdn.com/open/201642/51b8bfdee9fe44ac_425x216.png',
                style: {
                    'position': "absolute",
                    'border-radius': Util.fit(16) + 'px'
                }
            })
        });

        this.jump_main = new Hilo.Button({
            id: 'jump_main',
            width: Util.fit(425),
            height: Util.fit(216),
            x: Util.fit(164),
            y: Util.fit(470)
        });


        this.go_miandanquan = new Hilo.Button({
            id: 'go_miandanquan',
            width: Util.fit(368),
            height: Util.fit(135),
            x: Util.fit(186),
            y: Util.fit(990)
        });

        this.arrow = new Hilo.DOMElement({
            id: 'arrow',
            width: Util.fit(39),
            height: Util.fit(21),
            x: Util.fit(355),
            y: Util.fit(1185),
            element: Hilo.createElement('img', {
                src: IMG_ARROW,
                style: {
                    'position': "absolute"
                }
            })
        });

        const loopLightFrames = res.get('IMG_LIGHT_ON').sprite.loopLight.frames;
        this.loopLight = new Hilo.Bitmap({
            id: 'loopLight',
            image: res.getContent('IMG_LIGHT_ON'),
            width: Util.fit(49),
            height: Util.fit(50),
            x: Util.fit(loopLightFrames[0][0]),
            y: Util.fit(loopLightFrames[0][1])
        });
        this.loopLight.currentFrame = 0;
        this.loopLight.tick = (function () {
            if (this.loopLight.currentFrame >= loopLightFrames.length - 1) {
                this.loopLight.currentFrame = 0;
                this.loopLight.x = Util.fit(loopLightFrames[0][0]);
                this.loopLight.y = Util.fit(loopLightFrames[0][1]);
                return;
            }
            this.loopLight.currentFrame++;
            this.loopLight.x = Util.fit(loopLightFrames[this.loopLight.currentFrame][0]);
            this.loopLight.y = Util.fit(loopLightFrames[this.loopLight.currentFrame][1]);
        }).bind(this);

        this.addChild(this.bg, this.rule, this.arrow,
                     this.item_tips, this.item_title, this.lastchance_tips, this.item_img, this.jump_main, this.go_miandanquan);

        this.loop();
    },
    loop: function() {
        this.addChild(this.loopLight);
        this.loopLight.currentFrame = 0;
        this.ticker.addTick(this.loopLight);
    }
});


/*
 * btn类,负责大部分拥有点击状态的按钮
 */
const Btn = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor(properties) {
        this.properties = properties || {};
        Btn.superclass.constructor.call(this, this.properties);

        this.texture = new Hilo.TextureAtlas({
            width: 400,
            height: 880,
            image: this.properties.res.getContent('IMG_BTN_GROUP'),
            frames: this.properties.res.get('IMG_BTN_GROUP').sprite.btn.frames,
            sprites: this.properties.res.get('IMG_BTN_GROUP').sprite.btn.sprites
        });
        this.init();
    },
    init() {
        this.choiceBtn = new Hilo.Sprite({
            frames: this.texture.getSprite('btns'),
            x: Util.fit(45),
            y: Util.fit(785),
            width: Util.fit(200),
            height: Util.fit(220),
            loop: false,
            paused: true
        });

        this.choiceBtn2 = new Hilo.Sprite({
            frames: this.texture.getSprite('btns'),
            x: Util.fit(203),
            y: Util.fit(785),
            width: Util.fit(200),
            height: Util.fit(220),
            loop: false,
            paused: true
        });


        this.choiceBtn3 = new Hilo.Sprite({
            frames: this.texture.getSprite('btns'),
            x: Util.fit(360),
            y: Util.fit(785),
            width: Util.fit(200),
            height: Util.fit(220),
            loop: false,
            paused: true
        });


        this.choiceBtn4 = new Hilo.Sprite({
            frames: this.texture.getSprite('btns'),
            x: Util.fit(520),
            y: Util.fit(785),
            width: Util.fit(200),
            height: Util.fit(220),
            loop: false,
            paused: true
        });

        this.btn1_text = new Hilo.Text({
            id: 'btn1_text',
            text: '',
            textAlign: 'center',
            color: '#fff',
            font: 'normal ' + Util.fit(28) + 'px arial',
            width: Util.fit(164),
            x: Util.fit(63),
            y: Util.fit(850),
            pointerEnabled: false
        });
        this.btn2_text = new Hilo.Text({
            id: 'btn2_text',
            text: '',
            textAlign: 'center',
            color: '#fff',
            font: 'normal ' + Util.fit(28) + 'px arial',
            width: Util.fit(164),
            x: Util.fit(220),
            y: Util.fit(850),
            pointerEnabled: false
        });
        this.btn3_text = new Hilo.Text({
            id: 'btn3_text',
            text: '',
            textAlign: 'center',
            color: '#fff',
            font: 'normal ' + Util.fit(28) + 'px arial',
            width: Util.fit(164),
            x: Util.fit(373),
            y: Util.fit(850),
            pointerEnabled: false
        });
        this.btn4_text = new Hilo.Text({
            id: 'btn4_text',
            text: '',
            textAlign: 'center',
            color: '#fff',
            font: 'normal ' + Util.fit(28) + 'px arial',
            width: Util.fit(164),
            x: Util.fit(533),
            y: Util.fit(850),
            pointerEnabled: false
        });

        this.addChild(this.choiceBtn, this.choiceBtn2, this.choiceBtn3, this.choiceBtn4,
                     this.btn1_text, this.btn2_text, this.btn3_text, this.btn4_text);
    }
});


// 轮播
const NoticeLoop = {
    init() {
        const self = this;
        api.getGuessNotice().then((res) => {
            if (res.success) {
                self.renderLotteryNotice(res.notices);
                // self.start();
            }
        });
    },
    start() {

    },
    //根据拿到的信息渲染用户中奖信息
    renderLotteryNotice: function(notices){
        if(!notices || notices.length < 1) return console.warn('notices error')
        var $notice = $('#notice')
            .css({
                position: 'absolute',
                left: Util.fit(170) + 'px',
                top: Util.fit(20) + 'px',
                width: Util.fit(451) + 'px',
                height: Util.fit(37) + 'px'
            }),
            oneNoticeWidth = $notice.width(),
            html = '',
            width = 0,
            current = 0;
        function create(notice){
            return [
                '<li class="notice-item">' + notice + '</li>'
            ].join('');
        }
        notices.forEach(function(v){
            html += create(v)
        })
        html += create(notices[0])
        width = notices.length * oneNoticeWidth + 40;

        var $ul = $notice
            .find('ul')
            .width(width + oneNoticeWidth)
            .html(html)
        function scroll(){
            if(current < -width) current = 0
            current -= 5
            $ul.css({
                '-webkit-transform': 'translateX(' + current + 'px)',
                'transform': 'translateX(' + current + 'px)'
            })
            setTimeout(scroll, 75)
        }
        scroll()
	}
};

const more = () => {
    const moresLog = ({ iid, recom_id, items }) => {
        // list_show事件打点
        // {leading: false,trailing: false}
        // 在给定的时间内最多执行一次，并且尽快执行
        const $window = $(window);
        const $container = $('#J_container-mores');
        const winHeight = $window.height();
        const btnsHeight = $('#J_btns').height();

        $window.on('scroll.listShow', _.throttle(() => {
            if ($window.scrollTop() + winHeight
                    > btnsHeight + $container.offset().top) {
                ptLog.stat({
                    et: 'list_show',
                    rid: 85991,
                    json: {
                        block_name: '拼团详情页_大家都在团',
                        f_item_id: iid,
                        recom_id,
                        ids: _.map(items, item => (item.iid)).join(',')
                    }
                });
                $window.off('scroll.listShow');
            }
        }, 80));
    };

    const renderMores = (data) => {
        mores.bigDataInit({
            iid: data.iid,
            uid: data.uid,
            event_id: data.event_id,
            options: {
                isSticky: true,
                rid: 85999
            }
        }).then((res) => {
            moresLog({
                iid: data.iid,
                recom_id: res.recom_id,
                items: res.fightgroup_items
            });
        });
    };


    return renderMores;
};

let App;
const init = () => {
    more();
    App = new Main().init();
};


// 检测用户是否已绑定过手机号码
const showBindDialog = () => {
    const dialog = wx_login.getDialog();
    dialog.show();

    // 手机弹窗绑定
    dialog.setCallback(() => {
        window.location.reload();
    });
};


// 检测登录
if (env.app.isWeixin) {
    wx_login.authInit(window.location.href, (result) => {
        if (result.isLogin) {
            init();
        } else if (result.token) {
            showBindDialog();
        }
    });
} else {
    login.checkLogin((isLogin) => {
        if (isLogin) {
            init();
        } else {
            // 还需判断是否在APP内
            if (env.app.isBeibei) {
                login_hint.show();
            }
            login.login(() => {
                init();
            });
        }
    });
}

const addChance = () => {
    api.addChance().then((res) => {
        setTimeout(() => {
            if (res.success && res.add_count) {
                Modal.show('chance_add', res);
                App.getQuestion((result) => {
                    App.renderQuestion(result);
                });
            } else {
                popup.note('今日机会已用完，请明日再来吧！', {
                    mask: false
                });
            }
        }, 1500);
    });
};

const addItemFavor = (iid) => {
    api.addItemFavor(iid).then((res) => {
        if (res.success) {
            popup.note('收藏成功', {
                mask: false
            });
        } else {
            popup.note('收藏失败', {
                mask: false
            });
        }
    });
};

const shareCallBack = () => {
    addChance();
};

window.shareCallBack = shareCallBack;

// 分享设置(微信)
wxTools.setWxShare({
    share_channel: 'weixin',
    share_desc: '还有什么比免单更加诱人的呢？只要猜对价格就能获得免单的机会，快来一起猜猜猜~ ',
    share_icon: 'https://h0.hucdn.com/open/201642/d07b549a425a1518_100x100.jpg',
    share_link: window.location.protocol + '//m.beibei.com/mpt/group/party/guess_price.html',
    share_title: '【贝贝拼团11.11】猜价送免单，千元商品免费团'
}, () => {
    // 抽奖频道分享打点
    // 统计加一
    ptLog.stat({
        json: {
            share: 1
        }
    });
    shareCallBack();
});





