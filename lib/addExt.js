'use strict';

const _ = require('lodash');

module.exports = extname => filePath => _.endsWith(filePath, `.${extname}`) ? filePath : `${filePath}.${extname}`;
