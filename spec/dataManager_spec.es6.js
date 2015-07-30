require("babelify/polyfill");

const sinon     = require('sinon');
const _         = require('lodash');
const Immutable = require('immutable');

const createEl = require('./utils/createElements.es6.js');

const DataBase  = require('../lib/dataManager.es6.js');

describe('DataBase', function() {
  let dataManager;

  describe('basic setup', function() {
    beforeEach(function(){
      dataManager =  new DataBase();
    });

    it("should exist", function() {
      expect(dataManager).toBeDefined();
    });

    it('should set default', function(){
      expect(dataManager.cid).toBeDefined();
      expect(dataManager.data).toBeNull();
      expect(dataManager.defaults).toBeUndefined();
      expect(dataManager.history).toEqual([]);

    });
  });

  describe('check creations functions', ()=>{
    let add, init;
    let store;
    beforeEach(function(){
      add   = jasmine.createSpy('add');
      init  = jasmine.createSpy('init');

      store = {
        add:DataBase.prototype.add,
        init:DataBase.prototype.init
      };

      Object.assign(DataBase.prototype, {
        add:add,
        init:init
      });

    });

    afterEach(function(){
      Object.assign(DataBase.prototype, {
        add:store.add,
        init:store.init
      });
    });

    it("should call add if data array sent", function() {
      dataManager =  new DataBase(null, [1, 2, 3]);
      expect(add).toHaveBeenCalledWith([1, 2, 3]);
    });

    it("should not call add if no data sent", function() {
      dataManager =  new DataBase();
      expect(add).not.toHaveBeenCalled();
    });

    it("should pass props if added", function() {
      dataManager =  new DataBase(null,  {foo:"bar"});
      expect(init).toHaveBeenCalledWith({foo:"bar"}, false);
    });

    it("should pass props & fetch command", function() {
      dataManager =  new DataBase(null, {foo:"bar"}, true);
      expect(init).toHaveBeenCalledWith({foo:"bar"}, true);
    });

    it("should default fetch command of false", function() {
      dataManager =  new DataBase();
      expect(init).toHaveBeenCalledWith(false);
    });

    it("should default fetch command of true", function() {
      dataManager =  new DataBase(null,true);
      expect(init).toHaveBeenCalledWith(true);
    });
  });


  describe('init', function() {
    beforeEach(function() {
      dataManager =  new DataBase();
      spyOn(dataManager, "fetch");
    });

    it("should not call fetch by default", function() {
      dataManager.init();
      expect(dataManager.fetch).not.toHaveBeenCalled();
    });

    it("should not call fetch if false", function() {
      dataManager.init(false);
      expect(dataManager.fetch).not.toHaveBeenCalled();
    });

    it("should call fetch if true", function() {
      dataManager.init(true);
      expect(dataManager.fetch).toHaveBeenCalled();
    });
  });


  describe('add', function() {
    beforeEach(function() {
      dataManager =  new DataBase();
      spyOn(dataManager, "addDefaults").and.callFake((d)=>{
        d = d.set("test", "foo");
        // console.log(d.toJS());
        return d;
      })
    });

    it("should create immutable list from list", function() {
      dataManager.add({foo:"bar"});

      expect(Immutable.List.isList(dataManager.data)).toBeTruthy();
      expect(dataManager.addDefaults).toHaveBeenCalled();
      expect(dataManager.data.get(0).toJS()).toEqual({foo:"bar", test:"foo"});
    });

    it("should create immutable list from array", function() {
      dataManager.add([{foo:"bar"}, {bar:"foo"}]);

      expect(Immutable.List.isList(dataManager.data)).toBeTruthy();
      expect(dataManager.addDefaults).toHaveBeenCalled();
      expect(dataManager.data.get(0).toJS()).toEqual({foo:"bar", test:"foo"});
    });

    describe('if data already added', function() {
      beforeEach(()=>{
        dataManager.data = Immutable.fromJS([{foo:"bar"}]);
      });

      it("should add object & create a new Immutable List", function() {
        dataManager.add({bar:"foo"});

        expect(Immutable.List.isList(dataManager.data)).toBeTruthy();
        expect(dataManager.addDefaults).toHaveBeenCalled();

        expect(dataManager.history.length).toEqual(1);
        expect(dataManager.history[0].size).toEqual(1);

        expect(dataManager.data.get(0).toJS()).toEqual({foo:"bar", test:"foo"});
        expect(dataManager.data.size).toEqual(2);
      });

      it("should add array & create a new Immutable List", function() {
        dataManager.add([{bar:"foo"}, {phil:"colins"}]);

        expect(Immutable.List.isList(dataManager.data)).toBeTruthy();
        expect(dataManager.addDefaults).toHaveBeenCalled();

        expect(dataManager.history.length).toEqual(1);
        expect(dataManager.history[0].size).toEqual(1);

        // expect(dataManager.data.toArray()).toEqual([{foo:"bar", test:"test"}, {bar:"foo", test:"test"}]);
        expect(dataManager.data.size).toEqual(3);
      });

      it("should not add if already in array", function() {
        dataManager.add([{bar:"foo"}]);

        expect(Immutable.List.isList(dataManager.data)).toBeTruthy();
        expect(dataManager.addDefaults).toHaveBeenCalled();

        expect(dataManager.history.length).toEqual(1);
        expect(dataManager.history[0].size).toEqual(1);

        // expect(dataManager.data.toArray()).toEqual([{foo:"bar", test:"test"}, {bar:"foo", test:"test"}]);
        expect(dataManager.data.size).toEqual(2);
      });
    });
  });

  describe('addId', function() {
    let obj;
    beforeEach(()=>{
      dataManager      =  new DataBase();
      dataManager.data = Immutable.fromJS([{title:"Phil"}]);
      spyOn(dataManager, "addToHistory")
      // dataManager.defaults = {surname:"Collins"};
    });

    it("should add an ID", function() {
      dataManager.addId()
      let id = dataManager.data.first().get('id');
      expect(_.isString(id)).toBeTruthy();
    });
  });

  describe('adding defaults', function() {
    let obj;
    beforeEach(()=>{
      dataManager =  new DataBase();
      obj     = Immutable.fromJS({title:"Phil"});
      dataManager.defaults = {surname:"Collins"};
    });

    it("should add defaults & id to an object ", function() {
       let new_obj = dataManager.addDefaults(obj);
       console.log(new_obj.get('surname'));
       // expect( _.isString(new_obj.get('id')) ).toBeTruthy();
       expect(new_obj.get("surname")).toEqual("Collins");
    });

    it("should add defaults not ID if set to an object ", function() {
       obj = obj.set("id", "1");
       let new_obj = dataManager.addDefaults(obj);
       expect(new_obj.get('id')).toEqual("1");
       expect(new_obj.get("surname")).toEqual("Collins");
    });
  });

  describe('history functions', function() {
    let d1, d2;
    beforeEach(()=>{
      d1 = Immutable.List([{bar:"foo"}]);
      d2 = Immutable.List([{foo2:"bar2"}]);
      dataManager =  new DataBase();
      dataManager.history = [d1, d2];
      dataManager.data    = Immutable.List([{foo:"bar"}]);
    });

    it("should add to history if there is data", function() {
      dataManager.addToHistory();
      expect(dataManager.history.length).toEqual(3);
    });

    it("should not add to history if there isn't data", function() {
      dataManager.data    = null;
      dataManager.addToHistory();
      expect(dataManager.history.length).toEqual(2);
    });

    it("should resetTo old data", function() {
      dataManager.resetTo(1);
      expect(dataManager.data.equals(d2)).toBeTruthy();
      expect(dataManager.history.length).toEqual(2);
    });

    it("should hard reset to old data", function() {
      dataManager.resetHard(1);
      expect(dataManager.data.equals(d2)).toBeTruthy();
      expect(dataManager.history.length).toEqual(1);
    });
  });

  describe('findByIndex, findById, getAll', function() {
    beforeEach(()=>{
      dataManager =  new DataBase();
      dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {bar:"foo", id:2}]);
    });

    it("should find correct entry by ID", function() {
      let entry = dataManager.findById(2);
      expect(entry.toJS()).toEqual({bar:"foo", id:2});
    });

    it("should find correct entry by index", function() {
      let entry = dataManager.findByIndex(0);
      expect(entry.toJS()).toEqual({foo:"bar", id:1});
    });

    it("should return all", function() {
      let entries = dataManager.getAll();
      // console.log('entries', entries);
      expect(Immutable.List.isList(entries)).toBeTruthy();
      expect(entries.length).toEqual(2);
      expect(entries.toJS()).toContain({foo:"bar", id:1});
    });

  });

  describe('each', function() {
    let eachSpy;
    beforeEach(()=>{
      eachSpy     = jasmine.createSpy();
      dataManager = new DataBase();
      dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {bar:"foo", id:2}]);
    });

    it("Throws an error if no function", function() {
      expect(function() {
        dataManager.each();
      }).toThrowError('Must be a function');
    });

    it("Throws an error if no data", function() {
      dataManager.data = null;
      expect(function() {
        dataManager.each(eachSpy);
      }).toThrowError("Please add data to iterating");
    });

    it("should iterate over function", function() {
      dataManager.each(eachSpy);
      expect(eachSpy).toHaveBeenCalled();
      expect(eachSpy.calls.count()).toEqual(2);
    });
  });

  describe('setUrl', function() {
    beforeEach(()=>{
      dataManager = new DataBase();
      spyOn(dataManager.ajaxPromises, "addUrl");
    });

    it("should set url via function", function() {
      let url = jasmine.createSpy("url").and.returnValue("api/test.json");
      dataManager.url = url;
      dataManager.setUrl();
      expect(url).toHaveBeenCalled();
      expect(dataManager.ajaxPromises.addUrl).toHaveBeenCalledWith("api/test.json");
    });

    it("should set url", function() {
      dataManager.url = "api/test.json";
      dataManager.setUrl();
      expect(dataManager.ajaxPromises.addUrl).toHaveBeenCalledWith("api/test.json");
    });
  });

  describe('fetch', function() {
    let promise, resolve, reject;
    beforeEach(()=>{
      promise = new Promise((res, rej)=>{
        resolve = res;
        reject  = rej;
      });
      dataManager = new DataBase();
      spyOn(dataManager, "setUrl");
      spyOn(dataManager, "clearAll");
      spyOn(dataManager.ajaxPromises, "fetch").and.returnValue(promise);
      spyOn(dataManager, "add");
      // dataManager.data = Immutable.List([{foo:"bar", id:1}, {bar:"foo", id:2}]);
    });

    it("should call setUrl, but not clearAll by default", function() {
      dataManager.fetch();
      expect(dataManager.setUrl).toHaveBeenCalled();
      expect(dataManager.clearAll).not.toHaveBeenCalled();
    });

    it("should call setUrl & clearAll true passed", function() {
      dataManager.fetch(null, true);
      expect(dataManager.setUrl).toHaveBeenCalled();
      expect(dataManager.clearAll).toHaveBeenCalled();
    });

    it("should pass progress function to Ajaxpromise", function() {
      let progressSpy = jasmine.createSpy("progress");
      dataManager.fetch(progressSpy);
      expect(dataManager.ajaxPromises.fetch).toHaveBeenCalledWith(progressSpy);
    });


    it("should call add on success", function(done) {

      dataManager.fetch().then((data)=>{
        expect(data).toEqual("success");
        expect(dataManager.add).toHaveBeenCalledWith("success");
      });
      resolve("success");

      setTimeout(function() {
          done();
        }, 100);

    });

    it("should fail correctly", function(done) {
      dataManager.fetch().then((data)=>{
        expect(data).toEqual("success");
        // expect(dataManager.add).toHaveBeenCalledWith("success");
      }).catch((err)=>{
        expect(err).toEqual(new Error("Failure"));
      });
      reject("Failure");

      setTimeout(function() {
          done();
        }, 100);
    });
  });

  describe('dataCheck', function(){
    beforeEach(()=>{
      dataManager = new DataBase();
      dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {foo:"foo", id:2}]);
    });

    it("should return false if no data", function() {
         dataManager.data = null;
         let check = dataManager.dataCheck({foo:"bar2"});

         expect(check).toBeFalsy();
      });

      it("should return null if no updates", function() {
         let check = dataManager.dataCheck();

         expect(check).toBeFalsy();
      });

      it("should return true if data, updates", function() {
         let check = dataManager.dataCheck({foo:"bar2"});

         expect(check).toBeTruthy();
      });


  })

  describe('update functions', function() {

    let promise, resolve, reject;

    beforeEach(()=>{
      promise = new Promise((res, rej)=>{
        resolve = res;
        reject  = rej;
      });

      dataManager = new DataBase();
      spyOn(dataManager.ajaxPromises, "update").and.returnValue(promise);
    })

    describe("Update item", function() {
      let obj, updates;
      beforeEach(()=>{
        obj     = Immutable.fromJS({title:"Phil", surname:"Collins"});
        updates = {surname:"Bailey"};
      });

      it("should update an object ", function() {
         let new_obj = dataManager.updateItem(obj, updates);
         expect(new_obj.get("title")).toEqual("Phil");
         expect(new_obj.get("surname")).toEqual("Bailey");
      });

    });
    describe('when updates ', function() {
      beforeEach(function() {
        spyOn(dataManager, "addToHistory");
        spyOn(dataManager, "sync");
        dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {foo:"foo", id:2}]);
      });

      // it("should return null if no data", function() {
      //    dataManager.data = null;
      //    let update = dataManager.update(1, {foo:"bar2"});

      //    expect(update).toBeNull()
      // });

      it("should return null if not valid", function() {
         spyOn(dataManager, "dataCheck").and.returnValue(false);
         let update = dataManager.update(1);

         expect(update).toBeNull();
      });

      it("should update data", function() {
        dataManager.update(1, {foo:"bar2"});

        let obj = dataManager.data.get(1);
        // console.log('obj', dataManager.data.size);
        expect(obj.get('foo')).toEqual('foo');

        let obj2 = dataManager.data.get(0);
        expect(obj2.get('foo')).toEqual('bar2');
      });

      it("should call sync if set to true", function() {
         dataManager.update(1, {foo:"bar2"}, true);
         expect(dataManager.sync).toHaveBeenCalledWith(1);
      });
    });

    describe('sync function', function() {

      let promise, resolve, reject;

      beforeEach(()=>{
        promise = new Promise((res, rej)=>{
          resolve = res;
          reject  = rej;
        });

        dataManager = new DataBase();
        spyOn(dataManager, "setUrl");
        spyOn(dataManager.ajaxPromises, "update").and.returnValue(promise);
        dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {foo:"foo", id:2}]);
      });

      it("should call setUrl", function() {
        dataManager.sync(1);
        expect(dataManager.setUrl).toHaveBeenCalled();
      });

      it("should call ajaxPromises.update", function() {
        dataManager.sync(1);
        expect(dataManager.ajaxPromises.update).toHaveBeenCalled();

        let args = dataManager.ajaxPromises.update.calls.first().args;
        expect(args).toContain(1);
        expect(args).toContain({foo:"bar", id:1});
      });

      it("should return success if resolved", function(done) {
        dataManager.sync(1).then((suc)=>{
          expect(suc).toEqual("Success");
        });

        resolve("Success");

        setTimeout(function() {
          done();
        }, 100);
      });
    });


    describe('updateAll', function() {
      beforeEach(function() {
        spyOn(dataManager, "addToHistory");
        spyOn(dataManager, "updateItem").and.callFake((d, u)=> d);
        dataManager.data = Immutable.fromJS([{foo:"bar", id:1}, {foo:"foo", id:2}]);
      });

      it("should return null if not valid", function() {
         spyOn(dataManager, "dataCheck").and.returnValue(false);
         let update = dataManager.updateAll({update:"something"});

         expect(update).toBeNull();
      });

      it("should update data", function() {
        dataManager.updateAll({foo:"bar2"});

        expect(dataManager.updateItem).toHaveBeenCalled()
        expect(dataManager.updateItem.calls.count()).toEqual(2)
      });

    });
  });

  describe('create function', function() {

      let promise, resolve, reject;

      beforeEach(()=>{
        promise = new Promise((res, rej)=>{
          resolve = res;
          reject  = rej;
        });

        dataManager = new DataBase();
        spyOn(dataManager, "setUrl");
        spyOn(dataManager, "add");
        spyOn(dataManager.ajaxPromises, "create").and.returnValue(promise);
        dataManager.data = Immutable.fromJS([{foo:"bar", id:2}]);
      });

      it("should return null if not valid", function() {
         spyOn(dataManager, "dataCheck").and.returnValue(false);
         let update = dataManager.create({foo:"bar", id:3});

         expect(update).toBeNull();
      });

      it("should call add", function() {
        dataManager.create({foo:"bar", id:1})
        expect(dataManager.add).toHaveBeenCalledWith({foo:"bar", id:1});
      });

      it("should call setUrl", function() {
        dataManager.create({foo:"bar", id:1})
        expect(dataManager.setUrl).toHaveBeenCalled();
      });

      it("should call ajaxPromises.create", function() {
        dataManager.create({foo:"bar", id:1})
        expect(dataManager.ajaxPromises.create).toHaveBeenCalled();

        let args = dataManager.ajaxPromises.create.calls.first().args;

        expect(args).toContain({foo:"bar", id:1});
      });

      it("should return success if resolved", function(done) {
        dataManager.create({foo:"bar", id:1}).then((suc)=>{
          expect(suc).toEqual("Success");
        });

        resolve("Success");

        setTimeout(function() {
          done();
        }, 100);
      });
    });


    describe('delete/remove', function() {
      let promise, resolve, reject;

      beforeEach(()=>{
        dataManager = new DataBase();
        dataManager.data = Immutable.fromJS([{foo:"bar", id:3}, {foo:"bar", id:2}]);
      });

      describe('remove', function() {
        it("should return null if not found", function() {
          let del = dataManager.remove(4);
          expect(del).toBeNull();
        });

        it("should remove item", function() {
          let del = dataManager.remove(3);
          expect(dataManager.data.size).toEqual(1);
          expect(del.toJS()).toEqual({foo:"bar", id:3});
        });
      });

      describe('destroy', function() {
        // let promise, resolve, reject;

        beforeEach(()=>{
          promise = new Promise((res, rej)=>{
            resolve = res;
            reject  = rej;
          });
          spyOn(dataManager, "setUrl");
          spyOn(dataManager.ajaxPromises, "destroy").and.returnValue(promise);
          // spyOn(dataManager, "remove").and.returnValue(dataManager.data.get(0));
        });

        it("should return null if no data", function() {
          spyOn(dataManager, "dataCheck").and.returnValue(false);
          let del = dataManager.destroy();
          expect(del).toBeNull();
        });

        it("should call setUrl", function() {
          spyOn(dataManager, "remove").and.returnValue(dataManager.data.get(0));
          spyOn(dataManager, "dataCheck").and.returnValue(true);

          let del = dataManager.destroy(3);
          expect(dataManager.setUrl).toHaveBeenCalled();
          expect(dataManager.remove).toHaveBeenCalledWith(3);
        });

        it("should call remove", function() {
          spyOn(dataManager, "remove").and.returnValue(dataManager.data.get(0));
          let del = dataManager.destroy(3);
          expect(dataManager.remove).toHaveBeenCalledWith(3);
        });

         it("should call ajaxPromises.destroy", function() {
          dataManager.destroy(3);
          expect(dataManager.ajaxPromises.destroy).toHaveBeenCalled();

          // let args = dataManager.ajaxPromises.destory.calls.first().args;

          // expect(args).toContain({foo:"bar", id:3});
        });

        it("should return success if resolved", function(done) {
          dataManager.destroy(3).then((suc)=>{
            expect(suc).toEqual("Success");
          })

          resolve("Success");

          setTimeout(function() {
            done();
          }, 100);
        });


      });
    });


    describe('search', function() {

      let genesis = [
        {title:"Tony Banks", instruments:" keyboards, backing vocals, guitar"},
        {title:"Mike Rutherford", instruments:"bass, guitars, backing vocals, bass pedals, twelve-string guitar, cello, electric sitar"},
        {title:"Phil Collins", instruments:"drums, percussion, lead and backing vocals, vibraphone, drum machine, Simmons drums"},
        {title:"Anthony Phillips", instruments:"lead guitar, twelve-string guitar, classical guitar, dulcimer, backing vocals"},
        {title:"Chris Stewart", instruments:"drums, percussion"},
        {title:"Peter Gabriel", instruments:"lead vocals, flute, tambourine, oboe, bass drum, accordion, theatrics"},
        {title:"John Silver", instruments:"drums, percussion, backing vocals"},
        {title:"John Mayhew", instruments:"drums, percussion, backing vocals"},
        {title:"Mick Barnard", instruments:"guitar"},
        {title:"Steve Hackett", instruments:"lead guitar, twelve-string guitar, classical guitar, autoharp"},
        {title:"Ray Wilson", instruments:"lead vocals"},
        {title:"Bill Bruford", instruments:"drums, percussion"},
        {title:"Chester Thompson", instruments:"drums, percussion"},
        {title:"Daryl Stuermer", instruments:"guitars, bass, backing vocals"},
        {title:"Nir Zidkyahu", instruments:"drums, percussion"},
        {title:"Nick D'Virgilio", instruments:"drums, percussion"},
        {title:"Anthony Drennan", instruments:"Silver bass"}
      ];

      beforeEach(()=>{
        dataManager = new DataBase();
        dataManager.data = Immutable.fromJS(genesis).toList();
      });

      it("should return the correct data if 'John' searched on title", function() {
        let searched = dataManager.search("john", ["title"]);
        expect(searched.size).toEqual(2);
      });

      it("should return the correct data if 'Silver' searched on all", function() {
        let searched = dataManager.search("silver", ["title", "instruments"]);
        expect(searched.size).toEqual(2);
      });




    });


    // it("should return error if rejected", function(done) {
    //     promise = dataManager.create({foo:"bar", id:1})
    //     expect(function() {
    //       promise.catch((err)=>{console.log(err)})
    //     }).toThrowError("Error")



    //     rejected("Error");

    //     setTimeout(function() {
    //       done();
    //     }, 100);
    //   });



});
