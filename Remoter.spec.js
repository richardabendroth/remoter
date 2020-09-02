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

  const defaultForFinallyArgument = Remoter.finallyArgument, 
        defaultForInstanceArgument = Remoter.instanceArgument, 
        defaultForNativeComposition = Remoter.nativeComposition; 

  beforeEach(
    () => { 
      // Restore Defaults
      Remoter.finallyArgument = defaultForFinallyArgument; 
      Remoter.instanceArgument = defaultForInstanceArgument; 
      Remoter.nativeComposition = defaultForNativeComposition; 
    }
  )

  const resolvingExecutor = (resolve, reject) => resolve(true);
  const rejectingExecutor = (resolve, reject) => reject(false);

  describe(`Behaves like a Native Promise`, () => {
    //*  
    it(`Is an instance of Native Promise`, () => {
      expect(new Remoter).to.be.instanceOf(Promise);
    });
    //*/ 
    //*
    it(`Executes executor`, function (done) {
      this.timeout(5e2); 
      const remoter = new Remoter(
        resolve => { resolve(); done(); }
      );
    });
    //*/
    //*
    it(`Resolves intriniscally`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result');
      const remoter = new Remoter(
        resolve => resolve(result)
      ).then(
        value => {
          expect(value).to.equal(result); 
          done(); 
        }
      )
    });
    //*/
    //*
    it(`Rejects intriniscally`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result');
      const remoter = new Remoter(
        (_, reject) => reject(result)
      ).catch(
        error => {
          expect(error).to.equal(result); 
          done(); 
        }
      )
    });
    //*/
    //*
    it(`Calls then, then, finally`, function (done) {
      this.timeout(5e2); 
      const testThen1Called = new µRemoter, 
            testThen2Called = new µRemoter, 
            testFinallyCalled = new µRemoter; 
      Promise.all(
        [
          testThen1Called, 
          testThen2Called,  
          testFinallyCalled
        ]
      ).then(
        () => done()
      )
      const result = Symbol('result');
      const remoter = new Remoter(
        resolve => resolve(result)
      ); 
      remoter.then(testThen1Called.resolve); 
      remoter.then(testThen2Called.resolve); 
      remoter.finally(testFinallyCalled.resolve); 
    });
    //*/
    //*
    it(`Calls catch, catch, finally`, function (done) {
      this.timeout(5e2); 
      const testCatch1Called = new µRemoter, 
            testCatch2Called = new µRemoter, 
            testFinallyCalled = new µRemoter; 
      Promise.all(
        [
          testCatch1Called, 
          testCatch2Called,  
          testFinallyCalled
        ]
      ).then(
        () => done()
      )
      const result = Symbol('result');
      const remoter = new Remoter(
        (_, reject) => reject(result)
      ); 
      remoter.catch(testCatch1Called.resolve); 
      remoter.catch(testCatch2Called.resolve);
      remoter.finally(testFinallyCalled.resolve);
    });
    //*/
    //*
    it(`Calls finally without rejection warning`, function (done) {
      this.timeout(5e2); 
      Remoter.nativeComposition = true; 
      const remoter = new Remoter(
        (_, reject) => reject()
      ).finally(
        () => done()
      ); 
    });
    //*/
    describe(`Chaining`, () => {
      //*
      it(`Resolve Callback composition`, function (done) {
        this.timeout(5e2); 
        const testThen1Called = new µRemoter, 
              testFinally1Called = new µRemoter, 
              testThen2Called = new µRemoter,  
              testFinally2Called = new µRemoter; 
        Promise.all(
          [
            testThen1Called, 
            testFinally1Called, 
            testThen2Called, 
            testFinally2Called
          ]
        ).then(
          values => done()
        )
        const result = Symbol('result'); 
        Remoter.nativeComposition = true; 
        const remoter = new Remoter(
          (resolve, reject) => resolve(result)
        ).then(
          testThen1Called.resolve
        ).finally(
          testFinally1Called.resolve
        ).then(
          testThen2Called.resolve
        ).finally(
          testFinally2Called.resolve
        ); 
      });
      //*/
      //*
      it(`Reject Callback Chaining`, function (done) {
        this.timeout(5e2); 
        const testCatch1Called = new µRemoter, 
              testFinally1Called = new µRemoter, 
              testCatch2Called = new µRemoter,  
              testFinally2Called = new µRemoter; 
        Promise.all(
          [
            testCatch1Called, 
            testFinally1Called, 
            testCatch2Called, 
            testFinally2Called
          ]
        ).then(
          () => done()
        )
        const result = Symbol('result'); 
        /* TODO: Check whats wrong here */
        Remoter.nativeComposition = false; 
        const remoter = new Remoter(
          (resolve, reject) => reject(result)
        ).catch(
          testCatch1Called.resolve
        ).finally(
          testFinally1Called.resolve
        ).catch(
          testCatch2Called.resolve
        ).finally(
          testFinally2Called.resolve
        ); 
      });
      //*/
      //*
      it(`Composition: resolve`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        Remoter.nativeComposition = true; 
        const innerRemoter = new Remoter(
          resolve => resolve(result)
        )
        const outerRemoter = new Remoter(
          resolve => resolve(innerRemoter)
        ); 
        outerRemoter.then(
          value => {
            expect(value).to.equal(result); 
            done(); 
          }
        )
      });
      //*/
      //*
      it(`Composition: reject`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        Remoter.nativeComposition = true; 
        const innerRemoter = new Remoter(
          (_, reject) => reject(result)
        )
        const outerRemoter = new Remoter(
          resolve => resolve(innerRemoter)
        ); 
        outerRemoter.catch(
          error => {
            expect(error).to.equal(result); 
            done(); 
          }
        )
      });
      //*/
      //*
      it(`Value chaining`, function (done) {
        this.timeout(5e2); 
        const result1 = Symbol('result1'), 
              result2 = Symbol('result2'), 
              result3 = Symbol('result3'), 
              result = [result1]; 
        /* TODO: Check whats wrong here */
        Remoter.nativeComposition = false; 
        new Remoter(
          resolve => resolve(result)
        ).then(
          value => value.push(result2)
        ).then(
          value => value.push(result3)
        ).then(
          value => {
            expect(value).to.equal(result); 
            expect(value).to.eql([result1, result2, result3]); 
            done(); 
          }
        );
    
      });
      //*/
    });
    //*
    it(`Native Class signature is preserved`, () => {
      expect(Remoter.resolve).to.not.equal(Promise.resolve);
      expect(Remoter.reject).to.equal(Promise.reject);
    });
    //*/

    /* TODO: Remoter Aggregators with Remoter*/
  });    
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

    it(`Works with Promise aggregators, e.g. Promise.all`, () => {
      /*
      const promiseAggregators = [
        Promise.all: (() => { const remoter = new Remoter; return {} })(), 
        Promise.any, 
        Promise.race, 
        Promise.allSettled
      ].filter(promiseAggregator => promiseAggregator !== undefined); 


      const promiseAggregators = [
        Promise.all, 
        Promise.any, 
        Promise.race, 
        Promise.allSettled
      ].filter(promiseAggregator => promiseAggregator !== undefined); 
    

      const result = Symbol('result'); 
      const remoter = new Remoter().resolve(result); 
      let i = 0; 
      promiseAggregators.forEach(
        promiseAggregator => 
          promiseAggregator.call(Promise, [remoter]).then(
            valueList => {
              console.log(valueList); 
              return 
              valueList.forEach(
                value => 
                  expect(value).to.equal(result)
              )
            }
          )
      );
      */
    }); 

  });
  //*/
  //*
  it(`Resolves Externally`, function (done) {
    this.timeout(5e2); 
    const remoter = new Remoter(
      resolve => { resolve(); done(); }
    );
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
        'fulfill', 
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
        resolve => setImmediate(resolve, innerResult)
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
      setImmediate(remoter.resolve, outerResult); 
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
        resolve => setImmediate(resolve, innerResult)
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
      setImmediate(remoter.resolve, outerResult); 
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
        resolve => setImmediate(resolve, innerResult)
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
  describe(`.remote chaining`, () => {
    //*
    it(`Remoter.resolve(remoter): resolve - .remote===true`, function (done) {
      this.timeout(5e2);  
      const result = Symbol('result'); 
      const innerRemoter = new Remoter; 
      const outerRemoter = Remoter.resolve(innerRemoter); 
      outerRemoter.then(
        function (value) {
          expect(this.remote).to.be.true;
          expect(innerRemoter.remote).to.equal(this.remote); 
          expect(value).to.equal(result); 
          done(); 
        }
      );
      innerRemoter.resolve(result); 
    }); 
    //*/
    //*
    it(`Remoter.resolve(remoter): resolve .remote===false`, function (done) {
      this.timeout(5e2);  
      const result = Symbol('result'); 
      const innerRemoter = new Remoter(
        resolve => setImmediate(resolve, result)
      ); 
      const outerRemoter = Remoter.resolve(innerRemoter); 
      outerRemoter.then(
        function (value) {
          expect(this.remote).to.be.false;
          expect(innerRemoter.remote).to.equal(this.remote); 
          expect(value).to.equal(result); 
          done(); 
        }
      );
    }); 
    //*/
    it(`Remoter.resolve(remoter): reject - .remote===true`, function (done) {
      this.timeout(5e2);  
      const result = Symbol('result'); 
      const innerRemoter = new Remoter; 
      const outerRemoter = Remoter.resolve(innerRemoter); 
      outerRemoter.catch(
        function (value) {
          expect(this.remote).to.be.true;
          expect(innerRemoter.remote).to.equal(this.remote); 
          expect(value).to.equal(result); 
          done(); 
        }
      );
      innerRemoter.reject(result); 
    }); 
    //*/
  });
  describe(`.finallyArgument Setting`, () => {
    //*
    it(`resolve: .finallyArgument===true`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const remoter = new Remoter; 
      remoter.finally(
        valueOrError => {
          expect(valueOrError).to.equal(result);
          done(); 
        }
      ); 
      remoter.instanceArgument = false; 
      remoter.finallyArgument = true; 
      remoter.resolve(result); 
    });
    //*/
    //*
    it(`reject: .finallyArgument===true`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const remoter = new Remoter; 
      remoter.finally(
        valueOrError => {
          expect(valueOrError).to.equal(result);
          done(); 
        }
      ); 
      remoter.instanceArgument = false; 
      remoter.finallyArgument = true; 
      remoter.reject(result); 
    });
    //*/
    //*
    it(`.finallyArgument===false`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const remoter = new Remoter; 
      remoter.finally(
        valueOrError => {
          expect(valueOrError).to.equal(undefined);
          done(); 
        }
      ); 
      remoter.instanceArgument = false; 
      remoter.finallyArgument = false; 
      remoter.resolve(result); 
    });
    //*/
  });
  describe(`.instanceArgument Setting`, () => {
    //*
    it(`No-prototype Function: .instanceArgument===true`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(result);
        expect(instance).to.equal(remoter); 
        done(); 
      }
      const remoter = new Remoter; 
      remoter.instanceArgument = true; 
      remoter.then(callbackWithoutPrototype); 
      remoter.resolve(result); 
    });
    //*/
    //*
    it(`No-prototype Function: .instanceArgument===false`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(result);
        expect(instance == undefined).to.be.true; 
        done(); 
      }
      const remoter = new Remoter; 
      remoter.instanceArgument = false; 
      remoter.then(callbackWithoutPrototype); 
      remoter.resolve(result); 
    });
    //*/
    //*
    it(`No-prototype Function: .instanceArgument===(default)`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(result);
        expect(instance).to.equal(remoter); 
        done(); 
      }
      const remoter = new Remoter; 
      remoter.instanceArgument = null; 
      remoter.then(callbackWithoutPrototype); 
      remoter.resolve(result); 
    });
    //*/
    //*
    it(`Prototype Function: .instanceArgument===true`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result'); 
      const callbackPrototype = function (value, instance) {
        expect(value).to.equal(result); 
        expect(instance == undefined).to.be.true; 
        done(); 
      }
      const remoter = new Remoter; 
      remoter.instanceArgument = true; 
      remoter.then(callbackPrototype); 
      remoter.resolve(result); 
    });
    //*/

  });


});
