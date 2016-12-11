#!/usr/bin/env node
/*global require, console */                     // jslint ignore global variables
/*jslint es5: false, node: true, stupid: true */ // jslint options

'use strict';
/*
 * @author      : 何文俊(wenjun.he@husor.com)
 * @description : 文件处理类
 */

var getDirName = require('path').dirname;
var fs   = require('fs');
var path = require('path');
var _    = require('lodash'),


    iteratorFile = function (path, processFile){
        var st = fs.statSync(path),
            dirList;
        if(st.isFile()){
            processFile(path);
        }else{
            dirList = fs.readdirSync(path);
            _.each(dirList, function(item){
                var sta = fs.statSync(path + '/' + item);
                if(sta.isFile()){
                    processFile(path + '/' + item);
                }else if(sta.isDirectory()){
                    iteratorFile(path + '/' + item, processFile);
                }
            });
        }
    },
    readFileNoChange = function(dir, noSplit){
        var lines = fs.readFileSync(dir).toString().split('\n');
        if(noSplit){
            lines = lines.join('\n');
        }
        return lines;
    },
    exists = function(path, existCB, notExistCB){
      fs.exists(path, function(exists){
        if(exists){
          callback();
        }
      });
    },
    readFile = function(dir, noSplit){
        if (!fs.existsSync(dir)){
            return '';
        }
        var lines = fs.readFileSync(dir).toString().split('\n');
        // 去空行
        lines = _.reduce(lines, function(arr, line){
            // line = line.trim();
            if (line) {
                arr.push(line);
            }
            return arr;
        }, []);
        if(noSplit){
            lines = lines.join('\n');
        }
        return lines;
    },
    writeFile = function(filePath, contents, cb){
        var dir = path.dirname(filePath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFile(filePath, contents, cb);
    };


module.exports={
    iterator: iteratorFile,
    readFile: readFile,
    readFileNoChange: readFileNoChange,
    writeFile: writeFile,
    exists: exists
};
