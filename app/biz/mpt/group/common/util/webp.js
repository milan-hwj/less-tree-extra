import env from '@beibei/env';
const IS_IOS_SUPPORT = (env.app.isBeibei || env.app.isBeibeiHD) && env.app.version.gte("4.2.0"); // ios客户端在4.2.0版本以上支持webp

const check = function () {
    return new Promise((resolve, reject) => {
        const storage = window.localStorage;
        if (!storage || typeof storage !== 'object') {
            resolve(false);
            return;
        }
        const name = 'webpa'; // webp available
        if (IS_IOS_SUPPORT || storage.getItem(name) === 'available') {
            storage.setItem(name, 'available');
            resolve(true);
        } else if (!storage.getItem(name) ||
            (storage.getItem(name) !== 'available' && storage.getItem(name) !== 'disable')) {
            const img = new Image();
            img.onload = function () {
                try {
                    storage.setItem(name, 'available');
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            };

            img.onerror = function () {
                try {
                    storage.setItem(name, 'disable');
                    resolve(false);
                } catch (e) {
                    reject(e);
                }
            };
            img.src = 'data:image/webp;base64,UklGRjAAAABXRUJQVlA4ICQAAACyAgCdASoBAAEALy2Wy2WlpaWlpYEsSygABc6zbAAA/upgAAA=';
        }
    });
};

export default {
    check
}