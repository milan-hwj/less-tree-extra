# less-tree

[![Test coverage](https://img.shields.io/coveralls/LingyuCoder/less-tree.svg?style=flat-square)](https://coveralls.io/r/LingyuCoder/less-tree?branch=master)
[![Build Status](https://travis-ci.org/LingyuCoder/less-tree.png)](https://travis-ci.org/LingyuCoder/less-tree)
[![Dependency Status](https://david-dm.org/LingyuCoder/less-tree.svg)](https://david-dm.org/LingyuCoder/less-tree)
[![devDependency Status](https://david-dm.org/LingyuCoder/less-tree/dev-status.svg)](https://david-dm.org/LingyuCoder/less-tree#info=devDependencies)
[![NPM version](http://img.shields.io/npm/v/less-tree.svg?style=flat-square)](http://npmjs.org/package/less-tree)
[![node](https://img.shields.io/badge/node.js-%3E=_4.0-green.svg?style=flat-square)](http://nodejs.org/download/)
[![License](http://img.shields.io/npm/l/less-tree.svg?style=flat-square)](LICENSE)
[![npm download](https://img.shields.io/npm/dm/less-tree.svg?style=flat-square)](https://npmjs.org/package/less-tree)

Get less import vinyl file tree

## Installation

```bash
$ npm install --save less-tree
```

## Usage

### Create Tree

```javascript
const lessTree = require('less-tree');

// create less vinyl file tree
let root = lessTree('a.less');

root.children // => get tree children vinyl file object
```

### toTreeObject

```javascript
// get tree object
root.toTreeObject();
/*
{
  'b.less': {
    'd.less': {
      'sub/f.less': {}
    }
  },
  'c.less': {
    'd.less': {
      'sub/f.less': {}
    }
  },
  'sub/e.less': {}
}
*/
```

### toTreeString


```javascript
// get tree string
root.toTreeString();
/*
├─ b.less
│  └─ d.less
│     └─ sub/f.less
├─ c.less
│  └─ d.less
│     └─ sub/f.less
└─ sub/e.less
*/
```

## Todo

* tree walker
* ...

## Test

```bash
$ npm run test
$ npm run test-cov
$ npm run test-travis
```

## License

The MIT License (MIT)

Copyright (c) 2015 LingyuCoder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
