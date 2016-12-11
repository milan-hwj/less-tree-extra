// 处理价格的整数与小数
const price = (num) => {
    const tempPrice = (num / 100).toString().split('.');
    return {
        priceInt: tempPrice[0],
        priceDec: tempPrice[1] ? `.${tempPrice[1]}` : ''
    };
};

export default price;
