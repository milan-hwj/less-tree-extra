/*eslint-disable */
'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var rev = require('gulp-rev');
var gulpsync = require('gulp-sync')(gulp);
var path = require('path');
var fileHandle = require('./fileHandle');
var _ = require('lodash');
var madge = require('madge');
var lessTree = require('less-tree-extra');
var webpack = require("webpack");
var logUtil = require('./log/main');

var srcPath;
var revName = 'rev-manifest.json';
var revDir;
var webpackProdConf;
var opt;
var startTime = new Date().getTime();

var init = function(option) {
    opt = option;
    srcPath = option.source || './app/biz/';
    revDir = option.rev || './bin/partRelease/rev/';
    webpackProdConf = option.webpackConfig;
};
var getMD5Task = function (src, dest) {
    return gulp.src(src)
        // 任务开始
        .pipe(rev())
        // js映射文件保存到./rev/js/ 不merge 两个task同时读写一个文件会出现覆盖问题
        .pipe(rev.manifest(revName))
        .pipe(gulp.dest(revDir));
};
var getMd5 = function() {
    var content = fileHandle.readFile(revDir + revName, true);
    var md5 = content ? JSON.parse(content) : {};
    return md5;
}

var getRelativeFiles = function(diffPath, dependenceTree) {
    // 根据依赖关系，分析出需要重新打包的文件
    var children = {};
    var prefix = srcPath.replace(/^(\/|\.\/)/, '');
    _.each(dependenceTree, function(modules, jsName) {
        _.each(modules, function(js) {
            js = js.replace(prefix, '').replace(/^unit\//, '');
            jsName = jsName.replace(prefix, '').replace(/^unit\//, '');
            if(!children[js]) {
                children[js] = {
                    parentNode: []
                }
            }
            children[js].parentNode.push(jsName);
        });
    });
    var result = _.extend({}, diffPath);
    var currentLevelNodes = _.extend({}, diffPath);
    var i = 0;
    while(_.toArray(currentLevelNodes).length > 0 && i < 99) {
        var next = {};
        _.each(children, function(v, k){
            if(currentLevelNodes[k]) {
                _.each(v.parentNode, function(fileName){
                    if(!result[fileName]){
                        // 若该文件发生变化，则依赖该文件的文件也发生变化
                        result[fileName] = fileName;
                        // 加入下一次迭代，判断fileName是否也被其他文件依赖
                        next[fileName] = fileName;
                    }
                });
            }
        });
        currentLevelNodes = next;
        i++;
    }
    result = _.map(result, function(v, k){
        return k;
    });
    result = _.filter(result, function(fileName){
        return !(children[fileName] && children[fileName].parentNode);
    });
    return result;
}

var compareFileMd5 = function(oldMd5Map) {
    var md5Map = getMd5();
    var diffMap = {};
    _.each(md5Map, function(v, k){
        if(oldMd5Map[k] !== v){
            if(k.indexOf('.html') !== -1) {
                // 若html发生变更，影响的是同目录同名js文件
                k = k.replace('.html', '.js');
            }
            diffMap[k] = true;
        }
    });
    return diffMap;
}

var mixinLessTree = function(jsTree) {
    var lessDependence = {}; // less依赖
    var lessfiles = _.filter(_.map(jsTree, function(v, key){
        return key;
    }), function(fileName){
        if(path.extname(fileName) === '.less') {
            return true;
        }
    });
    _.each(lessfiles, function(lessName){
        if(!lessDependence[lessName]){
            _.extend(lessDependence, lessTree(lessName).toFlatObject('./'));
        }
    });
    return _.extend({}, jsTree, lessDependence);
}
var releaseFiles;
var md5Map;
var diffFiles;
gulp.task('part-read-current-md5', function () {
    // 读取之前记录md5
    md5Map = getMd5();
});
gulp.task('part-record-md5', function () {
    // 计算并记录当前文件md5
    return getMD5Task([
        srcPath + '**/*.js',
        srcPath + '**/*.less',
        srcPath + '**/*.xtpl',
        srcPath + '**/*.html',
        './unit/' + '**/*.less',
        './unit/' + '**/*.js',
        './src/' + '**/*.less',
        './src/' + '**/*.js'
    ]);
});
gulp.task('part-contrasts-md5', function () {
    // 对比出内容变化的文件
    diffFiles = compareFileMd5(md5Map);
    gutil.log('Diff files:');
    gutil.log(diffFiles);
    // 依赖分析
    return madge('./app/biz/', {
        baseDir: './',
        showFileExtension: true
    }).then(function(res){
        var dependenceTree = res.obj();
        // mixin less tree
        dependenceTree = mixinLessTree(dependenceTree);
        // 需要打包的文件
        releaseFiles = getRelativeFiles(diffFiles, dependenceTree);
    });
});

gulp.task('part-webpack-release', function () {
    // 整理webpack需要打包的js、html
    // 全量打包条件
    // 1 若存在xtpl、less、文件名非index.js的js文件, 没有找到依赖与其的js文件，则该文件依赖解析失败，保险起见，全量打包
    // 2 若没有文件内容发生改变，全量打包
    var haveOtherTopJs = false;
    var haveOtherTopFileType = false;
    _.each(releaseFiles, function(fileName){
        if(/\.js$/.test(fileName) && !/index\.js$/.test(fileName)) {
            haveOtherTopJs = true;
        }
        else if(/\.(xtpl|less)$/.test(fileName)) {
            haveOtherTopFileType = true;
        }
    });
    var isPartRelease = releaseFiles.length && !haveOtherTopJs && !haveOtherTopFileType;
    gutil.log('需要打包的文件:');
    if(isPartRelease) {
        // 非全量打包
        var key;
        webpackProdConf.entry = _.reduce(
            // 需要打包的js
            releaseFiles,
            function(memo, v){
                if(/\/index\.js$/.test(v)) {
                    memo = memo || {};
                    // js文件中，仅打包index.js文件
                    key = path.dirname(v.replace('./app/biz/', ''));
                    memo[key] = webpackProdConf.entry[key];
                    return memo;
                }
            },
        {});
        // 需要打包的html
        webpackProdConf.plugins = _.reduce(
            webpackProdConf.plugins,
            function(memo, plugin){
                // 若页面js不打包，则对应的html也不打包
                if(plugin.options &&
                    plugin.options.filename &&
                    plugin.options.template) {
                    key = plugin.options.filename.replace('./html/', '').replace('.html', '');
                    if(webpackProdConf.entry[key]) {
                        memo.push(plugin);
                    }
                } else {
                    memo.push(plugin);
                }
                return memo;
            },
            []
        );
        // 输出需要打包的目录
        gutil.log(webpackProdConf.entry);
    } else {
        gutil.log('全量打包');
    }
    // 打包
    return webpack(webpackProdConf, function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }
        gutil.log(stats.toString({colors: true, chunks: false, children: false}));
        // 生成日志文件
        if(opt.logOpt){
            logUtil.createLogFile(
                opt.logOpt,
                diffFiles, // 变化的源码文件
                stats.toJson({
                    chunks: false,
                    children: false
                }).assets, // 本次打包生成的文件
                webpackProdConf.entry,
                (new Date().getTime() - startTime)/1000
            );
        }
    });
});

module.exports = function(taskName, option) {
    init(option);
    gulp.task(taskName, gulpsync.sync([
                'part-read-current-md5',
                'part-record-md5',
                'part-contrasts-md5',
                'part-webpack-release']), function() {
    });
    gulp.task(taskName + '-init', gulpsync.sync(['t2']), function() {
        // 初始化，记录当前文件的md5，避免第一次运行全量打包
    });
};
