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
      // Remove all Event Listeners
      Remoter.off(); 
      // Reset native Promise Reference 
      if (Promise !== Remoter.Promise)
        Promise = Remoter.Promise; 
    }
  )

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
    it(`Fulfills intriniscally`, function (done) {
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
    it(`Resolves intriniscally`, function (done) {
      this.timeout(5e2); 
      const result = Symbol('result');
      const innerRemoter = new Remoter(
        resolve => resolve(result)
      ); 
      const outerRemoter = new Remoter(
        resolve => resolve(innerRemoter)
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

  describe(`Instance Slots`, () => {
    it(`.remoter returns persistent instance reference to itself`, () => {
      const remoter = new Remoter; 
      expect(remoter.remoter).to.equal(remoter); 
      expect(remoter.remoter).to.equal(remoter.remoter); 
    });
    it(`.promise returns persistent instance reference to a following promise`, () => {
      const remoter = new Remoter; 
      expect(remoter.promise).to.equal(remoter.promise); 
    });
    it(`.promise resolves from remoter instance`, function (done) {
      this.timeout(5e2); 
      const testValue = Symbol('value'); 
      const remoter = new Remoter; 
      remoter.promise.then(
        value => {
          expect(value).to.equal(testValue); 
          done(); 
        }
      ); 
      remoter.resolve(testValue); 
    });
    it(`.promise rejects from remoter instance`, function (done) {
      this.timeout(5e2); 
      const testValue = Symbol('value'); 
      const remoter = new Remoter; 
      remoter.promise.catch(
        value => {
          expect(value).to.equal(testValue); 
          done(); 
        }
      ); 
      remoter.reject(testValue); 
    });
  });

  describe(`Remote Settling Methods`, () => {
    it(`.resolve`, function (done) {
      this.timeout(5e2); 
      const testValue = Symbol('value'); 
      const remoter = new Remoter; 
      remoter.promise.then(
        value => {
          expect(value).to.equal(testValue); 
          done(); 
        }
      ); 
      remoter.resolve(testValue); 
    });
    it(`.fulfill`, function (done) {
      this.timeout(5e2); 
      const testValue = Symbol('value'); 
      const remoter = new Remoter; 
      remoter.promise.then(
        value => {
          expect(value).to.equal(testValue); 
          done(); 
        }
      ); 
      remoter.fulfill(testValue); 
    });
    it(`.reject`, function (done) {
      this.timeout(5e2); 
      const testErr0r = Symbol('value'); 
      const remoter = new Remoter; 
      remoter.promise.catch(
        error => {
          expect(error).to.equal(testErr0r); 
          done(); 
        }
      ); 
      remoter.reject(testErr0r); 
    });
  });

  describe(`Result Handling Decoration`, () => {
    it(`.then(onFulfill) Non-prototye Function`, function (done) {
      const testValue = Symbol('value'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(testValue); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.then(callbackWithoutPrototype); 
      remoter.resolve(testValue); 
    });
    it(`.then(onFulfill) Prototye Function`, function (done) {
      const testValue = Symbol('value'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (value, instance) {
        expect(value).to.equal(testValue); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.then(callbackWithoutPrototype); 
      remoter.resolve(testValue); 
    });
    it(`.catch(onReject) Non-prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (error, instance) => {
        expect(error).to.equal(testError); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.catch(callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.catch(onReject) Prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (error, instance) {
        expect(error).to.equal(testError); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.catch(callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.then(undefined, onReject) Non-prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (error, instance) => {
        expect(error).to.equal(testError); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.then(undefined, callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.then(undefined, onReject) Prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (error, instance) {
        expect(error).to.equal(testError); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.then(undefined, callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.then(onFulfill, onReject) Non-prototye Function`, function (done) {
      const testValue = Symbol('value'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(testValue); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.then(callbackWithoutPrototype, () => {}); 
      remoter.resolve(testValue); 
    });
    it(`.then(onFulfill, onReject) Prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (error, instance) {
        expect(error).to.equal(testError); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.then(() => {}, callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.finally(onFinally) Non-prototye Function`, function (done) {
      const testValue = Symbol('value'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (value, instance) => {
        expect(value).to.equal(testValue); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.finally(callbackWithoutPrototype); 
      remoter.resolve(testValue); 
    });
    it(`.finally(onFinally) Prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (error, instance) {
        expect(error).to.equal(testError); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.finally(callbackWithoutPrototype); 
      remoter.reject(testError); 
    });
    it(`.then(onFinally, onFinally) Non-prototye Function`, function (done) {
      const testError = Symbol('error'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = (error, instance) => {
        expect(error).to.equal(testError); 
        expect(instance).to.equal(remoter); 
        done(); 
      }
      remoter.then(callbackWithoutPrototype, callbackWithoutPrototype); 
      remoter.resolve(testError); 
    });
    it(`.then(onFinally, onFinally) Prototye Function`, function (done) {
      const testValue = Symbol('value'); 
      const remoter = new Remoter;
      const callbackWithoutPrototype = function (value, instance) {
        expect(value).to.equal(testValue); 
        expect(instance).to.be.undefined; 
        expect(this).to.equal(remoter); 
        done(); 
      }
      remoter.then(callbackWithoutPrototype, callbackWithoutPrototype); 
      remoter.reject(testValue); 
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
            expect(valueOrError).to.be.undefined;
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
      it(`Non-prototype Function: .instanceArgument===true`, function (done) {
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
      it(`Non-prototype Function: .instanceArgument===false`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const callbackWithoutPrototype = (value, instance) => {
          expect(value).to.equal(result);
          expect(instance).to.be.undefined; 
          done(); 
        }
        const remoter = new Remoter; 
        remoter.instanceArgument = false; 
        remoter.then(callbackWithoutPrototype); 
        remoter.resolve(result); 
      });
      //*/
      //*
      it(`Non-prototype Function: .instanceArgument===(default)`, function (done) {
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
        const remoter = new Remoter; 
        const callbackPrototype = function (value, instance) {
          expect(value).to.equal(result); 
          expect(instance).to.be.undefined; 
          expect(this).to.equal(remoter); 
          done(); 
        }
        remoter.instanceArgument = true; 
        remoter.then(callbackPrototype); 
        remoter.resolve(result); 
      });
      //*/
      //*
      it(`Prototype Function: .instanceArgument===false`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const remoter = new Remoter; 
        const callbackPrototype = function (value, instance) {
          expect(value).to.equal(result); 
          expect(instance).to.be.undefined; 
          expect(this).to.equal(remoter); 
          done(); 
        }
        remoter.instanceArgument = false; 
        remoter.then(callbackPrototype); 
        remoter.resolve(result); 
      });
      //*/
    });
  
  }); 
  
  describe(`Lifecycle Audit properties`, () => {
    describe(`State`, () => {
      it(`.fulfilled`, function (done) {
        const testValue = Symbol('value'); 
        const remoter = new Remoter; 
        expect(remoter.fulfilled).to.be.false; 
        remoter.then(
          function (value) {
            expect(value).to.equal(testValue); 
            expect(remoter.fulfilled).to.be.true; 
            done(); 
          }
        ); 
        remoter.resolve(testValue); 
      });
      /*
      .fulfilled (not/internal/external)
      .rejected (not/internal/external)
      .pending (not/internal/external)
      .settled (not/internal/external)
      .oversaturated (not/internal/external) 
      //*/
    });

    describe(`Fate`, () => {
      /*
      .resolved (not/internal/external)
      .claimed (not/internal/external)
      .caught (not/internal/external)
      .finalized (not/internal/external)
      //*/
    });

    describe(`Realm`, () => {
      /*
      .remote (internal/external/null)
      //*/
    });

    describe(`Sugar`, () => {
      /*
      .settledRemotely (not/internal/external/null)
      .resolvedRemotely (not/internal/external/null)
      .fulfilledRemotely (not/internal/external/null) DOCS ARE WRONG!
      .rejectedRemotely (not/internal/external/null)
      //*/
    });

    describe(`Realm`, () => {
      /*
      .remote (internal/external/null)
      //*/
    });


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
      const readOnlyStaticValues = [
        'Promise', 
        'CB_ERROR', 
        'CB_ERRORS', 
        'CB_RESULT', 
        'CB_RESULTS'
      ]; 
      readOnlyStaticValues.forEach(
        readOnlyValue => {
          const value = Remoter[readOnlyValue]; 
          Remoter[readOnlyValue] = undefined; 
          expect(Remoter[readOnlyValue]).to.equal(value);
        }
      ); 
      const remoter = new Remoter;
      const readOnlyInstanceValues = [
        'remoter'
      ]; 
      readOnlyInstanceValues.forEach(
        readOnlyValue => {
          const value = remoter[readOnlyValue]; 
          remoter[readOnlyValue] = undefined; 
          expect(remoter[readOnlyValue]).to.equal(value);
        }
      ); 
      const readOnlyInstanceProperties = [
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
        'finalized', 
        'remote', 
        'settledRemotely', 
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
            () => (remoter[readOnlyProperty] = undefined)
          ).to.throw();
        }
      ); 
    }); 
    it(`Keeps Remoter.Promise`, () => {
      expect(Remoter.Promise).to.equal(Promise); 
    });
  });
  //*/


  describe(`Composition`, () => {
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

  describe(`Callback Generation`, () => {
    describe(`.errorResultCallback`, () => {
      it(`fulfills on (<falsy>, result)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const {remoter, errorResultCallback} = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        errorResultCallback(null, result); 
      }); 
      it(`rejects on (error, result)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'), 
              error = Symbol('error'); 
        const {remoter, errorResultCallback} = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.equal(error); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        errorResultCallback(error, result); 
      }); 
      it(`stable callback reference`, function () {
        const remoter = new Remoter; 
        expect(remoter.errorResultCallback).to.equal(remoter.errorResultCallback); 
      }); 
    }); 
    describe(`.callback`, () => {
      it(`is alias for .errorResultCallback`, function () {
        const remoter = new Remoter; 
        expect(remoter.callback).to.equal(remoter.errorResultCallback); 
      }); 
    }); 
    describe(`.resultErrorCallback`, () => {
      it(`fulfills on (result)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const {remoter, resultErrorCallback} = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        resultErrorCallback(result); 
      }); 
      it(`rejects on (result, error)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'), 
              error = Symbol('error'); 
        const {remoter, resultErrorCallback} = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.equal(error); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        resultErrorCallback(result, error); 
      }); 
      it(`stable callback reference`, function () {
        const remoter = new Remoter; 
        expect(remoter.resultErrorCallback).to.equal(remoter.resultErrorCallback); 
      }); 
    }); 
    describe(`.customCallback`, () => {
      it(`Throws for signature without tokens`, function () {
        const remoter = new Remoter; 
        expect(() => remoter.customCallback()).to.throw(); 
        expect(() => remoter.customCallback(undefined, null)).to.throw(); 
      }); 
      it(`Throws for duplicate tokens`, function () {
        const remoter = new Remoter; 
        expect(() => remoter.customCallback(Remoter.CB_ERROR, Remoter.CB_ERROR)).to.throw(); 
        expect(() => remoter.customCallback(Remoter.CB_ERRORS, Remoter.CB_ERRORS)).to.throw(); 
        expect(() => remoter.customCallback(Remoter.CB_RESULT, Remoter.CB_RESULT)).to.throw(); 
        expect(() => remoter.customCallback(Remoter.CB_RESULTS, Remoter.CB_RESULTS)).to.throw(); 
      }); 
      it(`Throws for combinations of tokens with corresponding array tokens`, function () {
        const remoter = new Remoter; 
        expect(() => remoter.customCallback(Remoter.CB_ERROR, Remoter.CB_ERRORS)).to.throw(); 
        expect(() => remoter.customCallback(Remoter.CB_RESULT, Remoter.CB_RESULTS)).to.throw(); 
      }); 
      it(`Throws if array token is not last token`, function () {
        const remoter = new Remoter; 
        expect(() => remoter.customCallback(Remoter.CB_ERRORS, undefined)).to.throw(); 
      }); 
      it(`Callback returns void (undefined)`, function () {
        const result = Symbol('result'); 
        const remoter = new Remoter; 
        expect(
          remoter.customCallback(Remoter.CB_RESULT)(result)
        ).to.be.undefined; 
      }); 
      it(`(CB_ERROR) rejects (error)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const remoter = new Remoter; 
        remoter.catch(
          function (error) {
            expect(error).to.equal(result); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERROR)(result); 
      }); 
      it(`(CB_ERROR) rejects when (<falsy>)`, function (done) {
        this.timeout(5e2); 
        const remoter = new Remoter; 
        remoter.catch(
          function (error) {
            expect(error).to.be.not.ok; 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERROR)(); 
      }); 
      it(`(CB_RESULT) resolves (value)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const remoter = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_RESULT)(result); 
      }); 
      it(`(CB_RESULT) resolves when (<falsy>)`, function (done) {
        this.timeout(5e2); 
        const remoter = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.be.not.ok; 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_RESULT)(); 
      }); 
      it(`(CB_ERROR, CB_RESULT) rejects (error, result)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'),  
              error = Symbol('error'); 
        const remoter = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.equal(error); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERROR, Remoter.CB_RESULT)(error, result); 
      }); 
      it(`(CB_ERROR, CB_RESULT) resolves (<fasly>, result)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'); 
        const remoter = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.equal(result); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERROR, Remoter.CB_RESULT)(undefined, result); 
      }); 
      it(`(CB_ERROR, CB_RESULTS) resolves (<fasly>, result1, result2)`, function (done) {
        this.timeout(5e2); 
        const result1 = Symbol('result1'), 
              result2 = Symbol('result2'); 
        const remoter = new Remoter; 
        remoter.then(
          function (value) {
            expect(value).to.eql([result1, result2]); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERROR, Remoter.CB_RESULTS)(undefined, result1, result2); 
      }); 
      it(`(CB_RESULT, CB_ERRORS) rejects (result, error1, error2)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'), 
              error1 = Symbol('error1'), 
              error2 = Symbol('error2'); 
        const remoter = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.eql([error1, error2]); 
            expect(this.resolvedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_RESULT, Remoter.CB_ERRORS)(undefined, error1, error2); 
      }); 
      it(`(CB_ERRORS) rejects ()`, function (done) {
        this.timeout(5e2); 
        const remoter = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.eql([]); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(Remoter.CB_ERRORS)(); 
      }); 
      it(`(undefined, CB_RESULT, null, CB_ERRORS) rejects (true, result, false, error1, error2)`, function (done) {
        this.timeout(5e2); 
        const result = Symbol('result'), 
              error1 = Symbol('error1'), 
              error2 = Symbol('error2'); 
        const remoter = new Remoter; 
        remoter.catch(
          function (err) {
            expect(err).to.eql([error1, error2]); 
            expect(this.rejectedRemotely).to.be.true; 
            done(); 
          }
        ); 
        remoter.customCallback(
          undefined, 
          Remoter.CB_RESULT, 
          null, 
          Remoter.CB_ERRORS
        )(true, result, false, error1, error2); 
      }); 
      it(`getter spawns new callback for identical signatures`, function () {
        const remoter = new Remoter; 
        expect(remoter.customCallback(Remoter.CB_ERROR)).to.not.equal(remoter.customCallback(Remoter.CB_ERROR)); 
      }); 
    }); 
  }); 
  describe(`Lifecycle Events`, () => {
    describe(`Remoter Emitter`, () => {
      it ('Registers event listener (eventName, listener)', function (done) {
        this.timeout(5e2); 
        const listener = function () {
          done(); 
        }
        const result = Remoter.on('create', listener); 
        expect(result).to.equal(Remoter); 
        const remoter = new Remoter; 
      }); 
      it ('De-registers event listener (eventName, listener)', function (done) {
        this.timeout(5e2); 
        let emitted = 0; 
        const listener = () => { 
          emitted++; 
        }
        Remoter.on('create', listener).on('create', listener); 
        const result = Remoter.off('create', listener); 
        expect(result).to.equal(Remoter); 
        const remoter = new Remoter; 
        setImmediate(
          () => {
            expect(emitted).to.equal(1); 
            done(); 
          }
        ); 
      }); 
      it ('De-registers all event listeners for one event (eventName)', function (done) {
        this.timeout(5e2); 
        let didNotEmit = true; 
        const listener1 = () => { 
          didNotEmit = false; 
        }
        const listener2 = () => { 
          didNotEmit = false; 
        }
        Remoter.on('create', listener1).on('create', listener2); 
        const result = Remoter.off('create'); 
        expect(result).to.equal(Remoter); 
        const remoter = new Remoter; 
        setImmediate(
          () => {
            expect(didNotEmit).to.be.true; 
            done(); 
          }
        ); 
      }); 
      it ('De-registers all event listeners ()', function (done) {
        this.timeout(5e2); 
        let didNotEmit = true; 
        const listener1 = () => { 
          didNotEmit = false; 
        }
        const listener2 = () => { 
          didNotEmit = false; 
        }
        Remoter.on('create', listener1).on('*', listener2); 
        const result = Remoter.off(); 
        expect(result).to.equal(Remoter); 
        const remoter = new Remoter; 
        setImmediate(
          () => {
            expect(didNotEmit).to.be.true; 
            done(); 
          }
        ); 
      }); 
    }); 
    describe(`Remoter Events`, () => {
      //*
      it (`'create'`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListener
        ]).then(
          () => done()
        )
        const testEventName = 'create'; 
        let remoter; 
        const eventListener = function (remoterInstance) {
          expect(remoterInstance).to.equal(remoter); 
          testEventListener.resolve(); 
        }
        const allListener = function (eventName, remoterInstance) {
          expect(eventName).to.equal(testEventName); 
          expect(remoterInstance).to.equal(remoter); 
          testAllListener.resolve(); 
        }
        Remoter.on(testEventName, eventListener); 
        Remoter.on('*', allListener); 
        remoter = new Remoter; 
      }); 
      //*/
      //*
      it (`'*' event explicitly tested via every other event test`, () => {
        // Purposefully left blank
      }); 
      //*/
    }); 
    describe(`Instance Emitter`, () => {
      it ('Registers event listener (eventName, listener)', function (done) {
        this.timeout(5e2); 
        const listener = function () {
          done(); 
        }
        const remoter = new Remoter; 
        const result = remoter.on('fulfilled', listener); 
        expect(result).to.equal(remoter); 
        remoter.resolve(); 
      }); 
      it ('De-registers event listener (eventName, listener)', function (done) {
        this.timeout(5e2); 
        let emitted = 0; 
        const listener = () => { 
          emitted++; 
        }
        const remoter = new Remoter; 
        remoter.on('fulfilled', listener).on('fulfilled', listener); 
        const result = remoter.off('fulfilled', listener); 
        expect(result).to.equal(remoter); 
        remoter.resolve(); 
        setImmediate(
          () => {
            expect(emitted).to.equal(1); 
            done(); 
          }
        ); 
      }); 
      it ('De-registers all event listeners for one event (eventName)', function (done) {
        this.timeout(5e2); 
        let didNotEmit = true; 
        const listener1 = () => { 
          didNotEmit = false; 
        }
        const listener2 = () => { 
          didNotEmit = false; 
        }
        const remoter = new Remoter; 
        remoter.on('fulfilled', listener1).on('fulfilled', listener2); 
        const result = remoter.off('fulfilled'); 
        expect(result).to.equal(remoter); 
        remoter.resolve(); 
        setImmediate(
          () => {
            expect(didNotEmit).to.be.true; 
            done(); 
          }
        ); 
      }); 
      it ('De-registers all event listeners ()', function (done) {
        this.timeout(5e2); 
        let didNotEmit = true; 
        const listener1 = () => { 
          didNotEmit = false; 
        }
        const listener2 = () => { 
          didNotEmit = false; 
        }
        const remoter = new Remoter; 
        remoter.on('fulfilled', listener1).on('*', listener2); 
        const result = remoter.off(); 
        expect(result).to.equal(remoter); 
        remoter.resolve(); 
        setImmediate(
          () => {
            expect(didNotEmit).to.be.true; 
            done(); 
          }
        ); 
      }); 
      //*
      it(`this Argument for non-prototype Function`, function (done) {
        this.timeout(5e2); 
        const listenerWithoutPrototype = (...args) => {
          const instance = args.reverse()[0]; 
          expect(instance).to.equal(remoter); 
          done(); 
        }
        const remoter = new Remoter; 
        remoter.on('fulfilled', listenerWithoutPrototype); 
        remoter.resolve(); 
      });
      //*/
      //*
      it(`this Context for prototype Function`, function (done) {
        this.timeout(5e2); 
        const listenerWithPrototype = function (...args) {
          const instance = args.reverse()[0]; 
          expect(instance).to.not.equal(remoter); 
          expect(this).to.equal(remoter); 
          done(); 
        }
        const remoter = new Remoter; 
        remoter.on('fulfilled', listenerWithPrototype); 
        remoter.resolve(); 
      });
      //*/
    });
    describe(`Instance Events`, () => {
      //*
      it (`'then', 'catch' via .then(thenCallback, catchCallback)`, function (done) {
        this.timeout(5e2); 
        const testThenListener = new µRemoter, 
              testCatchListener = new µRemoter, 
              testAllListenerForThen = new µRemoter, 
              testAllListenerForCatch = new µRemoter;  
        Promise.all([
          testThenListener, 
          testCatchListener, 
          testAllListenerForThen, 
          testAllListenerForCatch
        ]).then(
          () => done()
        )
        const testThenCallback = () => {}; 
        const testCatchCallback = () => {}; 
        let remoter = new Remoter; 
        remoter.on('then', callback => {
          expect(callback).to.equal(testThenCallback); 
          testThenListener.resolve(); 
        }); 
        remoter.on('catch', callback => {
          expect(callback).to.equal(testCatchCallback); 
          testCatchListener.resolve(); 
        }); 
        remoter.on('*', (eventName, callback) => {
          switch (eventName) {
            case 'then': 
              expect(callback).to.equal(testThenCallback);
              testAllListenerForThen.resolve(); 
              break; 
            case 'catch': 
              expect(callback).to.equal(testCatchCallback);
              testAllListenerForCatch.resolve(); 
              break; 
          }
        }); 
        remoter.then(testThenCallback, testCatchCallback);  
      }); 
      //*/
      //*
      it (`'finally' via .then(finallyCallback, finallyCallback)`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListener
        ]).then(
          () => done()
        )
        const testEventName = 'finally'; 
        const testCallback = () => {}; 
        const testValues = [
          testCallback
        ]
        let remoter = new Remoter; 
        const eventListener = function (...args) {
          expect(args).to.eql(testValues); 
          testEventListener.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          expect(eventName).to.equal(testEventName); 
          expect(args).to.eql(testValues); 
          testAllListener.resolve(); 
        }
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.then(testCallback, testCallback); 
      }); 
      //*/
      //*
      it (`'then'`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListener
        ]).then(
          () => done()
        )
        const testEventName = 'then'; 
        const testCallback = () => {}; 
        const testValues = [
          testCallback
        ]
        let remoter = new Remoter; 
        const eventListener = function (...args) {
          expect(args).to.eql(testValues); 
          testEventListener.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          expect(eventName).to.equal(testEventName); 
          expect(args).to.eql(testValues); 
          testAllListener.resolve(); 
        }
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.then(testCallback); 
      }); 
      //*/
      //*
      it (`'catch'`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListener
        ]).then(
          () => done()
        )
        const testEventName = 'catch'; 
        const testCallback = () => {}; 
        const testValues = [
          testCallback
        ]
        let remoter = new Remoter; 
        const eventListener = function (...args) {
          expect(args).to.eql(testValues); 
          testEventListener.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          expect(eventName).to.equal(testEventName); 
          expect(args).to.eql(testValues); 
          testAllListener.resolve(); 
        }
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.catch(testCallback);  
      }); 
      //*/
      //*
      it (`'finally'`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListener
        ]).then(
          () => done()
        )
        const testEventName = 'finally'; 
        const testCallback = () => {}; 
        const testValues = [
          testCallback
        ]
        let remoter = new Remoter; 
        const eventListener = function (...args) {
          expect(args).to.eql(testValues); 
          testEventListener.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          expect(eventName).to.equal(testEventName); 
          expect(args).to.eql(testValues); 
          testAllListener.resolve(); 
        }
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.finally(testCallback); 
      }); 
      //*/
      //*
      it (`'fulfilled', 'settled', 'resolved' via .fulfill`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListenerForEvent = new µRemoter, 
              testAllListenerForSettled = new µRemoter, 
              testAllListenerForResolved = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListenerForEvent, 
          testAllListenerForSettled, 
          testAllListenerForResolved
        ]).then(
          () => done()
        )
        const testEventName = 'fulfilled'; 
        const testValue = Symbol('value'); 
        const testValues = [
          testValue
        ]
        let remoter = new Remoter; 
        const eventListener = function (testStep, ...args) {
          expect(args).to.eql(testValues); 
          testStep.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          switch (eventName) {
            case testEventName: 
              eventListener.call(null, testAllListenerForEvent, ...args); 
              break; 
            case 'settled': 
              eventListener.call(null, testAllListenerForSettled, ...args); 
              break; 
            case 'resolved': 
              eventListener.call(null, testAllListenerForResolved, ...args); 
              break; 
          }
        } 
        remoter.on(testEventName, function (...args) { return eventListener(testEventListener, ...args); } ); 
        remoter.on('*', allListener); 
        remoter.fulfill(testValue);  
      }); 
      //*/
      //*
      it (`'fulfilled', 'settled', 'resolved' via .resolve`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListenerForEvent = new µRemoter, 
              testAllListenerForSettled = new µRemoter, 
              testAllListenerForResolved = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListenerForEvent, 
          testAllListenerForSettled, 
          testAllListenerForResolved
        ]).then(
          () => done()
        )
        const testEventName = 'fulfilled'; 
        const testValue = Symbol('value'); 
        const testValues = [
          testValue
        ]
        let remoter = new Remoter; 
        const eventListener = function (testStep, ...args) {
          expect(args).to.eql(testValues); 
          testStep.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          switch (eventName) {
            case testEventName: 
              eventListener.call(null, testAllListenerForEvent, ...args); 
              break; 
            case 'settled': 
              eventListener.call(null, testAllListenerForSettled, ...args); 
              break; 
            case 'resolved': 
              eventListener.call(null, testAllListenerForResolved, ...args); 
              break; 
          }
        } 
        remoter.on(testEventName, function (...args) { return eventListener(testEventListener, ...args); } ); 
        remoter.on('*', allListener); 
        remoter.resolve(testValue);  
      }); 
      //*/
      //*
      it (`'follows', 'resolved' via .fulfill`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListenerForEvent = new µRemoter, 
              testAllListenerForResolved = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListenerForEvent, 
          testAllListenerForResolved
        ]).then(
          () => done()
        )
        const testEventName = 'follows'; 
        const testValue = Remoter.resolve(Symbol('value')); 
        const testValues = [
          testValue
        ]
        let remoter = new Remoter; 
        const eventListener = function (testStep, ...args) {
          expect(args).to.eql(testValues); 
          testStep.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          switch (eventName) {
            case testEventName: 
              eventListener.call(null, testAllListenerForEvent, ...args); 
              break; 
            case 'resolved': 
              eventListener.call(null, testAllListenerForResolved, ...args); 
              break; 
            default: 
              if (eventName == 'settled') 
                expect(false, `'settled' event expected not to be emitted`).to.be.true; 
          }
        } 
        remoter.on(testEventName, function (...args) { return eventListener(testEventListener, ...args); } ); 
        remoter.on('*', allListener); 
        remoter.fulfill(testValue);  
      }); 
      //*/
      //*
      it (`'follows', 'resolved' via .resolve`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListenerForEvent = new µRemoter, 
              testAllListenerForResolved = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListenerForEvent, 
          testAllListenerForResolved
        ]).then(
          () => done()
        )
        const testEventName = 'follows'; 
        const testValue = Remoter.resolve(Symbol('value')); 
        const testValues = [
          testValue
        ]
        let remoter = new Remoter; 
        const eventListener = function (testStep, ...args) {
          expect(args).to.eql(testValues); 
          testStep.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          switch (eventName) {
            case testEventName: 
              eventListener.call(null, testAllListenerForEvent, ...args); 
              break; 
            case 'resolved': 
              eventListener.call(null, testAllListenerForResolved, ...args); 
              break; 
            default: 
              if (eventName == 'settled') 
                expect(false, `'settled' event expected not to be emitted`).to.be.true; 
          }
        } 
        remoter.on(testEventName, function (...args) { return eventListener(testEventListener, ...args); } ); 
        remoter.on('*', allListener); 
        remoter.resolve(testValue);  
      }); 
      //*/
      //*
      it (`'rejected', 'settled', 'resolved' via .reject`, function (done) {
        this.timeout(5e2); 
        const testEventListener = new µRemoter, 
              testAllListenerForEvent = new µRemoter, 
              testAllListenerForSettled = new µRemoter, 
              testAllListenerForResolved = new µRemoter; 
        Promise.all([
          testEventListener, 
          testAllListenerForEvent, 
          testAllListenerForSettled, 
          testAllListenerForResolved
        ]).then(
          () => done()
        )
        const testEventName = 'rejected'; 
        const testValue = Symbol('value'); 
        const testValues = [
          testValue
        ]
        let remoter = new Remoter; 
        const eventListener = function (testStep, ...args) {
          expect(args).to.eql(testValues); 
          testStep.resolve(); 
        }
        const allListener = function (eventName, ...args) {
          switch (eventName) {
            case testEventName: 
              eventListener.call(null, testAllListenerForEvent, ...args); 
              break; 
            case 'settled': 
              eventListener.call(null, testAllListenerForSettled, ...args); 
              break; 
            case 'resolved': 
              eventListener.call(null, testAllListenerForResolved, ...args); 
              break; 
          }
        } 
        remoter.on(testEventName, function (...args) { return eventListener(testEventListener, ...args); } ); 
        remoter.on('*', allListener); 
        remoter.catch(() => {}); 
        remoter.reject(testValue);  
      }); 
      //*/
      //*
      it (`'settled' tested explicitly through 'fulfilled', 'rejected'`, () => {
        // Purposefully left blank
      });
      //*/
      //*
      it (`'resolved' tested explicitly through 'fulfilled', 'rejected', 'follows'`, () => {
        // Purposefully left blank
      });
      //*/
      //*
      it (`'claimed'`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testFinallyDoesNotEmit = new Remoter, 
              testAllListener = new Remoter; 
        Promise.all([
          testEventEmits, 
          testFinallyDoesNotEmit, 
          testAllListener
        ]).then(
          () => done()
        ); 
        let finallyEmittedEvent = false; 
        const testEventName = 'claimed', 
              testValue = Symbol('value'), 
              thenCallback = () => {}, 
              finallyCallback = () => {}, 
              testValues = [
                testValue, 
                thenCallback
              ]; 
        const remoter = new Remoter; 
        remoter.then(thenCallback); 
        remoter.finally(finallyCallback); 
        remoter.on(
          testEventName, 
          (value, callback) => {
            if (callback === finallyCallback) {
              finallyEmittedEvent = true; 
              return; 
            }
            expect(value).to.equal(testValue); 
            expect(callback).to.equal(thenCallback); 
            testEventEmits.resolve(); 
          }
        ); 
        const allListener = function (eventName, ...args) {
          if (eventName == testEventName) {
            expect(eventName).to.equal(testEventName); 
            expect(args).to.eql(testValues); 
            testAllListener.resolve(); 
          }
        }
        remoter.on('*', allListener); 
        remoter.resolve(testValue); 
        setImmediate(
          () => {
            expect(finallyEmittedEvent).to.be.false; 
            testFinallyDoesNotEmit.resolve(); 
          }
        );
      });
      //*/
      //*
      it (`'caught'`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testFinallyDoesNotEmit = new Remoter, 
              testAllListener = new Remoter; 
        Promise.all([
          testEventEmits, 
          testFinallyDoesNotEmit, 
          testAllListener
        ]).then(
          () => done()
        ); 
        let finallyEmittedEvent = false;
        const testEventName = 'caught', 
              testError = Symbol('value'), 
              catchCallback = () => {}, 
              finallyCallback = () => {}; 
        const remoter = new Remoter; 
        remoter.catch(catchCallback); 
        remoter.finally(finallyCallback); 
        remoter.on(
          testEventName, 
          (error, callback) => {
            if (callback === finallyCallback) {
              finallyEmittedEvent = true; 
              return; 
            }
            expect(error).to.equal(testError); 
            expect(callback).to.equal(catchCallback); 
            testEventEmits.resolve(); 
          }
        ); 
        const allListener = function (eventName, error, callback) {
          if (eventName == testEventName) {
            expect(eventName).to.equal(testEventName); 
            expect(error).to.equal(testError); 
            expect(callback).to.equal(catchCallback); 
            testAllListener.resolve(); 
          } 
        }
        remoter.on('*', allListener); 
        remoter.reject(testError); 
        setImmediate(
          () => {
            expect(finallyEmittedEvent).to.be.false; 
            testFinallyDoesNotEmit.resolve(); 
          }
        );
      });
      //*/
      //*
      it (`'finalized' via .resolve`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testAllListener = new Remoter; 
        Promise.all([
          testEventEmits, 
          testAllListener
        ]).then(
          () => done()
        ); 
        const testEventName = 'finalized', 
              testValue = Symbol('value'), 
              eventCallback = () => {}; 
        const remoter = new Remoter; 
        remoter.finally(eventCallback); 
        remoter.on(
          testEventName, 
          (value, callback) => {
            expect(value).to.equal(testValue); 
            expect(callback).to.equal(eventCallback); 
            testEventEmits.resolve(); 
          }
        ); 
        const allListener = function (eventName, value, callback) {
          if (eventName == testEventName) {
            expect(eventName).to.equal(testEventName); 
            expect(value).to.equal(testValue); 
            expect(callback).to.equal(eventCallback); 
            testAllListener.resolve(); 
          }
        }
        remoter.on('*', allListener); 
        remoter.resolve(testValue); 
      });
      //*/
      //*
      it (`'finalized' via .reject`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testAllListener = new Remoter; 
        Promise.all([
          testEventEmits, 
          testAllListener
        ]).then(
          () => done()
        ); 
        const testEventName = 'finalized', 
              testError = Symbol('error'), 
              eventCallback = () => {}; 
        const remoter = new Remoter; 
        remoter.finally(eventCallback); 
        const eventListener = function (error, callback) {
          expect(error).to.equal(testError); 
          expect(callback).to.equal(eventCallback); 
          testEventEmits.resolve(); 
        }
        const allListener = function (eventName, error, callback) {
          if (eventName == testEventName) {
            expect(eventName).to.equal(testEventName); 
            expect(error).to.equal(testError); 
            expect(callback).to.equal(eventCallback); 
            testAllListener.resolve(); 
          }
        }
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.reject(testError); 
      });
      //*/
      //*
      it (`'oversaturated' via .resolve(promise)`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testDoesNotEmitUnwantedEvents = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventEmits, 
          testDoesNotEmitUnwantedEvents, 
          testAllListener
        ]).then(
          () => done()
        )
        const unwantedEvents = [
          'fulfilled', 
          'rejected', 
          'settled', 
          'follows', 
          'resolved', 
          'called', 
          'claimed', 
          'finalized'
        ]; 
        const eventsEmitted = []; 
        const testEventName = 'oversaturated', 
              testValue = new Remoter(Symbol('value')); 
        let remoter = new Remoter; 
        const eventListener = function (valuePromiseRemoterOrThenable) {
          expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
          testEventEmits.resolve(); 
        }
        const allListener = function (eventName, valuePromiseRemoterOrThenable) {
          if (eventName == testEventName) {
            expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
            testAllListener.resolve(); 
          } else {
            eventsEmitted.push(eventName); 
          }
        } 
        remoter.resolve();  
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.resolve(testValue);  
        setImmediate(
          () => {
            const unwantedEventEmitted = eventsEmitted.reduce(
              (anyEmitted, eventEmitted) => {
                const wasEmitted = unwantedEvents.includes(eventEmitted); 
                return anyEmitted || wasEmitted; 
              }, 
              false
            ); 
            expect(unwantedEventEmitted).to.be.false; 
            testDoesNotEmitUnwantedEvents.resolve(); 
          }
        ); 
      }); 
      //*/
      //*
      it (`'oversaturated' via .fulfill(value)`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testDoesNotEmitUnwantedEvents = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventEmits, 
          testDoesNotEmitUnwantedEvents, 
          testAllListener
        ]).then(
          () => done()
        )
        const unwantedEvents = [
          'fulfilled', 
          'rejected', 
          'settled', 
          'follows', 
          'resolved', 
          'called', 
          'claimed', 
          'finalized'
        ]; 
        const eventsEmitted = []; 
        const testEventName = 'oversaturated', 
              testValue = Symbol('value'); 
        let remoter = new Remoter; 
        const eventListener = function (valuePromiseRemoterOrThenable) {
          expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
          testEventEmits.resolve(); 
        }
        const allListener = function (eventName, valuePromiseRemoterOrThenable) {
          if (eventName == testEventName) {
            expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
            testAllListener.resolve(); 
          } else {
            eventsEmitted.push(eventName); 
          }
        } 
        remoter.resolve();  
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.resolve(testValue);  
        setImmediate(
          () => {
            const unwantedEventEmitted = eventsEmitted.reduce(
              (anyEmitted, eventEmitted) => {
                const wasEmitted = unwantedEvents.includes(eventEmitted); 
                return anyEmitted || wasEmitted; 
              }, 
              false
            ); 
            expect(unwantedEventEmitted).to.be.false; 
            testDoesNotEmitUnwantedEvents.resolve(); 
          }
        ); 
      }); 
      //*/
      //*
      it (`'oversaturated' via .reject(error)`, function (done) {
        this.timeout(5e2); 
        const testEventEmits = new µRemoter, 
              testDoesNotEmitUnwantedEvents = new µRemoter, 
              testAllListener = new µRemoter; 
        Promise.all([
          testEventEmits, 
          testDoesNotEmitUnwantedEvents, 
          testAllListener
        ]).then(
          () => done()
        )
        const unwantedEvents = [
          'fulfilled', 
          'rejected', 
          'settled', 
          'follows', 
          'resolved', 
          'called', 
          'claimed', 
          'finalized'
        ]; 
        const eventsEmitted = []; 
        const testEventName = 'oversaturated', 
              testError = Symbol('error'); 
        let remoter = new Remoter; 
        const eventListener = function (valuePromiseRemoterOrThenable) {
          expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
          testEventEmits.resolve(); 
        }
        const allListener = function (eventName, valuePromiseRemoterOrThenable) {
          if (eventName == testEventName) {
            expect(valuePromiseRemoterOrThenable).to.equal(valuePromiseRemoterOrThenable); 
            testAllListener.resolve(); 
          } else {
            eventsEmitted.push(eventName); 
          }
        } 
        remoter.resolve();  
        remoter.on(testEventName, eventListener); 
        remoter.on('*', allListener); 
        remoter.reject(testError);  
        setImmediate(
          () => {
            const unwantedEventEmitted = eventsEmitted.reduce(
              (anyEmitted, eventEmitted) => {
                const wasEmitted = unwantedEvents.includes(eventEmitted); 
                return anyEmitted || wasEmitted; 
              }, 
              false
            ); 
            expect(unwantedEventEmitted).to.be.false; 
            testDoesNotEmitUnwantedEvents.resolve(); 
          }
        ); 
      }); 
      //*/
      //*
      it (`'*' event explicitly tested via every other event test`, () => {
        // Purposefully left blank
      }); 
      //*/

    });
  });
  describe(`Documentation Exampes`, () => {
    /*
    //*/
  });

  /*
    - Chaining
    - Composition (is actually tested, check if ok)
    - .nativeComposition (should be called nativeChaining?!); docs also missing!





  */

});