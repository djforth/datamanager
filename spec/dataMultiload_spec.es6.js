require("babelify/polyfill");

const sinon     = require('sinon');
const _         = require('lodash');
const Immutable = require('immutable');

const createEl = require('./utils/createElements.es6.js');

const MultiLoad  = require('../src/dataMultiload');

const DateFormatter = require("date-formatter");

var createPromise = function(){
  let promise, resolve, reject
  promise = new Promise((res, rej)=>{
    resolve = res;
    reject  = rej;
  });

  return {promise:promise, resolve:resolve, reject:reject};
}


var counter = ()=>{
  let counter = 0;
  return function(i){
    counter = (i) ? i : counter;
    counter++;
    // console.log("counter", counter)
    if(counter < 10){
      return false;
    }

    counter = 0;
    return true;
  }
}

const mockClass = function (Subject) {
    var Mock = function () {
        Mock.prototype.constructor.apply(this, arguments);
    };
    Mock.prototype = Object.create(Subject.prototype);
    Mock.prototype.constructor = Subject;
    return Mock;
};

describe('DataMultiLoad', function() {
  let multi;

  beforeEach(function(){
    multi =  new MultiLoad();
  });

  describe('basic setup', function() {


    it("should exist", function() {
      expect(multi).toBeDefined();
    });

  });

  describe("checking", function() {
    describe("checkMulti", ()=>{
      it("should return false if data is a array", function() {
        expect(multi.checkMulti(["foo"])).toBeFalsy();
      });

      it("should return false if data is object without page", function() {
        expect(multi.checkMulti({data:["foo"]})).toBeFalsy();
      });

      it("should return true if data object with correct attributes", function() {
        expect(multi.checkMulti({page:1, ended:false, data:["foo"]})).toBeTruthy();
      });
    })


    it("should return ended attribute", function() {
      let spy = jasmine.createSpy("data").and.returnValue(true);
      let ended = multi.checkLast(spy);
      expect(ended).toBeTruthy();
      expect(spy).toHaveBeenCalledWith("ended");
    });
  });

  describe('setData', function() {
    let data
    beforeEach(()=>{
      data = multi.setData({foo:"foo", bar:"Phil"});
    });

    it("should return a function", function() {
      expect(_.isFunction(data)).toBeTruthy();
    });

    it("should return the correct data", function() {
      expect(data("foo")).toEqual("foo");
      expect(data("bar")).toEqual("Phil")
    });
  });

  describe('addData', function() {
    let data
    beforeEach(function() {
      spyOn(multi, "setData").and.callThrough();
      spyOn(multi, "add")
    });

    it("should add if just array", function() {
      spyOn(multi, "checkMulti").and.returnValue(false);

      multi.dataAdd(['foo']);
      expect(multi.checkMulti).toHaveBeenCalled();
      expect(multi.add).toHaveBeenCalledWith(["foo"]);
      expect(multi.dataList).toEqual([]);
    });

    describe("adding object", ()=>{
      beforeEach(function() {
        spyOn(multi, "checkMulti").and.returnValue(true);
        multi.dataAdd({data:['foo']});
      });

      it("should call checkMulti", function() {
        expect(multi.checkMulti).toHaveBeenCalled()
      });

      it("should call set data", function() {
        expect(multi.setData).toHaveBeenCalledWith({data:['foo']});
      });

      it("should call add", function() {
        expect(multi.add).toHaveBeenCalledWith(['foo']);
      });

      it("should set dataList", function() {
        expect(_.isArray(multi.dataList)).toBeTruthy();
        expect(_.isFunction(multi.dataList[0])).toBeTruthy();
        expect(multi.dataList.length).toEqual(1);
      });
    });


  });


  describe('getUrl', function() {
    let urlFn;
    beforeEach(function() {
      urlFn = multi.getUrl("/api/foo/:id.json", ":id");
    });

    it("should return url if no identifier", function() {
      let url = multi.getUrl("/api/foo.json");
      expect(url).toEqual("/api/foo.json");
    });

    it("should return function if identifier", function() {
      expect(_.isFunction(urlFn)).toBeTruthy();
    });

    it("should not increment if false ", function() {
      let url = urlFn(false, 3);
      expect(url).toEqual("/api/foo/0.json");

      url = urlFn();
      expect(url).toEqual("/api/foo/0.json");

      url = urlFn(false);
      expect(url).toEqual("/api/foo/1.json");
    });

    it("should return the correct url", function() {
      let url = urlFn(3);
      // console.log('limit', urlFn.limit);
      expect(url).toEqual("/api/foo/0.json");

      url = urlFn(3);
      expect(url).toEqual("/api/foo/1.json");

      url = urlFn(3);
      expect(url).toEqual("/api/foo/2.json");

      url = urlFn(3);
      expect(url).toBeFalsy();
    });
  });

  describe('setUrl', function() {


    it("should throw error if no url", function() {
      // console.log(multi.url, multi.setUrl);
       expect(()=>{
        multi.manageUrl();
      }).toThrowError("not a valid url");
    });

    it("should set url if string", function() {
      spyOn(multi.ajaxPromises, "addUrl");
      spyOn(multi, "getUrl").and.returnValue("/api/foo.json");
      multi.manageUrl("/api/foo.json");

      expect(multi.url).toEqual("/api/foo.json");
      expect(multi.getUrl).toHaveBeenCalled()
      expect(multi.getUrl.calls.argsFor(0)).toContain("/api/foo.json");
      expect(multi.ajaxPromises.addUrl).toHaveBeenCalledWith("/api/foo.json");
    });

    it("should set function if correct arguments", function() {
      let spy = jasmine.createSpy();
      spyOn(multi, "getUrl").and.returnValue(spy);
      multi.manageUrl("/api/foo/:id.json", ":id");
      expect(multi.url).toEqual(spy);
    });
  });

  describe('fetch if single call', function() {
    let promise, resolve, reject;
    beforeEach(()=>{
      let prom = createPromise();
      promise = prom.promise;
      resolve = prom.resolve;
      reject  = prom.reject;


      spyOn(multi, "fetcher").and.callFake((p, t, a)=>{
        return promise.then(t);
      });

      spyOn(multi, "dataAdd").and.callFake((d)=>d);
      spyOn(multi, "manageUrl");
      multi.url = "api/foo.json";
    });

    it("should pass progress function to Ajaxpromise", function() {
      let progressSpy = jasmine.createSpy("progress");
      multi.fetch(progressSpy);
      expect(multi.fetcher).toHaveBeenCalled()
    });


    it("should call add on success", function(done) {

      multi.fetch().then((data)=>{
        expect(data).toEqual("success");
        expect(multi.dataAdd).toHaveBeenCalledWith("success");
      });
      resolve("success");

      setTimeout(function() {
          done();
        }, 100);

    });


  });

  describe('fetcher', function() {
    let ajaxProm, promise, resolve, reject;
    beforeEach(()=>{
      promise = new Promise((res, rej)=>{
        resolve = res;
        reject  = rej;
      });
      ajaxProm = jasmine.createSpyObj("ajaxPromise", ["setUrl", "fetch"]);
      ajaxProm.fetch.and.returnValue(promise);
      spyOn(multi, "createAjax").and.returnValue(ajaxProm);

    });

    describe('if passed ajaxPromise but no limit', function() {
      let prom, progressSpy, thenSpy;
      beforeEach(()=>{
        progressSpy = jasmine.createSpy("progress");
        thenSpy     = jasmine.createSpy("then");
        multi.url   = "/api/foo.json"
        prom = multi.fetcher(progressSpy, (d)=>{
          thenSpy(d);
          return d;
        }, ajaxProm);
      });

      it("should call setUrl", function() {
        // expect(urlSpy).not.toHaveBeenCalled();
        expect(ajaxProm.setUrl).toHaveBeenCalledWith("/api/foo.json");
      });

      it("should call fetch", function() {
        expect(ajaxProm.fetch).toHaveBeenCalledWith(progressSpy);
      });


      it("should call add on success", function(done) {
        prom.then((data)=>{
          expect(data).toEqual("success");
          expect(thenSpy).toHaveBeenCalledWith("success");
        });

        resolve("success");

        setTimeout(function() {
            done();
          }, 100);

      });

      it("should fail correctly", function(done) {
        prom.then((data)=>{
          expect(data).toEqual("success");
        }).catch((err)=>{
          expect(err).toEqual(new Error("Failure"));
        });

        reject("Failure");

        setTimeout(function() {
            done();
          }, 100);
      });
    });



    describe('if passed ajaxPromise is not passed and no limit', function() {
      let prom, progressSpy, thenSpy, urlSpy;
      beforeEach(()=>{
        progressSpy = jasmine.createSpy("progress");
        thenSpy     = jasmine.createSpy("then");
        urlSpy      = jasmine.createSpy("url").and.returnValue("/api/foo/0.json")
        multi.url   = urlSpy;
        prom = multi.fetcher(progressSpy, (d)=>{
          thenSpy(d);
          return d;
        });
      });

      it("should call createAjax", function() {
        expect(multi.createAjax).toHaveBeenCalled();
      });

      it("should call url", function() {
        expect(urlSpy).toHaveBeenCalled();
      });

      it("should call setUrl", function() {
        expect(ajaxProm.setUrl).toHaveBeenCalledWith("/api/foo/0.json");
      });

      it("should call fetch", function() {
        expect(ajaxProm.fetch).toHaveBeenCalledWith(progressSpy);
      });

      it("should call add on success", function(done) {
        prom.then((data)=>{
          expect(data).toEqual("success");
          expect(thenSpy).toHaveBeenCalledWith("success");
        });

        resolve("success");

        setTimeout(function() {
            done();
          }, 100);

      });

      it("should fail correctly", function(done) {
        prom.then((data)=>{
          expect(data).not.toEqual("success");
        }).catch((err)=>{
          expect(err).toEqual(new Error("Failure"));
        });

        reject("Failure");

        setTimeout(function() {
            done();
          }, 100);
      });
    });

    describe('if passed ajaxPromise is not passed and limit is passed', function() {
      let prom, progressSpy, thenSpy, urlSpy;
      beforeEach(()=>{
        progressSpy = jasmine.createSpy("progress");
        thenSpy     = jasmine.createSpy("then");
        urlSpy      = jasmine.createSpy("url").and.returnValue("/api/foo/0.json")
        multi.url   = urlSpy;
        prom = multi.fetcher(progressSpy, (d)=>{
          thenSpy(d);
          return d;
        }, 20, ajaxProm);
      });

      it("should not call createAjax", function() {
        expect(multi.createAjax).not.toHaveBeenCalled();
      });

      it("should call url", function() {
        expect(urlSpy).toHaveBeenCalledWith(20);
      });

      it("should call setUrl", function() {
        expect(ajaxProm.setUrl).toHaveBeenCalledWith("/api/foo/0.json");
      });

      it("should call fetch", function() {
        expect(ajaxProm.fetch).toHaveBeenCalledWith(progressSpy);
      });
    });

    describe('if passed ajaxPromise is passed and limit is passed', function() {
      let prom, progressSpy, thenSpy, urlSpy;
      beforeEach(()=>{
        progressSpy = jasmine.createSpy("progress");
        thenSpy     = jasmine.createSpy("then");
        urlSpy      = jasmine.createSpy("url").and.returnValue("/api/foo/0.json")
        multi.url   = urlSpy;
        prom = multi.fetcher(progressSpy, (d)=>{
          thenSpy(d);
          return d;
        }, 20);
      });

      it("should call createAjax", function() {
        expect(multi.createAjax).toHaveBeenCalled();
      });

      it("should call url", function() {
        expect(urlSpy).toHaveBeenCalledWith(20);
      });

      it("should call setUrl", function() {
        expect(ajaxProm.setUrl).toHaveBeenCalledWith("/api/foo/0.json");
      });

      it("should call fetch", function() {
        expect(ajaxProm.fetch).toHaveBeenCalledWith(progressSpy);
      });


    });

  });

  describe('when multiple calls', function() {
    let ended, prog, spy;
    beforeEach(()=>{
      ended = counter();
      spy  = jasmine.createSpy("data").and.callFake((d)=>{
        switch(d){
          case "last":
            // console.log('DATA ENDED');
            return ended();
          break;
          case "amount":
            return 5;
          break;
          default:
            return "foo";
        }
      });

      spyOn(multi, "dataAdd").and.returnValue(spy);
      prog = jasmine.createSpy("prog");
    });

    // afterEach(function() {
    //   ended = false;
    // });

    describe('when createProgress', function() {
      let progSpy, newProg;
      beforeEach(()=>{
        progSpy = jasmine.createSpy("progress");

        newProg = multi.createProgress(progSpy, "/api/foo.json", 4);
      })

      it("should return a function", function() {
        expect(_.isFunction(newProg)).toBeTruthy();
      });

      it("should concat arguments", function() {
        newProg("foo");
        expect(progSpy).toHaveBeenCalled();
        let args = progSpy.calls.argsFor(0);

        expect(args).toContain("/api/foo.json");
        expect(args).toContain(4);
        expect(args).toContain("foo");
      });
    });

    describe('when createAjax called', function() {
      let AjaxPromises, ajax, Mock, spy, revert;
      beforeEach(function() {
        spy = jasmine.createSpy("ajaxPromise", ["constructor"]);
        revert = MultiLoad.__set__("AjaxPromises", ()=>{
          spy();
        });
      });

      afterEach(()=>{
        revert()
      })
      it("should create ajaxList", function() {
        multi.createAjax();
        expect(_.isArray(multi.ajaxList)).toBeTruthy();
        expect(multi.ajaxList.length).toEqual(1)
      });

      it("should create ajaxPromise", function() {
        let ajax = multi.createAjax();
        expect(ajax).toBeDefined();
        expect(spy).toHaveBeenCalled()
      });
    });

    describe('when fetchFirst is called', function() {
      let promise, resolve, reject, fetch;
      let i = 0;
      beforeEach(()=>{
        let prom = createPromise();
        promise = prom.promise;
        resolve = prom.resolve;
        reject  = prom.reject;

        spyOn(multi, "fetcher").and.callFake((prog, thenFn)=>{
          return promise.then(thenFn).catch((err)=>{console.log('error');});
        });


        spyOn(multi, "fetchMulti").and.returnValue("multi fetching")


      });

      it("should call fetcher", function() {
        let fetch = multi.fetchFirst(prog);
        expect(multi.fetcher).toHaveBeenCalled();
        let calls = multi.fetcher.calls.argsFor(0);
        expect(calls[0]).toEqual(prog);
        expect(_.isFunction(calls[1])).toBeTruthy();
      });

      it("should call dataAdd if resolved", function(done) {
        multi.fetchFirst(prog).then((d)=>{
          expect(multi.dataAdd).toHaveBeenCalledWith("foo");
          expect(d).toEqual("multi fetching");
        });
        resolve("foo");



        setTimeout(function() {
            done();
          }, 100);
      });

      it("should call spy twice if resolved and not last", function(done) {
        multi.fetchFirst(prog).then((d)=>{
          expect(spy).toHaveBeenCalled();
          expect(spy.calls.count()).toEqual(2);
          expect(spy.calls.argsFor(0)).toContain("last");

          expect(spy.calls.argsFor(1)).toContain("amount");
          expect(d).toEqual("multi fetching");
        });
        resolve("foo");

        setTimeout(function() {
            done();
          }, 100);
      });

      it("should return data if last", function(done) {
        // ended = true;
        ended(8)
        multi.fetchFirst(prog).then((d)=>{
          expect(spy).toHaveBeenCalled();
          expect(spy.calls.count()).toEqual(2);
          expect(spy.calls.argsFor(0)).toContain("last");
          expect(spy.calls.argsFor(1)).toContain("data");
          expect(d).toEqual("foo");
        });

        resolve("foo");

        setTimeout(function() {
            done();
          }, 100);
      });
    });

    describe('when fetchMulti', function() {
      let promiseList, fetch, urlSpy;
      let i;

      beforeEach(()=>{
        i = 0;
        promiseList = []
        urlSpy = jasmine.createSpy("url").and.callFake((d)=>{
          i++;
          return (i < 20);
        })
        multi.url = urlSpy;

        spyOn(multi, "fetcher").and.callFake((prog, thenFn)=>{
          let item    = createPromise();
          let promise = item.promise;
          promiseList.push(item)
          return promise.then(thenFn).catch((err)=>{console.log('error', err);});
        });

        spyOn(multi, "createProgress").and.callThrough();
      });

      it("should create promise list", function() {
        let progAll = multi.fetchMulti(prog);
        // console.log(i, multi.promiseList.length);
        expect(multi.promiseList.length).toEqual(10);
        expect(multi.fetcher).toHaveBeenCalled();
        expect(multi.fetcher.calls.count()).toEqual(10);
      });

      it("should set progress fn with call count", function() {
        let progAll  = multi.fetchMulti(prog);
        let args     = multi.fetcher.calls.argsFor(0);
        let progress = args[0];
        expect(_.isFunction(progress)).toBeTruthy()
        progress("foo");

        let calls = prog.calls.argsFor(0);
        expect(calls).toContain("foo");
        expect(calls).toContain(0);

      });

      it("should set then method when not last", function() {
        let progAll  = multi.fetchMulti(prog);
        let args     = multi.fetcher.calls.argsFor(0);
        let thenFn = args[1];
        expect(_.isFunction(thenFn)).toBeTruthy();
        let d = thenFn("foobar");
        expect(multi.dataAdd).toHaveBeenCalledWith("foobar");

        expect(spy).toHaveBeenCalled();
        expect(spy.calls.count()).toEqual(2);

        let call = spy.calls.argsFor(0)[0]
        expect(call).toEqual("last")

        call = spy.calls.argsFor(1)[0]
        expect(call).toEqual("data")

        expect(d).toEqual("foo");

      });

      it("should set then method when last", function() {
        ended(8)
        let progAll  = multi.fetchMulti(prog);
        let args     = multi.fetcher.calls.argsFor(0);
        let thenFn = args[1];
        expect(_.isFunction(thenFn)).toBeTruthy();
        let d = thenFn("foobar");
        expect(multi.dataAdd).toHaveBeenCalledWith("foobar");

        expect(spy).toHaveBeenCalled();
        expect(spy.calls.count()).toEqual(3);

        let call = spy.calls.argsFor(0)[0]
        expect(call).toEqual("last")

        call = spy.calls.argsFor(1)[0]
        expect(call).toEqual("data")

        call = spy.calls.argsFor(2)[0]
        expect(call).toEqual("last")

        expect(_.isObject(d)).toBeTruthy()
        expect(d.data).toEqual("foo");
        expect(_.isBoolean(d.last)).toBeTruthy();

      });

      it("should resolve once all methods are resolved", function(done) {

        multi.fetchMulti(prog).then((dataAll)=>{
          expect(dataAll.length).toEqual(10);

          _.forEach(dataAll, (d, i)=>{
            if(i < 9){
              expect(_.isString(d)).toBeTruthy();
              expect(d).toEqual("foo");
            } else {
              expect(_.isObject(d)).toBeTruthy()
              expect(d.data).toEqual("foo");
              expect(_.isBoolean(d.last)).toBeTruthy();
            }

          })
        });

        _.forEach(promiseList, (p, i)=>{
          p.resolve([`foo${i}`]);
        });

        setTimeout(function() {
            done();
          }, 100);
      });



    });
  });
});