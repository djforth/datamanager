const Immutable = require("immutable");
const _         = require("lodash");

const AjaxPromises  = require("ajax-es6-module");
const DateFormatter = require("date-formatter");

class DataManager {
  add(m){
    //Adding comment
    this.addToHistory();

    m = (_.isArray(m)) ? m : [m];
    m = this.manageDates(m);
    let current, newData;
    if(this.data){
      current = this.data.toJS();
      newData = _.union(current, m);
    } else {
      newData = m;
    }

    this.data = Immutable.fromJS(newData).map((d)=> this.addDefaults(d));
  }


  addDates(item, keys){
    _.forIn(item, function(v, k) {
      if(_.contains(keys, k)  && !(_.isNull(item) || _.isUndefined(item)){
        let dateFmt = new DateFormatter(v);
        item[k]   = dateFmt.getDate();
        let key   = `${k}Df`;
        item[key] = dateFmt;
      }
    });

    return item;
  }

  addDefaults(d){
    if(this.defaults){
      _.forIn(this.defaults, (v, k)=> d = d.set(k, v));
    }
    return d;
  }

  addId(){
    this.addToHistory();
    this.data = this.data.map((d)=>{
      if(!d.has("id")){
        d = d.set("id", _.uniqueId());
      }

      return d;
    });
  }

  addToHistory(){
    if(this.data) {
      this.history.push(this.data); //sets up history
      if(this.history.length > 3){
        this.history.shift();
      }
    }
  }

  dateSearch(key, st, fn) {
    // let sort = this.sort(key);
    if(!(_.isDate(st) && _.isDate(fn))){
      // console.log('No dates');
      throw new Error("Start and finish must be dates");
    }

    return this.data.filter((d)=>{
      var item = d.get(key);
      return item > st && item < fn;
    });

  }


  clearAll(){
    this.addToHistory();
    this.data = null;
  }



  constructor(defaults, ...args){
    // console.log("args", args);
    this.ajaxPromises = new AjaxPromises();
    this.data         = null;

    this.history  = [];
    this.keys     = null;
    // this.last     = null;
    this.cid      = _.uniqueId("c");

    // let args = Array.prototype.slice.call(arguments);

    this.defaults     = defaults;


    if(_.isArray(args[0])){
      this.add(args.shift());
    }

    let f   = _.last(args); // If fetch boolean set
    let fet = (_.isBoolean(f)) ? args.pop() : false;

    if(args.length > 0){
      this.init(args[0], fet);
    } else {
      this.init(fet);
    }

  }

  create(data){
    if(this.dataCheck(data)){
      this.add(data);

      this.setUrl();

      return this.ajaxPromises.create(data).catch((err)=>{
        throw new Error(err);
      });

    }

    return null;
  }

  dataCheck(d){
    if(!this.data || !d){
      this.warn((!this.data) ? "No Data to update" : "Updates are not defined ");
      // if(console.warn){
      //   let warning = (!this.data) ? "No Data to update" : "Updates are not defined ";
      //   console.warn(warning);
      // }

      return false;
    }

    return true;
  }

  destroy(id){
    if(this.dataCheck(id)){

      this.setUrl();

      let del = this.remove(id);
      if(del){
        return this.ajaxPromises.destroy(del.toJS()).catch((err)=>{
          throw new Error(err);
        });
      }
    }

    return null;
  }

  formatDate(id, key, fmt="%d/%m/%Y"){
    let item = (_.isNumber(id)) ? this.findById(id) : id;
    let df   = item.get(`${key}Df`);
    // console.log("DateFormmater", df)
    if(df){
      return df.formatDate(fmt);
    }

    return "";
  }

  getDateKeys(item){
    let dateRegExp   = new RegExp(/^\s*(\d{4})-(\d{2})-(\d{2})+!?(\s(\d{2}):(\d{2})|\s(\d{2}):(\d{2}):(\d+))?$/);
    let dateKeys = [];
    _.forIn(item, (v, k)=>{
      if(_.isString(v)){
        let date_match = v.match(dateRegExp);
        if(!_.isNull(date_match)){
          dateKeys.push(k);
        }
      }
    });

    return dateKeys;
  }

  each(){
    let args = Array.prototype.slice.call(arguments);
    let func    = args[0];
    let context = args[1];
    if(!_.isFunction(func)){
      throw new Error("Must be a function");
    }

    if(_.isNull(this.data)){
      throw new Error("Please add data to iterating");
    }

    if(context){
      this.data.forEach(func.bind(context));
    } else {
      this.data.forEach(func);
    }
  }

  fetch(progress, clear=false){
    if(clear){
      this.clearAll();
    }

    this.setUrl();

    return this.ajaxPromises.fetch(progress).then(function(data){
      this.add(data);
      return data;
    }.bind(this)).catch((err)=>{
      throw new Error(err);
    });
  }

  findById(id){
    return this.data.find((d)=>  d.get("id") === id );
  }

  findByIndex(i){
    return this.data.get(i);
  }

  getAll(){
    return this.data;
  }

  getKeys(hard=false){
    if(this.data.size > 0 && (!this.keys || hard)){
      let item  = this.data.first();
      let k     = item.keySeq();
      this.keys = k.toJS();
    }

    return this.keys;
  }

  init(fet){
    if(fet){
      this.fetch();
    }
  }

  manageDates(items){
    let date_keys = this.getDateKeys(_.first(items));
    if(_.isEmpty(date_keys)){
      return items;
    }

    return _.map(items, (item)=>{
      return this.addDates(item, date_keys);
    });

  }

  remove(id){
    let del = this.findById(id);

    if(del){
      let i     = this.data.indexOf(del);
      this.data = this.data.delete(i);
      return del;

    }
    this.warn("Can't find item");
    return null;
  }

  resetHard(i){
    this.resetTo(i);
    this.history = this.history.splice(0, i);
  }

  resetTo(i){
    this.data = this.history[i];
  }

  search(val, keys){
    if(this.dataCheck(val)){
      let regex = new RegExp(val, "i");
      return this.data.filter((d)=>{
        if(keys.length > 1){

          let values = d.filter((v, k)=>{
            return _.contains(keys, k);
          });
          let all = values.valueSeq().toJS().join(" ");

          return (all.search(regex) > -1);

        } else {
          let key = keys[0];
          if(d.has(key)){
            let value = d.get(key);
            return (String(value).search(regex) > -1);
          } else {
            return false;
          }
        }

        return true;
      });
    }


    return this.data;
  }

  sort(key, asc=true){
    // this.addToHistory();
    return this.data.sort((a, b)=>{
      let itemA = (asc) ? a.get(key) : b.get(key);
      let itemB = (asc) ? b.get(key) : a.get(key);
      if(_.isString(itemA) && _.isString(itemB)){
        itemA = itemA.toLowerCase();
        itemB = itemB.toLowerCase();
      }
      return this.sortAlgorithm(itemA, itemB);
    });
  }

  sortAlgorithm(itemA, itemB){
    if(itemA < itemB) {
      return -1;
    }

    if (itemA > itemB){
      return 1;
    }

    return 0;
  }

  setUrl(){
    let uri = (_.isFunction(this.url)) ? this.url() : this.url;
    this.ajaxPromises.addUrl(uri);
  }

  sync(id){
    let send = this.findById(id);
    this.setUrl();

    return this.ajaxPromises.update(send.toJS(), id).catch((err)=>{
      throw new Error(err);
    });
  }


  update(id, updates, sync=false){
    if(this.dataCheck(updates)){
      this.addToHistory();
      this.data = this.data.map((d)=>{
        // console.log(d)
        if(String(d.get("id")) === String(id)){
          return this.updateItem(d, updates);
        }

        return d;
      }.bind(this));

      if(sync){
        this.sync(id);
      }
    }

    return null;
  }

  updateItem(item, data){
    _.forIn(data, (v, k)=> item = item.set(k, v));
    return item;
  }

  updateAll(updates){
    if(this.dataCheck(updates)){
      this.addToHistory();

      this.data = this.data.map((d)=>{
        return this.updateItem(d, updates);
      }.bind(this));
    }
    return null;
  }

  warn(warning){
    if(console.warn){
      console.warn(warning);
    }
  }
}

module.exports = DataManager;
