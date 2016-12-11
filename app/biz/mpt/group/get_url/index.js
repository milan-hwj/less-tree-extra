import './index.less';

new Vue({
    el: '#app',
    data: {
        inputIidStr: '',
        inputGroupCodeStr: ''
    },
    computed: {
        iidArr() {
            return this.inputIidStr ? this.inputIidStr.split(';') : '';
        },
        groupCodeArr() {
            return this.inputGroupCodeStr ? this.inputGroupCodeStr.split(';') : '';
        },
        app_home_url() {
            let result = '';

            if (this.groupCodeArr.length) {
                this.groupCodeArr.forEach((groupCode) => {
                    if (groupCode) {
                        result += `http://m.beibei.com/mpt/group/home.html?group_code=${groupCode}&beibeiapp_info={"target":"bb/pintuan/detail","group_code":"${groupCode}"} <br>------<br>`;
                    }
                });
            }

            return result;
        },
        h5_home_url() {
            let result = '';

            if (this.groupCodeArr.length) {
                this.groupCodeArr.forEach((groupCode) => {
                    if (groupCode) {
                        result += `http://m.beibei.com/mpt/group/home.html?group_code=${groupCode} <br>------<br>`;
                    }
                });
            }

            return result;
        },
        app_detail_url() {
            let result = '';

            if (this.iidArr.length) {
                this.iidArr.forEach((iid) => {
                    if (iid) {
                        result += `http://m.beibei.com/gaea_pt/mpt/group/detail.html?iid=${iid}&beibeiapp_info={"target":"detail","iid":${iid}} <br>------<br>`;
                    }
                });
            }

            return result;
        },
        h5_detail_url() {
            let result = '';

            if (this.iidArr.length) {
                this.iidArr.forEach((iid) => {
                    if (iid) {
                        result += `http://m.beibei.com/gaea_pt/mpt/group/detail.html?iid=${iid} <br>------<br>`;
                    }
                });
            }

            return result;
        }
    }
})