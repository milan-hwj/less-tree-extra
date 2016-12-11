var Hammer = require('@beibei/navmenu/bin/hammer.js');
var defaultConfig = {
    isSticky: true
};

function Navmenu(id, options) {
    this.container = $(id);
    this.wrapper = this.container.find('.nav-menu-wrapper');
    this.innerContainer = this.container.find('.nav-menu-inner');
    this.itemElements = this.container.find('.nav-menu-item');
    this.scrollbar = this.container.find(".nav-menu-scroll");
    this.options = $.extend(defaultConfig, options);
    //默认元素的宽度是大于屏幕的宽度
    this.isScroll = true;
    this.init();
}
Navmenu.prototype.init = function() {
    this.initView();
    this.setContainerOffset();
    this.initEvent();
    this.fingerInit();
};

/**
 * 通过定时器 稳定元素offsetTop
 */
Navmenu.prototype.setContainerOffset = function () {
    var tryTimes = 16,
        isStable = false,
        cacheOffsetTop = 0,
        timer = null,
        that = this,
        $next = this.container.next();

    var timerFunc = function () {
        var offsetTop = 0,
            containerHeight = that.container.height();

        if ($next.length) {
            offsetTop = $next.offset().top - containerHeight;

        } else {
            offsetTop = that.container.offset().top();
        }

        offsetTop = Math.round(offsetTop);

        if (Math.abs(offsetTop - cacheOffsetTop) < 5) {
            isStable = true;
        }

        cacheOffsetTop = offsetTop;

        tryTimes -= 1;

        // 尝试10次
        if (tryTimes <= 0) {
            isStable = true;
        }

        that.containerOffset = cacheOffsetTop;
        // 稳定下来
        if (isStable) {
            clearTimeout(timer);

        } else {
            timer = setTimeout(timerFunc, 1000);
        }
    };

    timer = setTimeout(timerFunc, 1000);
};


/**
 * [initView description]组件样式初始化
 * @author 王海艳 <haiyan.wang@husor.com.cn>
 * @date   2016-06-29
 * @return {[type]}   [description]
 */
Navmenu.prototype.initView = function() {
    var totalWidth = 0,
        noMarginWidth = 0;
    //容器宽度初始化
    this.itemElements.each(function(i, item) {
        var w = parseFloat($(item).css('width'))+parseFloat($(item).css('margin-left'))+parseFloat($(item).css('margin-right')),
            noW = parseFloat($(item).css('width'));
        totalWidth += w;
        noMarginWidth += noW;
    });
    var height = this.container.css('height');
    //添加空标签，防止fixed的时候文档流会引起变化，引发的跳动
    this.container.before('<div class="hidden js-nav-menu-empty" style="height:' + height + '"></div>')
    this.totalWidth = Math.ceil(totalWidth);
    this.noMarginWidth = Math.ceil(noMarginWidth);
    this.innerContainer.css({
        'width': this.totalWidth,
        '-webkit-transform': 'translate3d(0,0,0)',
        'transform': 'translate3d(0,0,0)'
    });
    this.containerOffset = Math.round(this.container.offset().top);
    //屏幕自适应
    if (this.innerContainer.width() < this.wrapper.width()) {
        this.isScroll = false;
        var elMargin = Math.floor(parseInt(this.wrapper.width() - this.noMarginWidth) / this.itemElements.length/2);
        this.innerContainer.css({ 'width': '100%' });
        this.itemElements.css({
            'margin': '0 ' + elMargin + 'px'
        });
    }
    //第一个tab高亮
    this.initFirstItem();
};
/**
 * [initFirstItem description]让滚动轴默认在第一个tab
 * @author 王海艳 <haiyan.wang@husor.com.cn>
 * @date   2016-06-29
 * @return {[type]}   [description]
 */
Navmenu.prototype.initFirstItem = function() {
    var firstItem = this.itemElements.eq(0),
        left = firstItem.position().left,
        width = firstItem.width();
    if(firstItem.css('margin-left')){
        left += parseInt(firstItem.css('margin-left'));
    }
    this.scrollbar.css({
        'width': width + 'px',
        '-webkit-transform': 'translate3d(' + left + 'px,0,0)',
        'transform': 'translate3d(' + left + 'px,0,0)'
    });
};
/**
 * [initEvent description]组件事件初始化
 * @author 王海艳 <haiyan.wang@husor.com.cn>
 * @date   2016-06-29
 * @return {[type]}   [description]
 */
