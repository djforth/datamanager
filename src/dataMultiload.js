

const DataManager  = require("../lib/dataManager");
const _            = require("lodash");
// const Immutable    = require("immutable");
const AjaxPromises = require("ajax-es6-module");

class DataMultiLoad extends DataManager {

  checkMulti(data){
    return ((!_.isArray(data)) && _.isNumber(data.page) && _.isBoolean(data.ended));
  }

  checkLast(data){
    return data("ended");
  }

  createAjax(){
    this.ajaxList = this.ajaxList || [];
    let ajax = new AjaxPromises();
    this.ajaxList.push(ajax);
    return ajax;
  }

  createProgress(func, ...args){
    let argsApply = args;
    let progFn    = func;
    return function(){
      let newArgs = Array.prototype.slice.call(arguments);
      progFn.apply(this, argsApply.concat(newArgs));
    };
  }


  dataAdd(data){
    this.dataList = this.dataList || [];
    if(this.checkMulti(data)){
      let d = this.setData(data);
      this.add(d("data"));
      this.dataList.push(d);
      return d;
    } else {
      this.add(data);
      return data;
    }
  }

  fetch(progress, ...args){
    this.manageUrl.apply(this, args);

    if(_.isString(this.url)){
      return this.fetcher(progress, (data)=>{
        return this.dataAdd(data);
      }, this.ajaxPromises);
    }


    // return this.fetchMulti(progress);
    return this.fetchFirst(progress);
  }

  fetcher(progFn, thenFn, ...args){
    let ajaxProm = _.find(args, (arg)=>_.isFunction(arg) || _.isObject(arg) );
    let limit    = _.find(args, (arg)=>_.isNumber(arg));

    let ajax = (ajaxProm) ? ajaxProm : this.createAjax();
    let url  = (_.isFunction(this.url)) ? this.url(limit) : this.url;
    ajax.setUrl(url);

    return ajax.fetch(progFn).then(thenFn).catch((err)=>{
      throw new Error(err);
    });
  }

  fetchFirst(progress){
    return this.fetcher(progress, (data)=>{
      let d = this.dataAdd(data);
      if(!d("last")){
        return this.fetchMulti(progress, d("amount"));
      }

      return d("data");
    });
  }

  fetchMulti(progress){
    this.promiseList = [];
    let i = 0;

    do{
      let n = i;
      i++;
      let promise = this.fetcher(
        this.createProgress(progress, this.url(false), n),
        (data)=>{
          let d =  this.dataAdd(data);
          if(d("last")){
            return {data:d("data"), last:d("last")};
          }

          return d("data");
        }
      );

      this.promiseList.push(promise);
    } while(this.url(false));

    return Promise.all(this.promiseList);
  }

   getUrl(url, identifier="", l=1){
    if(identifier === ""){
      return url;
    }

    const baseId  = identifier;
    const baseUrl =  url;
    var count     = 0;
    var limit     = l;
    return function(...args){
      let l    = _.find(args, (arg)=>_.isNumber(arg));
      let inc  = _.find(args, (arg)=>_.isBoolean(arg));

      let increment = (_.isBoolean(inc)) ? inc : true;
      limit = (l) ? l : limit;

      if(count === limit) {
        return false;
      }

      let path = baseUrl.replace(baseId, count);

      if(increment) {
        count++;
      }

      return path;
    };
  }

  setData(d){
    var data = d;

    return function(attr){
      return data[attr];
    };
  }

  manageUrl(url, id, limit){
    if(_.isEmpty(url) && _.isUndefined(this.url)){
      throw new Error("not a valid url");
    }

    this.url = this.getUrl(url, id, limit);
    if(_.isString(this.url)){
      this.ajaxPromises.addUrl(this.url);
    }
  }
}

module.exports = DataMultiLoad;
