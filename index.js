"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Immutable = require("immutable");
var _ = require("lodash");

var AjaxPromises = require("ajax-es6-module");
var DateFormatter = require("date-formatter");

var DataManager = (function () {
  function DataManager(defaults) {
    _classCallCheck(this, DataManager);

    this.ajaxPromises = new AjaxPromises();
    this.data = null;

    this.history = [];
    this.keys = null;
    // this.last     = null;
    this.cid = _.uniqueId("c");

    // let args = Array.prototype.slice.call(arguments);

    this.defaults = defaults;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (_.isArray(args[0])) {
      this.add(args.shift());
    }

    var f = _.last(args); // If fetch boolean set
    var fet = _.isBoolean(f) ? args.pop() : false;

    if (args.length > 0) {
      this.init(args[0], fet);
    } else {
      this.init(fet);
    }
  }

  _createClass(DataManager, [{
    key: "add",
    value: function add(m) {
      var _this = this;

      //Adding comment
      this.addToHistory();

      m = _.isArray(m) ? m : [m];
      m = this.manageDates(m);
      var current = undefined,
          newData = undefined;
      if (this.data) {
        current = this.data.toJS();
        newData = _.union(current, m);
      } else {
        newData = m;
      }

      this.data = Immutable.fromJS(newData).map(function (d) {
        return _this.addDefaults(d);
      });
    }
  }, {
    key: "addDates",
    value: function addDates(item, keys) {
      _.forIn(item, function (v, k) {
        if (_.contains(keys, k)) {
          var dateFmt = new DateFormatter(v);
          item[k] = dateFmt.getDate();
          var key = k + "Df";
          item[key] = dateFmt;
        }
      });

      return item;
    }
  }, {
    key: "addDefaults",
    value: function addDefaults(d) {
      if (this.defaults) {
        _.forIn(this.defaults, function (v, k) {
          return d = d.set(k, v);
        });
      }
      return d;
    }
  }, {
    key: "addId",
    value: function addId() {
      this.addToHistory();
      this.data = this.data.map(function (d) {
        if (!d.has("id")) {
          d = d.set("id", _.uniqueId());
        }

        return d;
      });
    }
  }, {
    key: "addToHistory",
    value: function addToHistory() {
      if (this.data) {
        this.history.push(this.data); //sets up history
      }
    }
  }, {
    key: "dateSearch",
    value: function dateSearch(key, st, fn) {
      // let sort = this.sort(key);
      if (!(_.isDate(st) && _.isDate(fn))) {
        // console.log('No dates');
        throw new Error("Start and finish must be dates");
      }

      return this.data.filter(function (d) {
        var item = d.get(key);
        return item > st && item < fn;
      });
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      this.addToHistory();
      this.data = null;
    }
  }, {
    key: "create",
    value: function create(data) {
      if (this.dataCheck(data)) {
        this.add(data);

        this.setUrl();

        return this.ajaxPromises.create(data)["catch"](function (err) {
          throw new Error(err);
        });
      }

      return null;
    }
  }, {
    key: "dataCheck",
    value: function dataCheck(d) {
      if (!this.data || !d) {
        this.warn(!this.data ? "No Data to update" : "Updates are not defined ");
        // if(console.warn){
        //   let warning = (!this.data) ? "No Data to update" : "Updates are not defined ";
        //   console.warn(warning);
        // }

        return false;
      }

      return true;
    }
  }, {
    key: "destroy",
    value: function destroy(id) {
      if (this.dataCheck(id)) {

        this.setUrl();

        var del = this.remove(id);
        if (del) {
          return this.ajaxPromises.destroy(del.toJS())["catch"](function (err) {
            throw new Error(err);
          });
        }
      }

      return null;
    }
  }, {
    key: "formatDate",
    value: function formatDate(id, key) {
      var fmt = arguments[2] === undefined ? "%d/%m/%Y" : arguments[2];

      var item = _.isNumber(id) ? this.findById(id) : id;
      var df = item.get(key + "Df");
      // console.log("DateFormmater", df)
      if (df) {
        return df.formatDate(fmt);
      }

      return "";
    }
  }, {
    key: "getDateKeys",
    value: function getDateKeys(item) {
      var dateRegExp = new RegExp(/^\s*(\d{4})-(\d{2})-(\d{2})+!?(\s(\d{2}):(\d{2})|\s(\d{2}):(\d{2}):(\d+))?$/);
      var dateKeys = [];
      _.forIn(item, function (v, k) {
        var date_match = v.match(dateRegExp);
        if (!_.isNull(date_match)) {
          dateKeys.push(k);
        }
      });

      return dateKeys;
    }
  }, {
    key: "each",
    value: function each() {
      var args = Array.prototype.slice.call(arguments);
      var func = args[0];
      var context = args[1];
      if (!_.isFunction(func)) {
        throw new Error("Must be a function");
      }

      if (_.isNull(this.data)) {
        throw new Error("Please add data to iterating");
      }

      if (context) {
        this.data.forEach(func.bind(context));
      } else {
        this.data.forEach(func);
      }
    }
  }, {
    key: "fetch",
    value: function fetch(progress) {
      var clear = arguments[1] === undefined ? false : arguments[1];

      if (clear) {
        this.clearAll();
      }

      this.setUrl();

      return this.ajaxPromises.fetch(progress).then((function (data) {
        this.add(data);
        return data;
      }).bind(this))["catch"](function (err) {
        throw new Error(err);
      });
    }
  }, {
    key: "findById",
    value: function findById(id) {
      return this.data.find(function (d) {
        return d.get("id") === id;
      });
    }
  }, {
    key: "findByIndex",
    value: function findByIndex(i) {
      return this.data.get(i);
    }
  }, {
    key: "getAll",
    value: function getAll() {
      return this.data;
    }
  }, {
    key: "getKeys",
    value: function getKeys() {
      var hard = arguments[0] === undefined ? false : arguments[0];

      if (!this.keys || hard) {
        var item = this.data.first();
        var k = item.keySeq();
        this.keys = k.toJS();
      }

      return this.keys;
    }
  }, {
    key: "init",
    value: function init(fet) {
      if (fet) {
        this.fetch();
      }
    }
  }, {
    key: "manageDates",
    value: function manageDates(items) {
      var _this2 = this;

      var date_keys = this.getDateKeys(_.first(items));
      if (_.isEmpty(date_keys)) {
        return items;
      }

      return _.map(items, function (item) {
        return _this2.addDates(item, date_keys);
      });
    }
  }, {
    key: "remove",
    value: function remove(id) {
      var del = this.findById(id);

      if (del) {
        var i = this.data.indexOf(del);
        this.data = this.data["delete"](i);
        return del;
      }
      this.warn("Can't find item");
      return null;
    }
  }, {
    key: "resetHard",
    value: function resetHard(i) {
      this.resetTo(i);
      this.history = this.history.splice(0, i);
    }
  }, {
    key: "resetTo",
    value: function resetTo(i) {
      this.data = this.history[i];
    }
  }, {
    key: "search",
    value: function search(val, keys) {
      var _this3 = this;

      if (this.dataCheck(val)) {
        var _ret = (function () {
          var regex = new RegExp(val, "i");
          return {
            v: _this3.data.filter(function (d) {
              if (keys.length > 1) {

                var values = d.filter(function (v, k) {
                  return _.contains(keys, k);
                });
                var all = values.valueSeq().toJS().join(" ");

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
            })
          };
        })();

        if (typeof _ret === "object") return _ret.v;
      }

      return this.data;
    }
  }, {
    key: "sort",
    value: function sort(key) {
      var _this4 = this;

      var asc = arguments[1] === undefined ? true : arguments[1];

      // this.addToHistory();
      return this.data.sort(function (a, b) {
        var itemA = asc ? a.get(key) : b.get(key);
        var itemB = asc ? b.get(key) : a.get(key);
        if (_.isString(itemA) && _.isString(itemB)) {
          itemA = itemA.toLowerCase();
          itemB = itemB.toLowerCase();
        }
        return _this4.sortAlgorithm(itemA, itemB);
      });
    }
  }, {
    key: "sortAlgorithm",
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
    key: "setUrl",
    value: function setUrl() {
      var uri = _.isFunction(this.url) ? this.url() : this.url;
      this.ajaxPromises.addUrl(uri);
    }
  }, {
    key: "sync",
    value: function sync(id) {
      var send = this.findById(id);
      this.setUrl();

      return this.ajaxPromises.update(send.toJS(), id)["catch"](function (err) {
        throw new Error(err);
      });
    }
  }, {
    key: "update",
    value: function update(id, updates) {
      var _this5 = this;

      var sync = arguments[2] === undefined ? false : arguments[2];

      if (this.dataCheck(updates)) {
        this.addToHistory();
        this.data = this.data.map((function (d) {
          // console.log(d)
          if (String(d.get("id")) === String(id)) {
            return _this5.updateItem(d, updates);
          }

          return d;
        }).bind(this));

        if (sync) {
          this.sync(id);
        }
      }

      return null;
    }
  }, {
    key: "updateItem",
    value: function updateItem(item, data) {
      _.forIn(data, function (v, k) {
        return item = item.set(k, v);
      });
      return item;
    }
  }, {
    key: "updateAll",
    value: function updateAll(updates) {
      var _this6 = this;

      if (this.dataCheck(updates)) {
        this.addToHistory();

        this.data = this.data.map((function (d) {
          return _this6.updateItem(d, updates);
        }).bind(this));
      }
      return null;
    }
  }, {
    key: "warn",
    value: function warn(warning) {
      if (console.warn) {
        console.warn(warning);
      }
    }
  }]);

  return DataManager;
})();

module.exports = DataManager;

//# sourceMappingURL=index.js.map