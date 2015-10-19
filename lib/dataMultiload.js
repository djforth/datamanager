'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var DataManager = require('../lib/dataManager');
var _ = require('lodash');
var Immutable = require('immutable');
var AjaxPromises = require('ajax-es6-module');

var DataMultiLoad = (function (_DataManager) {
  function DataMultiLoad() {
    _classCallCheck(this, DataMultiLoad);

    _get(Object.getPrototypeOf(DataMultiLoad.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(DataMultiLoad, _DataManager);

  _createClass(DataMultiLoad, [{
    key: 'checkMulti',
    value: function checkMulti(data) {
      return !_.isArray(data) && _.isNumber(data.page) && _.isBoolean(data.ended);
    }
  }, {
    key: 'checkLast',
    value: function checkLast(data) {
      return data('ended');
    }
  }, {
    key: 'createAjax',
    value: function createAjax() {
      this.ajaxList = this.ajaxList || [];
      var ajax = new AjaxPromises();
      this.ajaxList.push(ajax);
      return ajax;
    }
  }, {
    key: 'createProgress',
    value: function createProgress(func) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argsApply = args;
      var progFn = func;
      return function () {
        var newArgs = Array.prototype.slice.call(arguments);
        progFn.apply(this, argsApply.concat(newArgs));
      };
    }
  }, {
    key: 'dataAdd',
    value: function dataAdd(data) {
      this.dataList = this.dataList || [];
      if (this.checkMulti(data)) {
        var d = this.setData(data);
        this.add(d('data'));
        this.dataList.push(d);
        return d;
      } else {
        this.add(data);
        return data;
      }
    }
  }, {
    key: 'fetch',
    value: function fetch(progress) {
      var _this = this;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      this.manageUrl.apply(this, args);

      if (_.isString(this.url)) {
        return this.fetcher(progress, function (data) {
          return _this.dataAdd(data);
        }, this.ajaxPromises);
      }

      // return this.fetchMulti(progress);
    }
  }, {
    key: 'fetcher',
    value: function fetcher(progFn, thenFn) {
      for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
        args[_key3 - 2] = arguments[_key3];
      }

      var ajaxProm = _.find(args, function (arg) {
        return _.isFunction(arg) || _.isObject(arg);
      });
      var limit = _.find(args, function (arg) {
        return _.isNumber(arg);
      });

      var ajax = ajaxProm ? ajaxProm : this.createAjax();
      var url = _.isFunction(this.url) ? this.url(limit) : this.url;
      ajax.setUrl(url);

      return ajax.fetch(progFn).then(thenFn)['catch'](function (err) {
        throw new Error(err);
      });
    }
  }, {
    key: 'fetchFirst',
    value: function fetchFirst(progress) {
      var _this2 = this;

      return this.fetcher(progress, function (data) {
        var d = _this2.dataAdd(data);
        if (!d('last')) {
          return _this2.fetchMulti(progress, d('amount'));
        }

        return d('data');
      });
    }
  }, {
    key: 'fetchMulti',
    value: function fetchMulti(progress) {
      var _this3 = this;

      this.promiseList = [];
      var i = 0;

      do {
        var n = i;
        i++;
        var promise = this.fetcher(this.createProgress(progress, this.url(false), n), function (data) {
          var d = _this3.dataAdd(data);
          if (d('last')) {
            return { data: d('data'), last: d('last') };
          }

          return d('data');
        });

        this.promiseList.push(promise);
      } while (this.url(false));

      return Promise.all(this.promiseList);
    }
  }, {
    key: 'getUrl',
    value: function getUrl(url) {
      var identifier = arguments[1] === undefined ? '' : arguments[1];
      var limit = arguments[2] === undefined ? 1 : arguments[2];

      if (identifier === '') {
        return url;
      }

      var baseId = identifier;
      var baseUrl = url;
      var count = 0;
      var limit = limit;
      return function () {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var l = _.find(args, function (arg) {
          return _.isNumber(arg);
        });
        var inc = _.find(args, function (arg) {
          return _.isBoolean(arg);
        });

        var increment = _.isBoolean(inc) ? inc : true;
        limit = l ? l : limit;

        if (count === limit) {
          return false;
        }

        var path = baseUrl.replace(baseId, count);

        if (increment) {
          count++;
        }

        return path;
      };
    }
  }, {
    key: 'setData',
    value: function setData(d) {
      var data = d;

      return function (attr) {
        return data[attr];
      };
    }
  }, {
    key: 'manageUrl',
    value: function manageUrl(url, id, limit) {
      if (_.isEmpty(url) && _.isUndefined(this.url)) {
        throw new Error('not a valid url');
      }

      this.url = this.getUrl(url, id, limit);
      if (_.isString(this.url)) {
        this.ajaxPromises.addUrl(this.url);
      }
    }
  }]);

  return DataMultiLoad;
})(DataManager);

module.exports = DataMultiLoad;
//# sourceMappingURL=dataMultiload.js.map