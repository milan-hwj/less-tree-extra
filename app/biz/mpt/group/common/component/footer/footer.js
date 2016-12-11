import './index.less';

class Footer {
    constructor(text = '都逛到这了，再逛逛呗~') {
        this.text = text;
    }
    appendTo(selector) {
        this.el = `<footer><p class="end-tips J_end-tips">${this.text}</p></footer>`;
        $(selector).append(this.el);
    }
    remove() {
        $(this.el).remove();
    }
}

export default Footer;

