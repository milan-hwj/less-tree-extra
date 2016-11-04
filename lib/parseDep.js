'use strict';

const path = require('path');
const parse = require('parse-less-import');
const addExtLess = require('./addExt')('less');
module.exports = file => {
  return parse(file.contents.toString())
    .map(dep => {
        let depPath = dep.path;
        // absolute path
        if(/^~/.test(depPath)) {
            depPath = depPath.replace(/^~/, './');
            return addExtLess(depPath);
        }
        return addExtLess(path.resolve(path.dirname(file.path), depPath));
    });
};
