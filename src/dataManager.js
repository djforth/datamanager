import ajaxFetch from '@djforth/ajax-es6-fp/fetch';
import moment from 'moment-strftime';
import Immutable from 'immutable';
import _ from 'lodash';

const addIds = data =>
  data.map(d => {
    if (d.has('id')) return d;
    return d.set('id', _.uniqueId());
  });

const mergeList = (current, merge) =>
  current.map(data => {
    let merger = merge.find(m => data.get('id') === m.get('id'));
    if (merger) return data.merge(merger);
    return data;
  });

const unionLists = (current, update) => {
  let ids = current.map(d => d.get('id')).toArray();
  let data = addIds(update);
  let merge = data.filter(d => _.includes(ids, d.get('id')));
  let adding = data.filter(d => !_.includes(ids, d.get('id')));
  let newData = mergeList(current, merge);
  return newData.concat(adding);
};

export default class DataManager {
  add(d) {
    // Adding comment
    this.addToHistory();
    let m = this.manageDates(_.isArray(d) ? d : [d]);
    let newData;
    let adding = Immutable.fromJS(m);

    if (this.data) {
      newData = unionLists(this.data, adding);
    } else {
      newData = adding;
    }
    this.data = newData.map(dta => this.addDefaults(dta));
  }

  addDates(item, keys) {
    _.forIn(item, (v, k) => {
      if (_.includes(keys, k) && !_.isNull(item)) {
        let dateFmt = moment(v);
        item[k] = dateFmt.toDate();
        let key = `${k}Df`;
        item[key] = dateFmt;
      }
    });

    return item;
  }

  addDefaults(d) {
    let def = d;
    if (this.defaults) {
      _.forIn(this.defaults, (v, k) => (def = d.set(k, v)));
    }
    return def;
  }

  addId() {
    this.addToHistory();
    this.data = this.data.map(d => {
      let dta = d;
      if (!d.has('id')) {
        dta = d.set('id', _.uniqueId());
      }

      return dta;
    });
  }

  addToHistory() {
    if (this.data) {
      this.history.push(this.data); // sets up history
    }
  }

  dateSearch(key, st, fn) {
    // let sort = this.sort(key);
    if (!(_.isDate(st) && _.isDate(fn))) {
      throw new Error('Start and finish must be dates');
    }

    return this.data.filter(d => {
      let item = d.get(key);
      return item > st && item < fn;
    });
  }

  clearAll() {
    this.addToHistory();
    this.data = null;
  }

  constructor(defaults, ...args) {
    // this.ajaxPromises = new AjaxPromises();
    this.data = null;

    this.history = [];
    this.keys = null;
    // this.last     = null;
    this.cid = _.uniqueId('c');

    // let args = Array.prototype.slice.call(arguments);

    this.defaults = defaults;

    if (_.isArray(args[0])) {
      this.add(args.shift());
    }

    let f = _.last(args); // If fetch boolean set
    let fet = _.isBoolean(f) ? args.pop() : false;

    if (args.length > 0) {
      this.init(args[0], fet);
    } else {
      this.init(fet);
    }
  }

  // create(data) {
  //   if (this.dataCheck(data)) {
  //     this.add(data);

  //     this.setUrl();

  //     return this.ajaxPromises.create(data).catch(err => {
  //       throw new Error(err);
  //     });
  //   }

  //   return null;
  // }

