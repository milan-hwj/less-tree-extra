'use strict';

// require('should');
const tree = require('../index');
// const path = require('path');
// const CWD = process.cwd();

console.info(tree('./test/source/a.less').toFlatObject('./test/'));

// describe('less-tree', () => {
//   before(() => process.chdir(path.join(__dirname, 'source')));
//   after(() => process.chdir(CWD));
//   it('should to tree object', () => {
//     tree('a.less').toTreeObject().should.be.eql({
//       'b.less': {
//         'd.less': {
//           'sub/f.less': {}
//         }
//       },
//       'c.less': {
//         'd.less': {
//           'sub/f.less': {}
//         }
//       },
//       'sub/e.less': {}
//     });
//   });
//   it('should to tree string', () => {
//     tree('a.less').toTreeString().trim().should.be.eql(`
// ├─ b.less
// │  └─ d.less
// │     └─ sub/f.less
// ├─ c.less
// │  └─ d.less
// │     └─ sub/f.less
// └─ sub/e.less
//    `.trim());
//   });
// });
