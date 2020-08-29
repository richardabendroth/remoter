const { expect } = require('chai');
const sinon = require('sinon');

const Remoter = require('./Remoter');

class µRemoter extends Promise {
  constructor (executor) {
    let resolver, 
        rejector; 
    super(
      (resolve, reject) => {
        resolver = resolve; 
        rejector = reject; 
        if (executor instanceof Function)
          executor(resolve, reject); 
      }
    ); 
    this.resolve = resolver; 
    this.reject = rejector; 
  }
}

//*
describe(`Testing Framework`, () => {
  describe(`µRemoter`, () => {
    it(`Resolves Extrinsicly`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter;
      remoter.then(
        value => {
          expect(value).to.equal(result); 
          done(); 
        }
      ); 
      remoter.resolve(result);
    });
    it(`Rejects Extrinsicly`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter;
      remoter.catch(
        error => {
          expect(error).to.equal(result); 
          done(); 
        }
      ); 
      remoter.reject(result);
    });  
    it(`Resolves Intrinsically`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter(
        (resolve, reject) => resolve(result) 
      );
      remoter.then(
        value => {
          expect(value).to.equal(result); 
          done(); 
        }
      ); 
      remoter.resolve(result);
    });
    it(`Rejects Intrinsically`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter(
        (resolve, reject) => reject(result) 
      );
      remoter.catch(
        error => {
          expect(error).to.equal(result) 
          done(); 
        }
      ); 
      remoter.reject(result);
    }); 
    it(`Executes .then callback`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter;
      remoter.then(
        value => {
          expect(value).to.equal(result); 
          done(); 
        } 
      ); 
      remoter.resolve(result);
    });
    it(`Executes .catch callback`, function (done) {
      this.timeout(5e2); 
      const result = Symbol(); 
      const remoter = new µRemoter;
      remoter.catch(
        error => {
          expect(error).to.equal(result); 
          done(); 
        } 
      ); 
      remoter.reject(result); 
    });
    it(`Executes .finally callback on fulfillment`, function (done) {
      this.timeout(5e2); 
      const remoter = new µRemoter;
      remoter.finally(
        () => done() 
      ); 
      remoter.resolve();
    });
      
    it(`Executes .finally callback on rejection`, function (done) {
      this.timeout(5e2); 
      const remoter = new µRemoter;
      remoter.catch(
        () => { undefined }
      ).finally(
        () => done() 
      ); 
      remoter.reject();
    }); 
  }); 
});
//*/

