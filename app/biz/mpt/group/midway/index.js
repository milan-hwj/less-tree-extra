// 拼团中间页
import '@beibei/tingyun';

(function() {
    //中间页
    const redirect = () => {
        const key = 'fromWxFollowPage';
        const expired = '_expired';
        const uri = localStorage.getItem(key);
        const expiredTime = localStorage.getItem(expired) || 0;
        if (uri && uri.indexOf('http') !== -1 && Date.now() < expiredTime) {
            location.href = uri;
        } else {
            location.href = '/gaea_pt/mpt/group/channel.html';
        }
    };

    redirect();
})();