  dataCheck(d) {
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

  // destroy(id) {
  //   if (this.dataCheck(id)) {
  //     this.setUrl();

  //     let del = this.remove(id);
  //     if (del) {
  //       return this.ajaxPromises.destroy(del.toJS()).catch(err => {
  //         throw new Error(err);
  //       });
  //     }
  //   }

  //   return null;
  // }

  formatDate(id, key, fmt = '%d/%m/%Y') {
    let item = _.isNumber(id) ? this.findById(id) : id;
    let df = item.get(`${key}Df`);
    if (df) {
      return df.strftime(fmt);
    }

    return '';
  }

  getDateKeys(item) {
    /* eslint-disable max-len */
    let dateRegExp = new RegExp(/^\s*(\d{4})-(\d{2})-(\d{2})+!?(\s(\d{2}):(\d{2})|\s(\d{2}):(\d{2}):(\d+))?$/);
    /* eslint-enable */
    let dateKeys = [];
    _.forIn(item, (v, k) => {
      if (_.isString(v)) {
        let dateMatch = v.match(dateRegExp);
        if (!_.isNull(dateMatch)) {
          dateKeys.push(k);
        }
      }
    });

    return dateKeys;
  }

  each(...args) {
    // let args = Array.prototype.slice.call(arguments);
    let func = args[0];
    let context = args[1];
    if (!_.isFunction(func)) {
      throw new Error('Must be a function');
    }

    if (_.isNull(this.data)) {
      throw new Error('Please add data to iterating');
    }

    if (context) {
      this.data.forEach(func.bind(context));
    } else {
      this.data.forEach(func);
    }
  }

  fetch(progress, clear = false) {
    if (clear) {
      this.clearAll();
    }

    const uri = _.isFunction(this.url) ? this.url() : this.url;
    let fetchData = ajaxFetch(uri);
    return fetchData
      .then(data => {
        this.add(data);
        return data;
      })
      .catch(err => {
        throw new Error(err);
      });
  }

  findById(id) {
    return this.data.find(d => d.get('id') === id);
  }

  findByIndex(i) {
    return this.data.get(i);
  }

  getAll() {
    return this.data;
  }

  getKeys(hard = false) {
    if (this.data.size > 0 && (!this.keys || hard)) {
      let item = this.data.first();
      let k = item.keySeq();
      this.keys = k.toJS();
    }

    return this.keys;
  }

  init(fet) {
    if (fet) {
      this.fetch();
    }
  }

  manageDates(items) {
    let dateKeys = [];
    let i = 0;
    // Checks first 20 records
    do {
      dateKeys = this.getDateKeys(items[i]);
      i++;
    } while (_.isEmpty(dateKeys) && i < 20);

    if (_.isEmpty(dateKeys)) {
      return items;
    }

    return _.map(items, item => {
      let keys = this.getDateKeys(item);
      return this.addDates(item, keys);
    });
  }

  remove(id) {
    let del = this.findById(id);

    if (del) {
      let i = this.data.indexOf(del);
      this.data = this.data.delete(i);
      return del;
    }
    this.warn("Can't find item");
    return null;
  }

  resetHard(i) {
    this.resetTo(i);
    this.history = this.history.splice(0, i);
  }

  resetTo(i) {
    this.data = this.history[i];
  }

  search(val, keys) {
    if (this.dataCheck(val)) {
      let regex = new RegExp(val, 'i');
      return this.data.filter(d => {
        if (keys.length > 1) {
          let values = d.filter((v, k) => _.includes(keys, k));
          let all = values
            .valueSeq()
            .toJS()
            .join(' ');

          return all.search(regex) > -1;
        } else {
          let key = keys[0];
          if (d.has(key)) {
            let value = d.get(key);
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

  sort(key, asc = true) {
    // this.addToHistory();
    return this.data.sort((a, b) => {
      let itemA = asc ? a.get(key) : b.get(key);
      let itemB = asc ? b.get(key) : a.get(key);
      if (_.isString(itemA) && _.isString(itemB)) {
        itemA = itemA.toLowerCase();
        itemB = itemB.toLowerCase();
      }
      return this.sortAlgorithm(itemA, itemB);
    });
  }

  sortAlgorithm(itemA, itemB) {
    if (itemA < itemB) {
      return -1;
    }

    if (itemA > itemB) {
      return 1;
    }

    return 0;
  }

  // setUrl() {
  //   this.uri = _.isFunction(this.url) ? this.url() : this.url;
  //   // this.ajaxPromises.addUrl(uri);
  // }

  // sync(id) {
  //   let send = this.findById(id);
  //   this.setUrl();

  //   return this.ajaxPromises.update(send.toJS(), id).catch(err => {
  //     throw new Error(err);
  //   });
  // }

  update(id, updates, sync = false) {
    if (this.dataCheck(updates)) {
      this.addToHistory();
      this.data = this.data.map(d => {
        if (String(d.get('id')) === String(id)) {
          return this.updateItem(d, updates);
        }

        return d;
      });

      if (sync) {
        this.sync(id);
      }
    }

    return null;
  }

  updateItem(item, data) {
    let update;
    _.forIn(data, (v, k) => (update = item.set(k, v)));
    return update;
  }

  updateAll(updates) {
    if (this.dataCheck(updates)) {
      this.addToHistory();

      this.data = this.data.map(d => this.updateItem(d, updates));
    }
    return null;
  }

  warn(warning) {
    /* eslint-disable no-console*/
    if (console.warn) {
      console.warn(warning);
    }
    /* eslint-enable*/
  }
}

// module.exports = DataManager;