describe(Remoter.name, () => {

  const resolvingExecutor = (resolve, reject) => resolve(true);
  const rejectingExecutor = (resolve, reject) => reject(false);

  const promiseAggregators = [
    Promise.all, 
    Promise.any, 
    Promise.race, 
    Promise.allSettled
  ].filter(promiseAggregator => promiseAggregator !== undefined); 

  /*  
  describe(`Behaves like a Native Promise`, () => {
    it(`Is an instance of Native Promise`, () => {
      expect(new Remoter).to.be.instanceOf(Promise);
    }); 
    
    it(`Executes executor`, () => {
      let probe = false;
      const remoter = new Remoter(
        (resolve, reject) => { probe = true; }
      ).then(
        () => expect(probe).to.be.true
      ); 
    });
    
    //it(`Calles then`, () => {
    //
    //});
    //it(`Calles catch`, () => {
    //
    //});
    
    it(`Works with ${promiseAggregators.map(promiseAggregator => `${Promise.name}.${promiseAggregator.name}`).join(', ')}`, () => {
      const remoter = new Remoter().resolve(true);
      let i = 0; 
      promiseAggregators.forEach(
        promiseAggregator => 
          promiseAggregator.call(Promise, [remoter]).then(
            v => console.log(i++, v)
            //valueList => valueList.forEach(
            //  value => 
            //    expect(value).to.be.true
            //)
          )
      );
    }); 
    it(`Native Class signature is preserved`, () => {
      expect(Remoter.resolve).to.not.equal(Promise.resolve);
      expect(Remoter.reject).to.equal(Promise.reject);
    });
  });
  //*/
  //*  
  describe(`Interoperability`, () => {
    it(`Detects as thenable`, () => {
      const remoter = new Remoter; 
      expect(
        remoter.then != undefined
      ).to.be.true; 
    });
    it(`Detects as valid thenable`, () => {
      const remoter = new Remoter; 
      expect(remoter.then instanceof Function).to.be.true; 
    });
    it(`Returns identical [Symbol.toStringTag] value`, () => {
      const remoter = new Remoter, 
            promise = new Promise(_ => undefined), 
            promiseStringTag = Object.prototype.toString.call(promise); 
      expect(
        Object.prototype.toString.call(remoter) === promiseStringTag
      ).to.be.true; 
    });
  });
  //*/

  /*
  describe(`Extrinsic Behaviour`, () => {
    it(`Resolves Extrinsicly`, () => {
      const remoter = new Remoter;
      remoter.then(
        value =>
          expect(value).to.be.true
      ); 
      remoter.resolve(true);
    });
    it(`Rejects Extrinsicly`, () => {
      const remoter = new Remoter;
      remoter.catch(
        error =>
          expect(error).to.be.true
      ); 
      remoter.reject(true);
    });
  });
  //*/

  
  describe(`Lifecycle Audit properties`, () => {
    /*
    describe(`Resolved`, () => {
      it(`Extrinsically`, () => {
        const remoter = new Remoter;
        remoter.resolve(true);
        expect(remoter.resolved).to.be.true;
        expect(remoter.rejected).to.be.false;
        expect(remoter.remote).to.be.true;
        expect(remoter.resolvedRemotely).to.be.true;
        expect(remoter.rejectedRemotely).to.be.false;
      });
      it(`Intrinsically`, () => {
        const remoter = new Remoter(
          (resolve, reject) =>
            resolve(true)
        );
        remoter.then(
          () => {
            expect(remoter.resolved).to.be.true;
            expect(remoter.rejected).to.be.false;
            expect(remoter.remote).to.be.false;
            expect(remoter.resolvedRemotely).to.be.false;
            expect(remoter.rejectedRemotely).to.be.false;
          }
        );
      });
    });
    //*/
    /*
    describe(`Rejected`, () => {
      it(`Extrinsically`, () => {
        const remoter = new Remoter;
        remoter.catch(()=>undefined);
        remoter.reject(true);
        expect(remoter.resolved).to.be.false;
        expect(remoter.rejected).to.be.true;
        expect(remoter.remote).to.be.true;
        expect(remoter.resolvedRemotely).to.be.false;
        expect(remoter.rejectedRemotely).to.be.true;
      });
      it(`Intrinsically`, () => {
        const remoter = new Remoter(
          (resolve, reject) =>
            reject(true)
        );
        remoter.catch(
          () => {
            expect(remoter.resolved).to.be.false;
            expect(remoter.rejected).to.be.true;
            expect(remoter.remote).to.be.false;
            expect(remoter.resolvedRemotely).to.be.false;
            expect(remoter.rejectedRemotely).to.be.false;
          }
        );
      });
    });
    //*/
    //*
    describe(`Settled, Pending`, () => {
      it('Resolved Extrinsically', function (done) {
        this.timeout(5e2); 
        const result = Symbol(); 
        const remoter = new Remoter; 
        expect(remoter.pending).to.be.true; 
        expect(remoter.settled).to.be.false; 
        expect(remoter.remote).to.be.null; 
        expect(remoter.settledRemotely).to.be.false; 
        expect(remoter.resolved).to.be.false; 
        expect(remoter.resolvedRemotely).to.be.false; 
        remoter.resolve(result);  
        expect(remoter.pending).to.be.false; 
        expect(remoter.settled).to.be.true;
        expect(remoter.remote).to.be.true; 
        expect(remoter.settledRemotely).to.be.true; 
        expect(remoter.resolved).to.be.true; 
        expect(remoter.resolvedRemotely).to.be.true; 
        remoter.then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.pending).to.be.false; 
            expect(this.settled).to.be.true;
            expect(this.remote).to.be.true; 
            expect(this.settledRemotely).to.be.true; 
            expect(this.resolved).to.be.true; 
            expect(this.resolvedRemotely).to.be.true;     
            done(); 
          }
        )
      });
      it('Resolved Intrinsically', function (done) {
        this.timeout(5e2); 
        const result = Symbol(); 
        const remoter = new Remoter(
          (resolve, reject) => resolve(result)
        ).then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.pending).to.be.false; 
            expect(this.settled).to.be.true; 
            expect(this.remote).to.be.false; 
            expect(this.settledRemotely).to.be.false; 
            expect(this.resolved).to.be.true; 
            expect(this.resolvedRemotely).to.be.false; 
            done(); 
          }
        );
      });
      it('Rejected Extrinsically', function (done) {
        this.timeout(5e2); 
        const result = Symbol(); 
        const remoter = new Remoter; 
        expect(remoter.pending).to.be.true; 
        expect(remoter.settled).to.be.false; 
        expect(remoter.remote).to.be.null; 
        expect(remoter.settledRemotely).to.be.false; 
        expect(remoter.rejected).to.be.false;
        expect(remoter.rejectedRemotely).to.be.false; 
        remoter.catch(
          function (error) {
            expect(error).to.equal(result); 
            expect(this.pending).to.be.false;
            expect(this.settled).to.be.true; 
            expect(this.remote).to.be.true; 
            expect(this.settledRemotely).to.be.true; 
            expect(this.rejected).to.be.true;
            expect(this.rejectedRemotely).to.be.true; 
            done();   
          }
        ); 
        remoter.reject(result); 
      });
      it('Rejected Intrinsically', function (done) {
        this.timeout(5e2); 
        const result = Symbol(); 
        const remoter = new Remoter(
          (resolve, reject) => reject(result)
        ).catch(
          function (error) {
            expect(error).to.equal(result); 
            expect(this.pending).to.be.false; 
            expect(this.settled).to.be.true;
            expect(this.remote).to.be.false;
            expect(this.settledRemotely).to.be.false; 
            expect(this.rejected).to.be.true;
            expect(this.rejectedRemotely).to.be.false;
            done(); 
          }
        );
      });
    });
    //*/
  });

  //*
  describe(`Remoter specifics`, () => {
    it(`Protects read-only properties`, () => {
      const readOnlyStaticProperties = [
        'Promise', 
        'CB_ERROR', 
        'CB_ERRORS', 
        'CB_RESULT', 
        'CB_RESULTS'
      ]; 
      readOnlyStaticProperties.forEach(
        readOnlyProperty => {
          expect(
            () => Remoter[readOnlyProperty] = undefined
          ).to.throw;
        }
      ); 
      const remoter = new Remoter;
      const readOnlyInstanceProperties = [
        'remoter', 
        'promise', 
        'resolve', 
        'reject', 
        'callback', 
        'errorResultCallback', 
        'resultErrorCallback', 
        'customCallback', 
        'pending', 
        'settled', 
        'oversaturated', 
        'resolved', 
        'fulfilled', 
        'rejected', 
        'claimed', 
        'caught', 
        'remote', 
        'fulfilledRemotely', 
        'resolvedRemotely', 
        'rejectedRemotely', 
        'then', 
        'catch',  
        'finally', 
        'on', 
        'off'
      ]; 
      readOnlyInstanceProperties.forEach(
        readOnlyProperty => {
          expect(
            () => remoter[readOnlyProperty] = undefined
          ).to.throw;
        }
      ); 
    }); 
    it(`Keeps Remoter.Promise`, () => {
      expect(Remoter.Promise).to.equal(Promise); 
    });
  });
  //*/


  describe(`Chaining`, () => {
    //*
    it(`Remoter.resolve(promise) - extrinsic`, function (done) {
      this.timeout(5e2); 
      const promiseThenTest = new µRemoter, 
            remoterOversaturatedTest = new µRemoter, 
            remoterThenTest = new µRemoter; 
      Promise.all(
        [
          promiseThenTest, 
          remoterOversaturatedTest, 
          remoterThenTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const promise = new Promise(
        resolve => 
          setImmediate(
            () => resolve(innerResult)
          )
      ); 
      promise.then(
        value => {
          expect(value).to.equal(innerResult); 
          promiseThenTest.resolve(); 
        }
      );
      const remoter = Remoter.resolve(promise); 
      remoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(innerResult); 
          remoterOversaturatedTest.resolve(); 
        }
      ); 
      remoter.then(
        function (value) { 
          expect(this.remote).to.be.true;
          expect(value).to.equal(outerResult); 
          remoterThenTest.resolve(); 
        }
      );
      remoter.resolve(outerResult); 
    }); 
    //*/
    //*
    it(`Remoter.resolve(promise) - intrinsic`, function (done) {
      this.timeout(5e2); 
      const promiseThenTest = new µRemoter, 
            remoterOversaturatedTest = new µRemoter, 
            remoterThenTest = new µRemoter; 
      Promise.all(
        [
          promiseThenTest, 
          remoterOversaturatedTest, 
          remoterThenTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const promise = new Promise(
        resolve => resolve(innerResult)
      ); 
      promise.then(
        value => {
          expect(value).to.equal(innerResult); 
          promiseThenTest.resolve(); 
        }
      );
      const remoter = Remoter.resolve(promise); 
      remoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(outerResult); 
          remoterOversaturatedTest.resolve(); 
        }
      ); 
      remoter.then(
        function (value) { 
          expect(this.remote).to.be.false;
          expect(value).to.equal(innerResult); 
          remoterThenTest.resolve(); 
        }
      );
      setImmediate(
        () => remoter.resolve(outerResult)
      ); 
    }); 
    //*/
    //*
    it(`Promise.resolve(remoter) - extrinsic`, function (done) {
      this.timeout(5e2); 
      const promiseThenTest = new µRemoter, 
            remoterOversaturatedTest = new µRemoter, 
            remoterThenTest = new µRemoter; 
      Promise.all(
        [
          remoterThenTest, 
          remoterOversaturatedTest, 
          promiseThenTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const remoter = new Remoter(
        resolve => 
          setImmediate(
            () => resolve(innerResult)
          )
      ); 
      remoter.then(
        function (value) { 
          expect(this.remote).to.be.true;
          expect(value).to.equal(outerResult); 
          remoterThenTest.resolve(); 
        }
      );
      remoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(innerResult); 
          remoterOversaturatedTest.resolve(); 
        }
      );
      const promise = Promise.resolve(remoter); 
      promise.then(
        value => {
          expect(value).to.equal(outerResult); 
          promiseThenTest.resolve(); 
        }
      );
      remoter.resolve(outerResult); 
    }); 
    //*/
    //*
    it(`Promise.resolve(remoter) - intrinsic`, function (done) {
      this.timeout(5e2); 
      const promiseThenTest = new µRemoter, 
            remoterOversaturatedTest = new µRemoter, 
            remoterThenTest = new µRemoter; 
      Promise.all(
        [
          remoterThenTest, 
          remoterOversaturatedTest, 
          promiseThenTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const remoter = new Remoter(
        resolve => resolve(innerResult)
      ); 
      remoter.then(
        function (value) { 
          expect(this.remote).to.be.false;
          expect(value).to.equal(innerResult); 
          remoterThenTest.resolve(); 
        }
      );
      remoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(outerResult); 
          remoterOversaturatedTest.resolve(); 
        }
      );
      const promise = Promise.resolve(remoter); 
      promise.then(
        value => {
          expect(value).to.equal(innerResult); 
          promiseThenTest.resolve(); 
        }
      );
      setImmediate(
        () => remoter.resolve(outerResult)
      ); 
    }); 
    //*/
    //*
    it(`Remoter.resolve(remoter) - exrinsic`, function (done) {
      this.timeout(5e2); 
      const innerRemoterThenTest = new µRemoter, 
            innerRemoterOversaturatedTest = new µRemoter, 
            outerRemoterThenTest = new µRemoter, 
            outerRemoterOversaturatedTest = new µRemoter; 
      Promise.all(
        [
          innerRemoterThenTest, 
          innerRemoterOversaturatedTest, 
          outerRemoterThenTest, 
          outerRemoterOversaturatedTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const innerRemoter = new Remoter(
        resolve => 
          setImmediate(
            () => resolve(innerResult)
          )
      ); 
      innerRemoter.then(
        function (value) { 
          expect(this.remote).to.be.true;
          expect(value).to.equal(outerResult); 
          innerRemoterThenTest.resolve(); 
        }
      );
      innerRemoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(innerResult); 
          innerRemoterOversaturatedTest.resolve(); 
        }
      );
      const outerRemoter = Remoter.resolve(innerRemoter); 
      outerRemoter.then(
        function (value) {
          expect(this.remote).to.be.true;
          expect(value).to.equal(outerResult); 
          outerRemoterThenTest.resolve(); 
        }
      );
      outerRemoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(innerResult); 
          outerRemoterOversaturatedTest.resolve(); 
        }
      );
      innerRemoter.resolve(outerResult); 
      outerRemoter.resolve(innerResult); 
    }); 
    //*/
    //*
    it(`Remoter.resolve(remoter) - intrinsic`, function (done) {
      this.timeout(5e2); 
      const innerRemoterThenTest = new µRemoter, 
            innerRemoterOversaturatedTest = new µRemoter, 
            outerRemoterThenTest = new µRemoter, 
            outerRemoterOversaturatedTest = new µRemoter; 
      Promise.all(
        [
          innerRemoterThenTest, 
          innerRemoterOversaturatedTest, 
          outerRemoterThenTest, 
          outerRemoterOversaturatedTest
        ]
      ).finally(
        () => done()
      ); 
      const innerResult = Symbol('innerResult'), 
            outerResult = Symbol('outerResult');       
      const innerRemoter = new Remoter(
        resolve => resolve(innerResult)
      ); 
      innerRemoter.then(
        function (value) { 
          expect(this.remote).to.be.false;
          expect(value).to.equal(innerResult); 
          innerRemoterThenTest.resolve(); 
        }
      );
      innerRemoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(outerResult); 
          innerRemoterOversaturatedTest.resolve(); 
        }
      );
      const outerRemoter = Remoter.resolve(innerRemoter); 
      outerRemoter.then(
        function (value) {
          expect(this.remote).to.be.false;
          expect(value).to.equal(innerResult); 
          outerRemoterThenTest.resolve(); 
        }
      );
      outerRemoter.on(
        'oversaturated', 
        valueOrError => {
          expect(valueOrError).to.equal(outerResult); 
          outerRemoterOversaturatedTest.resolve(); 
        }
      );
      setImmediate(
        () => {
          innerRemoter.resolve(outerResult); 
          outerRemoter.resolve(outerResult); 
        }
      ); 
    }); 
    //*/
  });

});
