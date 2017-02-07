'use strict';

const processor = require('process');
const path = require('path');
let rst = {};
const objectify = (file, root) => {
  let key = path.relative(path.resolve(processor.cwd(), root), file.path);
  const dependencies = rst[key] = [];
  file.children.forEach(child => {
    key = path.relative(path.resolve(processor.cwd(), root), child.path); 
    dependencies.push(key);
    objectify(child, root);
  });
  return rst;
};
module.exports = (file, root) => objectify(file, root || '');
