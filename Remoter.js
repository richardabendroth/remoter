class Remoter extends Promise {
  constructor (executor) {
    let resolver,
        rejector,
        remote = false,
        resolved = false,
        rejected = false;
    super(
      (resolve, reject) => {
        resolver = (...args) => { if (!resolved && !rejected) { resolved = true, remote = true } return resolve(...args); };
        rejector = (...args) => { if (!resolved && !rejected) { rejected = true, remote = true } return reject(...args); };
        executor &&
          executor.constructor &&
          executor.call &&
          executor.apply &&
        executor(
          (...args) => { if (!resolved && !rejected) { resolved = true, remote = false } return resolve(...args); },
          (...args) => { if (!resolved && !rejected) { rejected = true, remote = false } return reject(...args); }
        );
      }
    );
    Object.defineProperties(
      this,
      {
        'resolve': {
          get: () => (value) => (resolver(value), this),
          set: () => { throw new Error(`Remote resolver (.resolve(value)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'reject': {
          get: () => (value) => (rejector(value), this),
          set: () => { throw new Error(`Remote rejector (.reject(error)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        },
        'fulfilled': {
          get: () => resolved || rejected,
          set: () => { throw new Error(`fulfilled is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'resolved': {
          get: () => resolved,
          set: () => { throw new Error(`resolved is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejected': {
          get: () => rejected,
          set: () => { throw new Error(`rejected is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'remote': {
          get: () => remote,
          set: () => { throw new Error(`remote is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfilledRemotely': {
          get: () => (resolved || rejected) && remote,
          set: () => { throw new Error(`fulfilledRemotely is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'resolvedRemotely': {
          get: () => resolved && remote,
          set: () => { throw new Error(`resolvedRemotely is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejectedRemotely': {
          get: () => rejected && remote,
          set: () => { throw new Error(`rejectedRemotely is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
      }
    );
  }
}
module.exports = Remoter;
