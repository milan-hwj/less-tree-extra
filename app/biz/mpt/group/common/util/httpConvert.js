// 将cdn中http的图片替换为https
function convert(src) {
    if (src && window.location.protocol === 'https:') {
        return src.replace(/^(http)(:\/\/(\w+)\.hucdn\.com\/\S+)/i, (match, p1, p2)=> {
            return 'https' + p2;
        });
    }
    return src;
}
export default convert;