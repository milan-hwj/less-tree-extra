'use strict';

const fs = require('fs-extra');
const path = require('path');
const parse = require('parse-less-import');
const addExtLess = require('./addExt')('less');
module.exports = file => {
  const contents = fs.existsSync(file.path) ?
      fs.readFileSync(file.path).toString() : '';
  return parse(contents)
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

