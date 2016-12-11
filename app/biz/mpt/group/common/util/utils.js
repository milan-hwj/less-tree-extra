/**
 * Created by shuizai on 16/9/10.
 */
// 格式化价格（保留一位小数）
export const priceFormat = (price) => (
    price / 100
);

// 格式化日期数字
export const formatDateNumber = (n) => {
    if (n < 10) {
        return (`0${n}`).slice(-2);
    }
    return n;
};

// 根据时间戳获取时间
export const timeFormat = ({ time, type }) => {
    const oDate = new Date(time * 1000);
    const year = oDate.getFullYear();
    const month = formatDateNumber(oDate.getMonth() + 1);
    const date = formatDateNumber(oDate.getDate());
    const hours = formatDateNumber(oDate.getHours());
    const minutes = formatDateNumber(oDate.getMinutes());

    if (type === 1) {
        return `${month}月${date}日${hours}:${minutes}`;
    } else if (type === 2) {
        return `${year}.${month}.${date} ${hours}`;
    }
    return `${year}.${month}.${date} ${hours}:${minutes}`;
};

// 根据开始和结束的时间戳获得剩余时间
export const gapTime = (begin, end) => {
    if (begin > end) {
        return false;
    }
    const gapObj = {
        day: '',
        hour: '',
        minute: '',
        second: ''
    };
    const gap = (end - begin);

    if (gap < 0) {
        return gapObj;
    }
    const _day = 24 * 3600;
    const _hour = 3600;
    const _minute = 60;
    let temp;

    gapObj.day = parseInt(gap / _day, 10); //得到剩余天数
    temp = gap - gapObj.day * _day;
    gapObj.hour = parseInt(temp / _hour); //得到剩余小时数
    temp = temp - gapObj.hour * _hour;
    gapObj.minute = parseInt(temp / _minute); //得到剩余分钟数
    gapObj.second = parseInt(temp - gapObj.minute * _minute); //得到剩余秒数

    return gapObj;
};

// 根据剩余时间执行倒计时并写入到DOM里
export const downTimer = ({ obj, $DOM, role }) => {
    if (!obj) {
        return
    }
    const timer = window.setInterval(() => {
        obj.second--;
        if (obj.second < 0) {
            obj.minute--;
            obj.second = 59;
            if (obj.minute < 0) {
                obj.minute = 59;
                obj.hour--;
                if (obj.hour < 0) {
                    obj.day--;
                    obj.hour = 23;
                    if (obj.day < 0) {
                        clearInterval(timer);
                        obj.day = 0;
                        obj.hour = 0;
                        obj.minute = 0;
                        obj.second = 0;
                    }
                }
            }
        }
        var insertHTMl = [];
        if (role === 'pintuan') {
            insertHTMl = [
                '<label>' + obj.day + '</label>天',
                '<label>' + formatDateNumber(obj.hour) + '</label>:',
                '<label>' + formatDateNumber(obj.minute) + '</label>:',
                '<strong>' + formatDateNumber(obj.second) + '</strong>'
            ];
        } else if (role === 'pintuan-pay') {
            insertHTMl = [
                '剩余',
                '<label>' + obj.day + '</label>天',
                '<label>' + obj.hour + '</label>小时',
                '<label>' + obj.minute + '</label>分',
                '<label>' + obj.second + '</label>秒'
            ];

            if (obj.day <= 0) {
                insertHTMl = [
                    '剩余',
                    '<label>' + obj.hour + '</label>小时',
                    '<label>' + obj.minute + '</label>分',
                    '<label>' + obj.second + '</label>秒'
                ];

                if (obj.hour <= 0) {
                    insertHTMl = [
                        '剩余',
                        '<label>' + obj.minute + '</label>分',
                        '<label>' + obj.second + '</label>秒'
                    ];

                    if (obj.minute <= 0) {
                        insertHTMl = [
                            '剩余',
                            '<label>' + obj.second + '</label>秒'
                        ];

                        if (obj.second <= 0) {
                            insertHTMl = ["已结束"];
                        }
                    }
                }
            }

        } else if (role === 'pintuan-home') {
            insertHTMl = [
                '<label>' + formatDateNumber(24 * obj.day + obj.hour * 1) + '</label>:',
                '<label>' + formatDateNumber(obj.minute) + '</label>:',
                '<label>' + formatDateNumber(obj.second) + '</label>'
            ];
            $DOM.html(insertHTMl.join(''));
            return;
        } else {
            insertHTMl = [
                '<label>' + obj.day + '</label>天',
                '<label>' + formatDateNumber(obj.hour) + '</label>小时',
                '<label>' + formatDateNumber(obj.minute) + '</label>分',
                '<label>' + formatDateNumber(obj.second) + '</label>秒'
            ];
        }

        if (obj.day === 0 &&
            obj.hour === 0 &&
            obj.minute === 0 &&
            obj.second === 0) {
            insertHTMl = ['已结束'];
        }

        $DOM.html(insertHTMl.join(''));
    }, 1000);
};
