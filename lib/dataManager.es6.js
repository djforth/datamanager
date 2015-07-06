const Immutable = require("immutable");
const _         = require("lodash");

const AjaxPromises  = require("ajax-es6-module");

class DataManager {
  add(m){
    //Adding comment
    this.addToHistory();

    m = (_.isArray(m)) ? m : [m];

    let current, newData;
    if(this.data){
      current = this.data.toJS();
      newData = _.union(current, m);
    } else {
      newData = m;
    }

    this.data = Immutable.fromJS(newData).map((d)=> this.addDefaults(d));
  }

  addToHistory(){
    if(this.data) {
      this.history.push(this.data); //sets up history
    }
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

  clearAll(){
    this.addToHistory();
    this.data = null;
  }

  constructor(defaults, ...args){

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

      if(console.warn){
        let warning = (!this.data) ? "No Data to update" : "Updates are not defined ";
        console.warn(warning);
      }

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

  filter(){

  }

  fetch(clear=false){
    if(clear){
      this.clearAll();
    }

    this.setUrl();

    return this.ajaxPromises.fetch().then(function(data){
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
    if(!this.keys || hard){
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
