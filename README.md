# webpack-part-release

用于贝贝M站webpack架构下的打包任务, 通过分析代码(html, xtpl, js, less)间的依赖关系，打包受到改动影响的代码，减少webpack打包工作量，从而提高打包速度。  

## 用法
```javascript
// 1 安装
npm install webpack-part-release --save

// 2 gulpfile.js
var partRelease = require('webpack-part-release');
var webpackProdConf = require('./bin/build/webpack.prod.conf.js');
partRelease('part-release', {
    webpackConfig: webpackConfig // webpack配置文件
}); // 最简方式, 注册了名为part-release的gulp任务

gulp.task('default', ['part-release', 'xxx', 'xxx']);

// 3 运行
gulp
```

## 配置信息
```javascript
partRelease('part-release', {
    source: './app/biz/', // 依赖分析路径，默认为./app/biz/
    rev: './rev/', // 存储md5信息目录，会在该目录下生成rev-manifast.json, 默认路径./bin/partRelease
    webpackConfig: webpackProdConf, // webpack配置信息[必需]
    callback: function(diffFiles, stats) { // 打包结束回调
        // diffFiles: 内容发生变化的source文件
        // stats: webpack 打包日志
    }
});
```

## 异常容灾
若发现依赖打包出现异常、改动代码并未打包，请再打包一次(会走全量打包), 并将svn版本号邮件给wenjun.hwj@husor.com，让我们能更好地定位问题，谢谢支持!

## 性能预测
以拼团页面负责度为例，使用基于依赖分析的打包方案，  
性能(单位秒):  12 + n * 5 (n: 页面数量)  
  
如  
本次发布修改了一个页面，打包预计时间 17s  
修改了一个组件，影响了4个页面，预计时间 32s  

