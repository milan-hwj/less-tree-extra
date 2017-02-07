# less-tree-extra

**less-tree-extra** used for parse less dependence tree. Base for LingyuCoder's [less-tree](https://github.com/ly-tools/less-tree).

## Why less-tree-extra?
Compared to less-tree, the following functions are extended:  
* Support parsing root path reference, such as @import '~/less/xxx.less'.  
* Flat structure can be export.  

## Installation
```sh
$ npm install less-tree-extra
```

## Usage
```sh
const tree = require('less-tree-extra');

tree('./test/source/a.less').toTreeObject();
// { 
//     'b.less': { 
//         'd.less': { 
//             'sub/f.less': {} 
//         }
//     },
//     'c.less': {
//         'd.less': {
//             'sub/f.less': {}
//         }
//     },
//     'sub/e.less': {}
// }

tree('./test/source/a.less').toFlatObject(); 
// { 'test/source/a.less': [ 'test/source/b.less', 'test/source/c.less', 'test/source/sub/e.less' ],
//   'test/source/b.less': [ 'test/source/d.less' ],
//   'test/source/d.less': [ 'test/source/sub/f.less' ],
//   'test/source/sub/f.less': [],
//   'test/source/c.less': [ 'test/source/d.less' ],
//   'test/source/sub/e.less': [] }

tree('./test/source/a.less').toTreeString();
// ├─ b.less
// │  └─ d.less
// │     └─ sub/f.less
// ├─ c.less
// │  └─ d.less
// │     └─ sub/f.less
// └─ sub/e.less


```

# License
[MIT License](https://raw.githubusercontent.com/milan-hwj/less-tree-extra/master/LICENSE)

