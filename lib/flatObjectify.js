'use strict';

const processor = require('process');
const path = require('path');
const objectify = (file, root) => {
  let rst = {};
  file.children.forEach(child => {
    rst[path.relative(path.resolve(processor.cwd(), root), child.path)] = objectify(child, root);
  });
  return rst;
};
module.exports = (file, root) => objectify(file, root || '');
