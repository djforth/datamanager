(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', 'lodash/map', 'lodash/isEmpty', 'lodash/isFunction', 'lodash/isString', 'lodash/isNumber', 'lodash/isBoolean', 'lodash/last', 'lodash/isDate', 'lodash/uniqueId', 'lodash/isNull', 'lodash/includes', 'lodash/forIn', 'lodash/isArray', 'immutable', 'ajax-es6-module', 'moment-strftime'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('lodash/map'), require('lodash/isEmpty'), require('lodash/isFunction'), require('lodash/isString'), require('lodash/isNumber'), require('lodash/isBoolean'), require('lodash/last'), require('lodash/isDate'), require('lodash/uniqueId'), require('lodash/isNull'), require('lodash/includes'), require('lodash/forIn'), require('lodash/isArray'), require('immutable'), require('ajax-es6-module'), require('moment-strftime'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.map, global.isEmpty, global.isFunction, global.isString, global.isNumber, global.isBoolean, global.last, global.isDate, global.uniqueId, global.isNull, global.includes, global.forIn, global.isArray, global.immutable, global.ajaxEs6Module, global.momentStrftime);
    global.dataManager = mod.exports;
  }
})(this, function (module, exports, _map2, _isEmpty2, _isFunction2, _isString2, _isNumber2, _isBoolean2, _last2, _isDate2, _uniqueId2, _isNull2, _includes2, _forIn2, _isArray2, _immutable, _ajaxEs6Module, _momentStrftime) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _map3 = _interopRequireDefault(_map2);

  var _isEmpty3 = _interopRequireDefault(_isEmpty2);

  var _isFunction3 = _interopRequireDefault(_isFunction2);

  var _isString3 = _interopRequireDefault(_isString2);

  var _isNumber3 = _interopRequireDefault(_isNumber2);

  var _isBoolean3 = _interopRequireDefault(_isBoolean2);

  var _last3 = _interopRequireDefault(_last2);

  var _isDate3 = _interopRequireDefault(_isDate2);

  var _uniqueId3 = _interopRequireDefault(_uniqueId2);

  var _isNull3 = _interopRequireDefault(_isNull2);

  var _includes3 = _interopRequireDefault(_includes2);

  var _forIn3 = _interopRequireDefault(_forIn2);

  var _isArray3 = _interopRequireDefault(_isArray2);

  var _immutable2 = _interopRequireDefault(_immutable);

  var _ajaxEs6Module2 = _interopRequireDefault(_ajaxEs6Module);

  var _momentStrftime2 = _interopRequireDefault(_momentStrftime);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var DataManager = function () {
    _createClass(DataManager, [{
      key: 'add',
      value: function add(m) {
        var _this = this;

        // Adding comment
        this.addToHistory();

        m = (0, _isArray3.default)(m) ? m : [m];
        m = this.manageDates(m);
        var current = void 0,
            newData = void 0;
        if (this.data) {
          current = this.data.toJS();
          newData = union(current, m);
        } else {
          newData = m;
        }

        this.data = _immutable2.default.fromJS(newData).map(function (d) {
          return _this.addDefaults(d);
        });
      }
    }, {
      key: 'addDates',
      value: function addDates(item, keys) {
        (0, _forIn3.default)(item, function (v, k) {
          if ((0, _includes3.default)(keys, k) && !(0, _isNull3.default)(item)) {
            var dateFmt = (0, _momentStrftime2.default)(v);
            item[k] = dateFmt.toDate();
            var key = k + 'Df';
            item[key] = dateFmt;
          }
        });

        return item;
      }
    }, {
      key: 'addDefaults',
      value: function addDefaults(d) {

        if (this.defaults) {
          (0, _forIn3.default)(this.defaults, function (v, k) {
            return d = d.set(k, v);
          });
        }
        return d;
      }
    }, {
      key: 'addId',
      value: function addId() {
        this.addToHistory();
        this.data = this.data.map(function (d) {
          if (!d.has('id')) {
            d = d.set('id', (0, _uniqueId3.default)());
          }

          return d;
        });
      }
    }, {
      key: 'addToHistory',
      value: function addToHistory() {
        if (this.data) {
          this.history.push(this.data); // sets up history
        }
      }
    }, {
      key: 'dateSearch',
      value: function dateSearch(key, st, fn) {
        // let sort = this.sort(key);
        if (!((0, _isDate3.default)(st) && (0, _isDate3.default)(fn))) {
          // console.log('No dates');
          throw new Error('Start and finish must be dates');
        }

        return this.data.filter(function (d) {
          var item = d.get(key);
          return item > st && item < fn;
        });
      }
    }, {
      key: 'clearAll',
      value: function clearAll() {
        this.addToHistory();
        this.data = null;
      }
    }]);

    function DataManager(defaults) {
      _classCallCheck(this, DataManager);

      this.ajaxPromises = new _ajaxEs6Module2.default();
      this.data = null;

      this.history = [];
      this.keys = null;
      // this.last     = null;
      this.cid = (0, _uniqueId3.default)('c');

      // let args = Array.prototype.slice.call(arguments);

      this.defaults = defaults;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if ((0, _isArray3.default)(args[0])) {
        this.add(args.shift());
      }

      var f = (0, _last3.default)(args); // If fetch boolean set
      var fet = (0, _isBoolean3.default)(f) ? args.pop() : false;

      if (args.length > 0) {
        this.init(args[0], fet);
      } else {
        this.init(fet);
      }
    }

    _createClass(DataManager, [{
      key: 'create',
      value: function create(data) {
        if (this.dataCheck(data)) {
          this.add(data);

          this.setUrl();

          return this.ajaxPromises.create(data).catch(function (err) {
            throw new Error(err);
          });
        }

        return null;
      }
    }, {
      key: 'dataCheck',
      value: function dataCheck(d) {
        if (!this.data || !d) {
          if (!this.data) {
            this.warn('No Data to update');
          } else {
            this.warn('Updates are not defined');
          }
          return false;
        }

        return true;
      }
    }, {
      key: 'destroy',
      value: function destroy(id) {
        if (this.dataCheck(id)) {
          this.setUrl();

          var del = this.remove(id);
          if (del) {
            return this.ajaxPromises.destroy(del.toJS()).catch(function (err) {
              throw new Error(err);
            });
          }
        }

        return null;
      }
    }, {
      key: 'formatDate',
      value: function formatDate(id, key) {
        var fmt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '%d/%m/%Y';

        var item = (0, _isNumber3.default)(id) ? this.findById(id) : id;
        var df = item.get(key + 'Df');
        // console.log("DateFormmater", df)
        if (df) {
          return df.strftime(fmt);
        }

        return '';
      }
    }, {
      key: 'getDateKeys',
      value: function getDateKeys(item) {
        /* eslint-disable max-len */
        var dateRegExp = new RegExp(/^\s*(\d{4})-(\d{2})-(\d{2})+!?(\s(\d{2}):(\d{2})|\s(\d{2}):(\d{2}):(\d+))?$/);
        /* eslint-enable */
        var dateKeys = [];
        (0, _forIn3.default)(item, function (v, k) {
          if ((0, _isString3.default)(v)) {
            var date_match = v.match(dateRegExp);
            if (!(0, _isNull3.default)(date_match)) {
              dateKeys.push(k);
            }
          }
        });

        return dateKeys;
      }
    }, {
      key: 'each',
      value: function each() {
        // let args = Array.prototype.slice.call(arguments);
        var func = arguments.length <= 0 ? undefined : arguments[0];
        var context = arguments.length <= 1 ? undefined : arguments[1];
        if (!(0, _isFunction3.default)(func)) {
          throw new Error('Must be a function');
        }

        if ((0, _isNull3.default)(this.data)) {
          throw new Error('Please add data to iterating');
        }

        if (context) {
          this.data.forEach(func.bind(context));
        } else {
          this.data.forEach(func);
        }
      }
    }, {
      key: 'fetch',
      value: function fetch(progress) {
        var clear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (clear) {
          this.clearAll();
        }

        this.setUrl();

        return this.ajaxPromises.fetch(progress).then(function (data) {
          this.add(data);
          return data;
        }.bind(this)).catch(function (err) {
          throw new Error(err);
        });
      }
    }, {
      key: 'findById',
      value: function findById(id) {
        return this.data.find(function (d) {
          return d.get('id') === id;
        });
      }
    }, {
      key: 'findByIndex',
      value: function findByIndex(i) {
        return this.data.get(i);
      }
    }, {
      key: 'getAll',
      value: function getAll() {
        return this.data;
      }
    }, {
      key: 'getKeys',
      value: function getKeys() {
        var hard = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        if (this.data.size > 0 && (!this.keys || hard)) {
          var item = this.data.first();
          var k = item.keySeq();
          this.keys = k.toJS();
        }

        return this.keys;
      }
    }, {
      key: 'init',
      value: function init(fet) {
        if (fet) {
          this.fetch();
        }
      }
    }, {
      key: 'manageDates',
      value: function manageDates(items) {
        var _this2 = this;

        var date_keys = [];
        var i = 0;
        // Checks first 20 records
        do {
          date_keys = this.getDateKeys(items[i]);
          i++;
        } while ((0, _isEmpty3.default)(date_keys) && i < 20);

        if ((0, _isEmpty3.default)(date_keys)) {
          return items;
        }

        return (0, _map3.default)(items, function (item) {
          var keys = _this2.getDateKeys(item);
          return _this2.addDates(item, keys);
        });
      }
    }, {
      key: 'remove',
      value: function remove(id) {
        var del = this.findById(id);

        if (del) {
          var i = this.data.indexOf(del);
          this.data = this.data.delete(i);
          return del;
        }
        this.warn("Can't find item");
        return null;
      }
    }, {
      key: 'resetHard',
      value: function resetHard(i) {
        this.resetTo(i);
        this.history = this.history.splice(0, i);
      }
    }, {
      key: 'resetTo',
      value: function resetTo(i) {
        this.data = this.history[i];
      }
    }, {
      key: 'search',
      value: function search(val, keys) {
        if (this.dataCheck(val)) {
          var regex = new RegExp(val, 'i');
          return this.data.filter(function (d) {
            if (keys.length > 1) {
              var values = d.filter(function (v, k) {
                return (0, _includes3.default)(keys, k);
              });
              var all = values.valueSeq().toJS().join(' ');

              return all.search(regex) > -1;
            } else {
              var key = keys[0];
              if (d.has(key)) {
                var value = d.get(key);
                return String(value).search(regex) > -1;
              } else {
                return false;
              }
            }

            return true;
          });
        }

        return this.data;
      }
    }, {
      key: 'sort',
      value: function sort(key) {
        var _this3 = this;

        var asc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        // this.addToHistory();
        return this.data.sort(function (a, b) {
          var itemA = asc ? a.get(key) : b.get(key);
          var itemB = asc ? b.get(key) : a.get(key);
          if ((0, _isString3.default)(itemA) && (0, _isString3.default)(itemB)) {
            itemA = itemA.toLowerCase();
            itemB = itemB.toLowerCase();
          }
          return _this3.sortAlgorithm(itemA, itemB);
        });
      }
    }, {
      key: 'sortAlgorithm',
      value: function sortAlgorithm(itemA, itemB) {
        if (itemA < itemB) {
          return -1;
        }

        if (itemA > itemB) {
          return 1;
        }

        return 0;
      }
    }, {
      key: 'setUrl',
      value: function setUrl() {
        var uri = (0, _isFunction3.default)(this.url) ? this.url() : this.url;
        this.ajaxPromises.addUrl(uri);
      }
    }, {
      key: 'sync',
      value: function sync(id) {
        var send = this.findById(id);
        this.setUrl();

        return this.ajaxPromises.update(send.toJS(), id).catch(function (err) {
          throw new Error(err);
        });
      }
    }, {
      key: 'update',
      value: function update(id, updates) {
        var _this4 = this;

        var sync = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (this.dataCheck(updates)) {
          this.addToHistory();
          this.data = this.data.map(function (d) {
            // console.log(d)
            if (String(d.get('id')) === String(id)) {
              return _this4.updateItem(d, updates);
            }

            return d;
          });

          if (sync) {
            this.sync(id);
          }
        }

        return null;
      }
    }, {
      key: 'updateItem',
      value: function updateItem(item, data) {
        (0, _forIn3.default)(data, function (v, k) {
          return item = item.set(k, v);
        });
        return item;
      }
    }, {
      key: 'updateAll',
      value: function updateAll(updates) {
        var _this5 = this;

        if (this.dataCheck(updates)) {
          this.addToHistory();

          this.data = this.data.map(function (d) {
            return _this5.updateItem(d, updates);
          });
        }
        return null;
      }
    }, {
      key: 'warn',
      value: function warn(warning) {
        /* eslint-disable no-console*/
        if (console.warn) {
          console.warn(warning);
        }
        /* eslint-enable*/
      }
    }]);

    return DataManager;
  }();

  exports.default = DataManager;
  module.exports = exports['default'];
});
