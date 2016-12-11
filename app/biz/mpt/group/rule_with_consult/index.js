/* 
* @Author: gyp
* @Date:   2016-06-01 11:15:04
* @Last Modified by:   gyp
* @Last Modified time: 2016-06-01 15:21:46
* @desc    拼团 - 常见问题
*/
import '@beibei/tingyun';
import isp from 'unit/common/js/isp/isp';
import env from "@beibei/env";

import './index.less';

isp();


{
    // 客户端会在customerService 调用时，给url带上iid参数
    // 然后在pintuan_faq_redirect 给 跳转的客服页面带上 type=pintuan
    const appUrl = 'beibei://action?target=customerService&desc=咨询客服&url='
        + encodeURI(window.location.protocol + '//m.beibei.com/mpt/group/help/myService/pintuan_faq_redirect.html');
    const h5Url = encodeURI(window.location.protocol + '//m.beibei.com/help/myService.html?type=pintuan');

    console.info(12);

    if (env.husorApp && env.husorApp.version.gte('2.8.0')) {
        $('#contact_link').attr('href', appUrl);
        $(".contact").removeClass('hidden');

    } else {
        var param = decodeURIComponent(window.location.href.split('?')[1]);
        var strs = param.split('&');
        var params = {};
        for(var i = 0, l = strs.length; i < l; i++){
            var key = strs[i].split('=')[0],
                value = strs[i].substr(key.length + 1);
            params[key] = value;
        }
        if(params['iid']) {
            $(".contact").removeClass('hidden');
            $('#contact_link').attr('href', h5Url + '&iid='+ params['iid']);
        }
    }
}

    