Navmenu.prototype.initEvent = function() {
    var self = this;
    this.itemElements.on('click', function() {
        var activeOld = self.itemElements.filter('.active').index();
        if($(this).index() == activeOld){
            return;
        }
        //item样式调整
        $(this).addClass('active').siblings().removeClass('active');
        //滚动轴样式调整
        var left = $(this).position().left,
            width = $(this).width();
        if($(this).css('margin-left')){
            left += parseInt($(this).css('margin-left'));
        }
        self.scrollbar.css({
            'width': width + 'px',
            '-webkit-transform': 'translate3d(' + left + 'px,0,0)',
            'transform': 'translate3d(' + left + 'px,0,0)'
        });
        //整个容器是否要往前移动
        var containerWidth = self.innerContainer.width(),
            screenWidth = self.wrapper.width(),
            moveWidth = $(this).prev().length ? $(this).prev().position().left : 0,
            index = $(this).index();
        var criticalWidth = containerWidth - screenWidth;
        //必须容器宽度大于屏幕宽度的前提下，才会去判断移动规律
        if (self.isScroll) {
            //添加滚动效果 与bar的效果时间控制一致
            self.innerContainer.css({
                '-webkit-transition': 'all .4s ease',
                'transition': 'all .4s ease'
            });
            //滚动规则
            if (index > 1) {
                if (moveWidth > criticalWidth) {
                    self.innerContainer.css({
                        '-webkit-transform': 'translate3d(' + (-criticalWidth) + 'px,0,0)',
                        'transform': 'translate3d(' + (-criticalWidth) + 'px,0,0)'
                    });
                } else {
                    self.innerContainer.css({
                        '-webkit-transform': 'translate3d(' + (-moveWidth) + 'px,0,0)',
                        'transform': 'translate3d(' + (-moveWidth) + 'px,0,0)'
                    });
                }
            } else {
                self.innerContainer.css({
                    '-webkit-transform': 'translate3d(' + 0 + 'px,0,0)',
                    'transform': 'translate3d(' + 0 + 'px,0,0)'
                });
            }
        }

        //页面滚动逻辑
        if (self.options.isSticky && window.scrollY > self.containerOffset) {
            $('html,body').scrollTop(self.containerOffset);
        }
        //点击后的回调
        self.options.onItemSelect && self.options.onItemSelect.apply(this, [$(this)]);
    });
    //滚动效果结束后，将动画样式取消，目的是下面的手指移动不然会卡顿
    this.innerContainer.on("transitionend webkitTransitionEnd", function() {
        $(this).css({
            '-webkit-transition': 'none',
            'transition': 'none'
        });
    })
    /**
     * [if description]是否需要添加吸顶效果
     * @author 王海艳 <haiyan.wang@husor.com.cn>
     * @date   2016-07-01
     * @param  {[type]}   config.isSticky [description]
     * @return {[type]}                   [description]
     */
    if (this.options.isSticky) {
        var that = this;
        var $container = this.container;
        if (this.isSupportSticky()) {
            $container.addClass('nav-sticky');
        } else {
            $(window).on('scroll', function(event) {
                var offsetTop = that.containerOffset;
                if ($(window).scrollTop() > offsetTop && !$container.hasClass('nav-fixed')) {
                    $container.addClass('nav-fixed');
                    $(".js-nav-menu-empty").removeClass('hidden');
                }
                if ($(window).scrollTop() < offsetTop && $container.hasClass('nav-fixed')) {
                    $container.removeClass('nav-fixed');
                    $(".js-nav-menu-empty").addClass('hidden');
                }
            });
        }
    }
};
/**
 * [isSupportSticky description]判断是否支持sticky
 * @author 王海艳 <haiyan.wang@husor.com.cn>
 * @date   2016-07-01
 * @return {Boolean}  [description]
 */
Navmenu.prototype.isSupportSticky = function() {
    var prefixTestList = ['', '-webkit-', '-ms-', '-moz-', '-o-'];
    var stickyText = '';
    for (var i = 0; i < prefixTestList.length; i++) {
        stickyText += 'position:' + prefixTestList[i] + 'sticky;';
    }
    // 创建一个dom来检查
    var div = document.createElement('div');
    var body = document.body;
    div.style.cssText = 'display:none;' + stickyText;
    body.appendChild(div);
    var isSupport = /sticky/i.test(window.getComputedStyle(div).position);
    body.removeChild(div);
    div = null;
    return isSupport;
};
/**
 * [fingerInit description]手指移动
 * @author 王海艳 <haiyan.wang@husor.com.cn>
 * @date   2016-06-30
 * @return {[type]}   [description]
 */
Navmenu.prototype.fingerInit = function() {
    if (this.isScroll) {
        //手指移动容器跟着手指移动
        var element = this.innerContainer,
            prevValue = "";
        var criticalWidth = element.width() - this.wrapper.width();
        new Hammer(element[0], {
            domEvents: true
        });
        element.on("panstart", function(e) {
            var tsValue = element.css('webkitTransform') || element.css('webkitTransform');
            prevValue = tsValue.match(/\-?[0-9]+/g)[1];
        });
        element.on("pan", function(e) {
            var tag = Number(e.gesture.deltaX) + Number(prevValue);
            if (tag < -criticalWidth) {
                tag = -criticalWidth;
            }
            if (tag > 0) {
                tag = 0;
            }
            element.css({
                '-webkit-transform': 'translate3d(' + tag + 'px,0,0)',
                'transform': 'translate3d(' + tag + 'px,0,0)'
            })
        });
    }
};

module.exports = Navmenu;
