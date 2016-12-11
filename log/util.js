var util = {
    dateFormat: function(date, pattern) {
        /*
         * @description : 日期格式化
         * @param       : {date  } date    , 待格式化输出的日期对象
         * @param       : {string} pattern , 格式描述
         * @syntax      : utils.FMT.date(new Date(0), '{YY}-{MM}-{DD}'); // '1970-01-01'
         */
        pattern = pattern || '{YYYY}-{MM}-{DD} {hh}:{mm}:{ss}';
        if (
            isNaN(date.getDate())
        ) {
            return 'invalid date';
        }

        var f = function(n) {
            return n < 10 ? '0' + n : n;
        };
        var lms = function(ms) {
            var str = ms.toString();
            var len = str.length;
            return len === 3 ? str : len === 2 ? '0' + str : '00' + str;
        };
        var y = String(date.getFullYear());
        var mo = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var mi = date.getMinutes();
        var s = date.getSeconds();
        var ms = date.getMilliseconds();

        return pattern.replace('{YYYY}', y)
                      .replace('{MM}', f(mo))
                      .replace('{DD}', f(d))
                      .replace('{hh}', f(h))
                      .replace('{mm}', f(mi))
                      .replace('{ss}', f(s))
                      .replace('{lms}', lms(ms))
                      .replace('{YY}', y.substring(2))
                      .replace('{M}', mo)
                      .replace('{D}', d)
                      .replace('{h}', h)
                      .replace('{m}', mi)
                      .replace('{s}', s)
                      .replace('{ms}', ms);
    }
};
module.exports = util;

