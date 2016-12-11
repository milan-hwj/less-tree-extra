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
    webpackConfig: webpackConfig // webpack配置文件\
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
    logOpt: { // 日志配置信息, 不配置则无日志
        logPath: './html/mpt/release/', // 日志文件目录
        domain : 'http://h5.mizhe.com/' // 打包对应页面的线上访问域名，方便测试
    }
});
```

## 日志
### 目录结构
如上配置，将会在html/mpt/release下生成日志文件.
```javascript
    html/mpt/release
        2016_12_01_01_01_01.html // 该时间点的打包日志(每打包一次生成一个对应时间的html)
        today.html // 最新打包日志(仅一份)
        list.html // 历史打包列表(仅一份)
        history(目录, 自动生成)
            history.json // 每次打包都会往里面插入一条记录
        config(目录, 需要自己新建)
            parameters.json // 测试路径参数配置（下文介绍）
```

### 测试参数配置   
- 有了日志文件，修改了对应的js、less、xtpl，则会分析出影响的页面，进而生成对应页面的链接(可在today.html或者2016_xxx..文件查看)，点击进入测试。  
- 但是有些页面需要在url上带一些参数才能正常访问，为了便于测试，提供了配置方法，在日志文件目录(如上文的html/mpt/release)下新建config/parameters.json.
```javascript
// 页面m.beibei.com/mpt/group/0ysy/confirm-address.html所需的参数
{
    "mpt/group/0ysy/confirm-address": {
        "iid": 15080596,
        "sku_id": 42203559,
        "group_code": 1
    },
    "mpt/group/0ysy/list": {
        "iid": 14995037
    }
}
```

## 异常容灾
若发现依赖打包出现异常、改动代码并未打包，请再打包一次(会走全量打包), 并将svn版本号邮件给wenjun.hwj@husor.com，让我们能更好地定位问题，谢谢支持!

## 性能预测
以拼团页面负责度为例，使用基于依赖分析的打包方案，  
性能(单位秒):  12 + n * 5 (n: 页面数量)  
  
如  
本次发布修改了一个页面，打包预计时间 17s  
修改了一个组件，影响了4个页面，预计时间 32s  


