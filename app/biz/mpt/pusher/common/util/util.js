const util = {
    dateFormat: (date, pattern = '{YYYY}-{MM}-{DD} {hh}:{mm}:{ss}') => {
        /*
         * @description : 日期格式化
         * @param       : {date  } date    , 待格式化输出的日期对象
         * @param       : {string} pattern , 格式描述
         * @syntax      : utils.FMT.date(new Date(0), '{YY}-{MM}-{DD}'); // '1970-01-01'
         */
        if (
            isNaN(date.getDate())
        ) {
            return 'invalid date';
        }

        const f = (n) => {
            return n < 10 ? `0${n}` : n;
        };
        const lms = (ms) => {
            const str = ms.toString();
            const len = str.length;
            return len === 3 ? str : len === 2 ? `0${str}` : `00${str}`;
        };
        const y = String(date.getFullYear());
        const mo = date.getMonth() + 1;
        const d = date.getDate();
        const h = date.getHours();
        const mi = date.getMinutes();
        const s = date.getSeconds();
        const ms = date.getMilliseconds();

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
    },
    getQueryString: (name) => {
        const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
        const r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return null;
    },
    getAbsolutePath: (path) => `//m.beibei.com/${path}`
};
export default util;
