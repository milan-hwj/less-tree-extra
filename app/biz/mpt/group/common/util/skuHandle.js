import _ from 'lodash';

const Sku = function (data, debug) {
    this.debug = debug || false;
    // sku相关字段赋值
    this.sku_id_map = data.sku.sku_id_map;
    this.sku_kv_map = data.sku.sku_kv_map;
    this.sku_stock_map = data.sku.sku_stock_map;
    _.each(this.sku_stock_map, (value, key) => {
        this.sku_stock_map[key].value =
            _.compact(_.without(key.split('v'), 'v'));
    });
    this.init(data);
};

Sku.prototype = {
    constructor: Sku,
    _debug(...params) {
        this.debug && console.log(params);
    },
    init(data) {
        // 已选规格
        this.selectedPropsList = [];
        this.map = {};
        this.cacheValid = {};
        this._processStock(data);
        this._processInfo();
        this.propIdList = _.keys(this.sku_id_map);
        this.isSingleSku = this.checkIsSingleSku();
        // 默认规格
        this.sku = _.find(this.sku_stock_map, (item) => {
            if (item.stock !== 0) {
                this.selectedPropsList =
                    _.map(item.value, (id) => id * 1);
                return true;
            }
            return false;
        });
        this._calculate();
    },
    // 处理活动库存
    _processStock(data) {
        const type = data.item_fight_group && data.item_fight_group.activity_type;
        const eventStock = data.item_fight_group && data.item_fight_group.try_stock * 1;
        if (eventStock && (type === 3 || type === 4)) {
            _.forEach(this.sku_stock_map, (item) => {
                item.stock = eventStock;
            })
        }
    },
    // 处理商品主要信息
    _processInfo() {
        this.propMap = {};
        _.each(this.sku_id_map, (item, key) => {
            const items = [];
            _.each(item, (id) => {
                items.push({
                    id,
                    name: this.sku_kv_map[`v${id}`]
                });
            });
            this.propMap[key] = {
                name: this.sku_kv_map[`k${key}`],
                id: key,
                items
            };
        });
    },
    checkIsSingleSku() {
        return _.without(_.map(
                this.sku_stock_map, (item) => item.stock), 0).length === 1;
    },
    // 选取规格时处理函数
    add(propID) {
        const key = propID * 1;
        // 相同规格下同组的规格id集合
        const group = _.find(this.sku_id_map, (list) =>
            _.indexOf(list, key) > -1);
        this._debug('add', key);

        if (typeof group === 'undefined') {
            throw new Error('不存在的key');
        }

        // 删除相同规格下的其他id
        this.selectedPropsList = _.difference(this.selectedPropsList, group);
        this.selectedPropsList.push(key);
        this._calculate();
    },
    remove(propID) {
        const key = propID * 1;
        this._debug('remove', key);
        this.selectedPropsList = _.without(this.selectedPropsList, key);
        this._calculate();
    },
    // 获取sku信息
    getSku() {
        return this.sku;
    },
    _calculate() {
        const props = [...this.selectedPropsList];
        let id;
        let propSelected = [];

        _.each(this.sku_id_map, (list) => {
            id = null;
            propSelected = [...props];
            propSelected = _.reject(propSelected, (v) =>
                    _.find(list, (_item) => {
                        if (_item === v) {
                            id = v;
                            return true;
                        }
                        return false;
                    })
            );

            _.each(list, (skuId) => {
                if (skuId === id) {
                    this.map[skuId] = 1;
                } else if (this._checkStock([skuId].concat(propSelected))) {
                    this.map[skuId] = 0;
                } else {
                    this.map[skuId] = -1;
                }
            });

        });
        this.sku = this._findSku(props);
    },
    _findSku(props) {
        return ((props.length ===
        _.keys(this.sku_id_map).length) && this._checkStock(props));
    },
    _checkStock(props) {
        let key = '';

        _.each(props.sort((a, b) => (a - b)), (item) => {
            key = `${key}v${item}`;
        });

        if (typeof this.cacheValid[key] !== 'undefined') {
            return this.cacheValid[key];
        }

        this.cacheValid[key] = _.find(this.sku_stock_map, (sku) =>
            ((sku.stock > 0) &&
            _.every(props, (prop) =>
            _.indexOf(sku.value, `${prop}`) > -1))
        );

        return this.cacheValid[key];
    },
    getInfo() {
        let text;
        if (this.getSku()) {
            text = _.map(_.map(this.selectedPropsList,
                    (id) => this.sku_kv_map[`v${id}`]),
                (str) => `"${str}"`).join(' ');
            return `已选 ${text}`;
        }

        const selectedProps = [];
        _.each(this.sku_id_map, (list, key) =>
                _.each(this.selectedPropsList, (id) => {
                    if (list.indexOf(id) > -1) {
                        selectedProps.push(key);
                    }
                })
        );
        const unSelectedProps = _.difference(this.propIdList, selectedProps);
        text = _.map(unSelectedProps,
            (id) => this.sku_kv_map[`k${id}`]).join(' ');
        return `请选择 ${text}`;
    }
};

export default Sku;
