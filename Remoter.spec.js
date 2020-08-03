const { expect } = require('chai');
const sinon = require('sinon');

const Remoter = require('./Remoter');

describe(Remoter.name, () => {

  const sandbox = sinon.createSandbox();


  const resolvingExecutor = (resolve, reject) => resolve(true);
  const rejectingExecutor = (resolve, reject) => reject(false);

  afterEach(() => {
   sandbox.restore();
  });

  describe(`Behaves like a Native Promise`, () => {
    it(`Is an instance of Native Promise`, () => {
      expect(new Remoter instanceof Promise).to.be.true;
    });
    it(`Executes executor`, () => {
      let probe = false;
      const remoter = new Remoter(
        (resolve, reject) => { probe = true; }
      );
      expect(probe).to.be.true;
    });
    it(`Native signature is preserved`, () => {
      expect(Remoter.resolve).to.equal(Promise.resolve);
      expect(Remoter.reject).to.equal(Promise.reject);
      const resolvingExecutor = (resolve, reject) => resolve(true);
      const rejectingExecutor = (resolve, reject) => reject(false);
      const promise = new Promise(resolvingExecutor);
      const remoter = new Remoter(resolvingExecutor);


    });
  });

  describe(`Extrinsic Behaviour`, () => {
    it(`Resolves Extrinsicly`, () => {
      const remoter = new Remoter;
      remoter.then(
        value =>
          expect(value).to.be.true
      )
      remoter.resolve(true);
    });
    it(`Rejects Extrinsicly`, () => {
      const remoter = new Remoter;
      remoter.catch(
        error =>
          expect(error).to.be.true
      )
      remoter.reject(true);
    });
    /*
    it(`Doesn't fulfill twice`, () => {
      expect(new Remoter instanceof Promise).to.be.true;
    });
    */
  });


  describe(`Lifecycle Audit properties`, () => {
    describe(`Resolved, Fulfilled`, () => {
      it(`Extrinsically`, () => {
        const remoter = new Remoter;
        remoter.resolve(true);
        expect(remoter.resolved).to.be.true;
        expect(remoter.rejected).to.be.false;
        expect(remoter.fulfilled).to.be.true;
        expect(remoter.remote).to.be.true;
        expect(remoter.resolvedRemotely).to.be.true;
        expect(remoter.rejectedRemotely).to.be.false;
        expect(remoter.fulfilledRemotely).to.be.true;
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
            expect(remoter.fulfilled).to.be.true;
            expect(remoter.remote).to.be.false;
            expect(remoter.resolvedRemotely).to.be.false;
            expect(remoter.rejectedRemotely).to.be.false;
            expect(remoter.fulfilledRemotely).to.be.false;
          }
        );
      });
    });
    describe(`Rejected, Fulfilled`, () => {
      it(`Extrinsically`, () => {
        const remoter = new Remoter;
        remoter.catch(()=>undefined);
        remoter.reject(true);
        expect(remoter.resolved).to.be.false;
        expect(remoter.rejected).to.be.true;
        expect(remoter.fulfilled).to.be.true;
        expect(remoter.remote).to.be.true;
        expect(remoter.resolvedRemotely).to.be.false;
        expect(remoter.rejectedRemotely).to.be.true;
        expect(remoter.fulfilledRemotely).to.be.true;
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
            expect(remoter.fulfilled).to.be.true;
            expect(remoter.remote).to.be.false;
            expect(remoter.resolvedRemotely).to.be.false;
            expect(remoter.rejectedRemotely).to.be.false;
            expect(remoter.fulfilledRemotely).to.be.false;
          }
        );
      });
    });
    it(`Resolved Extrinsicly`, () => {
      const remoter = new Remoter;
      remoter.resolve(true);
      expect(remoter.remote).to.be.true;
      expect(remoter.resolved).to.be.true;
      expect(remoter.resolvedRemotely).to.be.true;
    });
    /*

    const rejectedRemoter = new Remoter;
    rejectedRemoter.reject(true).catch(()=>undefined);
    expect(rejectedRemoter.remote).to.be.true;
    expect(rejectedRemoter.fulfilled).to.be.true;


    expect(resolvedRemoter.fulfilledRemotely).to.be.true;

    expect(rejectedRemoter.fulfilledRemotely).to.be.true;


    */
  });
  describe(`Remoter specifics`, () => {
    it(`Protects read-only properties`, () => {
      const remoter = new Remoter;
      const readOnlyProperties = [
        'resolve', 
        'reject', 
        'fulfilled', 
        'resolved', 
        'rejected', 
        'remote', 
        'fulfilledRemotely', 
        'resolvedRemotely', 
        'rejectedRemotely'
      ]; 
      readOnlyProperties.forEach(
        readOnlyProperty => {
          expect(
            () => remoter[readOnlyProperty] = undefined
          ).to.throw;
        }
      )
    })
    
  });

});
