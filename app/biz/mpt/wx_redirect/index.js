var param = decodeURIComponent(window.location.href.split('?')[1]);
var strs = param.split('&');
var params = {};
for (var i = 0, l = strs.length; i < l; i++) {
    var key = strs[i].split('=')[0];
    var value = strs[i].substr(key.length + 1);
    params[key] = value;
}
if (typeof params.redirect === 'string' && params.redirect.indexOf('?') !== -1) {
    document.cookie = 'wx_sign=' + params.code + ';path=/;domain=.beibei.com';
    window.location.href = params.redirect + '&code=' + params.code;
} else {
    document.cookie = 'wx_sign=' + params.code + ';path=/;domain=.beibei.com';
    window.location.href = params.redirect + '?code=' + params.code;
}