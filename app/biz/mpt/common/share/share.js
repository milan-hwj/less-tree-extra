/**
 * @desc    通用分享类
 * @author  wenjun.he@husor.com.cn
 * @date    16/09/22
 * @usega   import shareConfig from 'xxx/share';
 *          shareConfig({
 *              data: resp.share_info,
 *              successCb: () => {
 *                  if (env.app.isWeixin) {
 *                      $('#J_share-mask').addClass('hidden');
 *                      // 统计加一
 *                      ptLog.stat({
 *                          json: {
 *                              share: 1
 *                          }
 *                      });
 *                  }
 *              },
 *              cancelCb: () => {
 *                  if (env.app.isWeixin) {
 *                      $('#J_share-mask').addClass('hidden');
 *                  }
 *              },
 *              configCb: (wxTool) => {
 *                  wxTool.hideMenuItems(['menuItem:share:timeline']);
 *              }
 *          });
 */

// 所有分享必须实现config接口
import wx from './wxshare';
import app from './appshare';
import env from '@beibei/env';

const getHandle = () => {
    let handle = wx;
    if (env.app.isBeibei) {
        handle = app;
    }
    return handle;
};
const config = (opt) => {
    const handle = getHandle();
    handle.config(opt);
};
export default config;
