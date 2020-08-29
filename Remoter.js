'use strict'

const CB_ERROR = Symbol('Callback Error Token'), 
      CB_ERRORS = Symbol('Callback Error Array Token'), 
      CB_RESULT = Symbol('Callback Result Token'), 
      CB_RESULTS = Symbol('Callback Result Array Token'); 


let globalEventEmitter, 
    globalBoundListeners, 
    globalInstanceArgument = true, 
    globalFinalllyArgument = true; 

class Remoter extends Promise {
  
  static resolve (valueOrThenable, ...args) {
    if (!(valueOrThenable instanceof Remoter) && valueOrThenable instanceof Remoter.Promise) 
      return new Remoter(
        (resolve, reject) => 
          valueOrThenable.then(resolve).catch(reject)
      )
    else 
      return super.resolve(...[valueOrThenable, ...args]); 
  }
  
  static on (eventName, callback) {
    // Create lifecycle tracing instances if needed 
    if (!globalEventEmitter) {
      globalEventEmitter = new EventEmitter; 
      globalBoundListeners = new WeakMap; 
    }
    // Bind this context for listeners
    const listener = callback.bind(this); 
    // Keep reference to original callback
    if (!globalBoundListeners.has(callback))
      globalBoundListeners.set(callback, []); 
    globalBoundListeners.get(callback).push(listener); 
    // Register bound callback as listener
    globalEventEmitter.on.apply(globalEventEmitter, [eventName, listener]); 
    return Remoter; 
  }
  static off (callback) {
    // Remove all .off()
    if (callback == undefined) { 
      globalEventEmitter = undefined; 
      globalBoundListeners = undefined; 
    }
    if (!globalEventEmitter) 
      return this; 
    // Remove all listeners for an eventName .off('eventName')
    if (callback == undefined) { 
      globalEventEmitter.removeAllListeners(eventName);
    // Remove a specific listener for an eventName .off('eventName', listener)
    } else {
      const boundListeners = globalBoundListeners.get(callback); 
      if (Array.isArray(boundListeners)) {
        boundListeners.forEach(
          listener => globalEventEmitter.off.call(globalEventEmitter, eventName, listener)
        )
      }  
    }
    // If no registered listeners left, destroy lifecycle tracing instances  
    const listenerCount = globalEventEmitter.eventNames().map(
      eventNameToCount => globalEventEmitter.listenerCount(eventNameToCount)
    ).reduce(
      (sum, length) => sum + length, 
      0
    );
    if (listenerCount < 1) { 
      globalEventEmitter = undefined; 
      globalBoundListeners = undefined; 
    }
    return Remoter; 
  }
  constructor (executor, _id) {
    const id = _id || Math.floor(Math.random() * 1000);
    // Lifecycle tracer instances
    let tracerEventEmitter, 
        tracerBoundListeners; 
    // Subscription handler for lifecycle events
    const subscribe = (eventName, callback, ...args) => {
      // Create lifecycle tracing instances if needed 
      if (!tracerEventEmitter) {
        tracerEventEmitter = new EventEmitter; 
        tracerBoundListeners = new WeakMap; 
      }
      // Bind this context for listeners
      const listener = callback.bind(this); 
      // Keep reference to original callback
      if (!tracerBoundListeners.has(callback))
        tracerBoundListeners.set(callback, []); 
      tracerBoundListeners.get(callback).push(listener); 
      // Register bound callback as listener
      tracerEventEmitter.on.apply(tracerEventEmitter, [eventName, listener, ...args]); 
      return this; 
    }
    // Unsubscribe handler for lifecycle events
    const unsubscribe = (eventName, callback, ...args) => {
      // Remove all .off()
      if (eventName == undefined && callback == undefined) { 
        tracerEventEmitter = undefined; 
        tracerBoundListeners = undefined; 
      }
      if (!tracerEventEmitter) 
        return this; 
      // Remove all listeners for an eventName .off('eventName')
      if (callback == undefined) { 
        tracerEventEmitter.removeAllListeners(eventName);
      // Remove a specific listener for an eventName .off('eventName', listener)
      } else {
        const boundListeners = tracerBoundListeners.get(callback); 
        if (Array.isArray(boundListeners)) {
          boundListeners.forEach(
            listener => tracerEventEmitter.off.call(tracerEventEmitter, eventName, listener, ...args)
          )
        }  
      }
      // If no registered listeners left, destroy lifecycle tracing instances  
      const listenerCount = tracerEventEmitter.eventNames().map(
        eventNameToCount => tracerEventEmitter.listenerCount(eventNameToCount)
      ).reduce(
        (sum, length) => sum + length, 
        0
      );
      if (listenerCount < 1) { 
        tracerEventEmitter = undefined; 
        tracerBoundListeners = undefined; 
      }
      return this; 
    }
    // Notification emitter for lifecycle events
    const notify = (eventName, ...args) => {
      if (tracerEventEmitter) {
        tracerEventEmitter.emit('*', eventName, id, ...args);
        return tracerEventEmitter.emit(eventName, ...args); 
      }
    }
    // Closure properies context
    let nativeResolver, 
        nativeRejector; 
    // Extract native Promise callbacks
    super(
      (resolve, reject) => {
        nativeResolver = resolve; 
        nativeRejector = reject; 
      }
    );
    // Define state slots 
    let remote = null,
        resolved = false,
        rejected = false, 
        claimed = false, 
        caught = false, 
        oversaturated = false;
    // Decorate Promise callbacks 
    const resolver = (remotely, ...args) => { 
      console.log(id, 'resolver called', remotely, resolved, rejected)
      if (!resolved && !rejected) { 
        resolved = true; 
        remote = remotely; 
        notify('resolved', ...args); 
      } else if (resolved || rejected) {
        oversaturated = true; 
        notify('oversaturated', ...args); 
      }
      return nativeResolver.apply(this, args); 
    };
    const rejector = (remotely, ...args) => { 
      if (!resolved && !rejected) { 
        rejected = true; 
        remote = remotely; 
        notify('rejected', ...args); 
      } else if (resolved || rejected) {
        notify('oversaturated', ...args); 
      }
      return nativeRejector.apply(this, args); 
    };
    // Remoter as a Promise
    let promise = undefined; 
    const getPromise = () => {
      if (promise)
        return promise
      else 
        return promise = Remoter.Promise.resolve(this); 
    }
    // Instance Settings
    let instanceArgument = null, 
        finalllyArgument = null; 
    const getInstanceArgument = () => {
      if (instanceArgument === true)
        return true
      else if (instanceArgument == null && globalInstanceArgument === true)
        return true 
      else 
        return false; 
    }
    const getFinallyArgument = () => {
      if (finalllyArgument === true)
        return true
      else if (finalllyArgument == null && globalFinallyArgument === true)
        return true 
      else 
        return false; 
    }

    // Callback sugar
    const generateCallback = function generalteCallback (...tokens) {
      // Verify Signature
      const tokenPresence = {}; 
      for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
        const token = tokens[tokenIndex]; 
        if ([CB_ERRORS, CB_RESULTS].includes(token)) {
          if (tokenIndex < tokens.length - 1)
            throw new Error(`Argument token ${token==CB_ERRORS?'CB_ERRORS':'CB_RESULTS'} is allowed only as the last argument.`); 
          else if (token == CB_ERRORS && !!tokenPresence[CB_ERROR])
            throw new Error(`Only one argument token of type CB_ERRORS or CB_ERROR is allowed.`); 
          else if (token == CB_RESULTS && !!tokenPresence[CB_RESULT])
            throw new Error(`Only one argument token of type CB_RESULTS or CB_RESULT is allowed.`); 
          tokenPresence[token] = tokenIndex; 
        } else if ([CB_ERROR, CB_RESULT].includes(token)) { 
            if (!!tokenPresence[token])
              throw new Error(`Only one argument token if ${token==CB_ERROR?'CB_ERROR':'CB_RESULT'} is allowed.`); 
            tokenPresence[token] = tokenIndex; 
        }
      }
      // Check if there is at least one argument token
      if (tokenPresence.length < 1) 
        throw new Error(`No argument token defined.`); 
      // Callback contains both an error and an result token 
      const isCompoundCallback = [CB_ERROR, CB_ERRORS].flatMap(
        errorToken => 
          [CB_RESULT, CB_RESULTS].map(
            resultToken => [errorToken, resultToken]
          )
        ).reduce(
          (isCompound, tokenCompound) => isCompound || (!!tokenPresence[tokenCompound[0]] && !!tokenPresence[tokenCompound[1]]), 
          false
        );
      // Generate Callback
      return (...args) => {
        // If error argument is truthy or signature only contains error token, e.g. onError(err)
        if (tokenPresence[CB_ERROR] && (!isCompoundCallback || !!args[tokenPresence[CB_ERROR]])) {
          rejector.call(this, args[tokenPresence[CB_ERROR]]); 
          return; 
        } 
        // If error arguments are present and at least one is truthy or 
        // signature only contains errors token, e.g. onError(err1, err2, ...)
        if (tokenPresence[CB_ERRORS]) {
          const errors = args.slice(tokenPresence[CB_ERRORS]); 
          const hasError = errors.reduce(
            (anyError, error) => anyError || !!error, 
            false
          ); 
          if (!isCompoundCallback || hasError) {
            rejector.call(this, errors); 
            return; 
          }
        }
        // Resolve if result token present and not rejected 
        if (tokenPresence[CB_RESULT]) 
          resolver.call(this, true, args[tokenPresence[CB_RESULT]]) 
        else if (tokenPresence[CB_RESULTS]) 
          resolver.call(
            this, 
            true, 
            args.slice(tokenPresence[CB_RESULTS])
          );
      }
    }
    // Default callbacks
    let errorResultCallback, 
        resultErrorCallback; 
    const getErrorResultCallback = () => {
      if (errorResultCallback)
        return errorResultCallback
      else 
        return errorResultCallback = generateCallback(CB_ERROR, CB_RESULT); 
    }
    const getResultErrorCallback = () => {
      if (resultErrorCallback)
        return resultErrorCallback
      else 
        return resultErrorCallback = generateCallback(CB_RESULT, CB_ERROR); 
    }
    // Decorate Promise.then, .catch, and .finally for 
    // - claimed, caught
    // - lifecycle tracing 
    const then = this.then; 
    const claim = (thenCallback, catchCallback) => {
      /* TODO: check finally!!!!!! */
      const isFinally = false; 
      //getFinallyArgument()
      /* TODO: check finally!!!!!! */
      // .then(callback), .finally(callback) decoration 
      const decoratedThenCallback = thenCallback instanceof Function ? 
        (...args) => {
          notify('claimed', ...args, thenCallback); 
          claimed = true; 
          if (thenCallback.prototype == undefined && getInstanceArgument())
            return thenCallback(...args, this) 
          else if (thenCallback.prototype == undefined)
            return thenCallback(...args) 
          else 
            return thenCallback.apply(this, args); 
        } : 
        undefined; 
      // .catch(callback), .then(undefined, callback), .finally(callback) decoration
      const decoratedCatchCallback = catchCallback instanceof Function ? 
        (...args) => {
          notify('caught', ...args, catchCallback); 
          caught = true; 
          if (catchCallback.prototype == undefined && getInstanceArgument())
            return catchCallback(...args, this) 
          else if (catchCallback.prototype == undefined)
            return catchCallback(...args) 
          else 
            return catchCallback.apply(this, args); 
        } : 
        undefined;
      // Lifecycle tracing for .then, .catch, or .finally callback registration
      if (thenCallback instanceof Function && thenCallback === catchCallback)
        // .finally(callback)
        notify('finally', thenCallback); 
      else {
        // .then(callback)
        if (thenCallback instanceof Function)
          notify('then', thenCallback); 
        // .catch(callback), .then(undefined, callback)
        if (catchCallback instanceof Function)
          notify('catch', catchCallback); 
      }
      return then.call(this, decoratedThenCallback, decoratedCatchCallback); 
    }
    // Define properties
    Object.defineProperties(
      this,
      {
        // Circular instance reference to enable const { remoter, resolve, reject } = new Remoter; 
        'remoter': {
          value: this, 
          writeable: false, 
          configurable: false,
          enumerable: false,
        },  
        // Promise wrapping the Remoter const { promise, resolve, reject } = new Remoter; 
        'promise': {
          get: getPromise, 
          set: () => { throw new Error(`'promise' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Remote setteling
        'resolve': {
          get: () => (value) => (resolver(true, value), this),
          set: () => { throw new Error(`Remote resolver (.resolve(value)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'reject': {
          get: () => (value) => (rejector(true, value), this),
          set: () => { throw new Error(`Remote rejector (.reject(error)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        },
        // Callback sugar
        'callback': { // Default is callback(error, result)
          get: () => this.errorResultCallback, 
          set: () => { throw new Error(`'callback' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        }, 
        'errorResultCallback': { // callback(error, result)
          get: getErrorResultCallback, 
          set: () => { throw new Error(`'errorResultCallback' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        }, 
        'resultErrorCallback': { // callback(result, error)
          get: getResultErrorCallback, 
          set: () => { throw new Error(`'resultErrorCallback' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        },
        'customCallback': { // callback(..., remoter.customCallback.CB_RESULT, ..., remoter.customCallback.CB_ERROR, ...)
          get: () => generateCallback.bind(this), 
          set: () => { throw new Error(`'customCallback' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false
        },
        // Result-independent Promise status properties 
        'pending': {
          get: () => { return !this.settled; }, 
          set: () => { throw new Error(`'pending' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'settled': {
          get: () => !!resolved || !!rejected,
          set: () => { throw new Error(`'settled' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'oversaturated': {
          get: () => !!oversaturated,
          set: () => { throw new Error(`'oversaturated' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Result-dependent Promise status properties 
        'resolved': {
          get: () => !!resolved,
          set: () => { throw new Error(`'resolved' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfilled': {
          get: () => !!resolved,
          set: () => { throw new Error(`'fulfilled' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejected': {
          get: () => !!rejected,
          set: () => { throw new Error(`'rejected' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Result-handling status properties 
        'claimed': {
          get: () => !!claimed, 
          set: () => { throw new Error(`'claimed' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'caught': {
          get: () => !!caught, 
          set: () => { throw new Error(`'caught' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        // Remote status property
        'remote': {
          get: () => remote,
          set: () => { throw new Error(`'remote' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Result and remote status sugar
        'settledRemotely': {
          get: () => this.settled && this.remote,
          set: () => { throw new Error(`'fulfilledRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'resolvedRemotely': {
          get: () => this.resolved && this.remote,
          set: () => { throw new Error(`'resolvedRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfilledRemotely': {
          get: () => this.resolvedRemotely,
          set: () => { throw new Error(`'fulfilledRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejectedRemotely': {
          get: () => this.rejected && this.remote,
          set: () => { throw new Error(`'rejectedRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Overloading of decorated properies
        'then': {
          get: () => claim, 
          set: () => { throw new Error(`'then' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'catch': {
          get: () => (catchCallback) => claim(undefined, catchCallback), 
          set: () => { throw new Error(`'catch' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'finally': {
          get: () => (finallyCallback) => claim(finallyCallback, finallyCallback), 
          set: () => { throw new Error(`'finally' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        // Lifecycle tracing methods (EventEmitter)
        'on': {
          get: () => subscribe, 
          set: () => { throw new Error(`'on' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'off': {
          get: () => unsubscribe, 
          set: () => { throw new Error(`'off' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        // Compatibility Settings
        instanceArgument: {
          get: () => instanceArgument, 
          set: value => instanceArgument = [null, undefined].includes(value) ? null : !!value, 
          configurable: false,
          enumerable: false,
        }, 
        finallyArgument: {
          get: () => finallyArgument, 
          set: value => finallyArgument = [null, undefined].includes(value) ? null : !!value, 
          configurable: false,
          enumerable: false,
        }, 
      }
    );
    // Notify tracer 
    if (globalEventEmitter) 
      globalEventEmitter.emit('create', this); 
    // Execute Executor
    if (executor instanceof Function)
      executor(
        resolver.bind(this, false),
        rejector.bind(this, false)
      );
  }
}
Object.defineProperties(
  Remoter,
  {
    // Native Promise Reference
    Promise: {
      value: Promise, 
      writeable: false, 
      configurable: false,
      enumerable: false,
    }, 
    // Custom Callback Generator Argument Tokens
    CB_ERROR: {
      value: CB_ERROR, 
      writeable: false, 
      configurable: false,
      enumerable: false,
    }, 
    CB_ERRORS: {
      value: CB_ERRORS,
      writeable: false, 
      configurable: false,
      enumerable: false,
    }, 
    CB_RESULT: {
      value: CB_RESULT,
      writeable: false, 
      configurable: false,
      enumerable: false,
    }, 
    CB_RESULTS: {
      value: CB_RESULTS,
      writeable: false, 
      configurable: false,
      enumerable: false,
    }, 
    // Global Compatibility Settings
    instanceArgument: {
      get: () => globalInstanceArgument, 
      set: value => globalInstanceArgument = !!value, 
      configurable: false,
      enumerable: false,
    }, 
    finallyArgument: {
      get: () => globalFinallyArgument, 
      set: value => globalFinallyArgument = !!value, 
      configurable: false,
      enumerable: false,
    } 
  }
); 
module.exports = Remoter;

class EventEmitter {
  constructor () {
    const listeners = {}; 
    Object.defineProperties(
      this, 
      {
        'eventNames': {
          get: () => () => Object.keys(listeners), 
          set: () => { throw new Error(`'eventNames' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
        'listenerCount': {
          get: () => (eventName) => 
            Array.isArray(listeners[eventName]) ? 
              listeners[eventName].length : 
              0, 
          set: () => { throw new Error(`'listenerCount' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
        'on': {
          get: () => 
            (eventName, callback) => {
              if (!(eventName in listeners)) {
                listeners[eventName] = [];
              }
              listeners[eventName].push(callback); 
              return this; 
            }, 
          set: () => { throw new Error(`'on' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
        'off': {
          get: () => 
            (eventName, callback) => {
              if (!(eventName in listeners)) 
                return this;
              const stack = listeners[eventName];
              for (let i = 0, l = stack.length; i < l; i++) {
                if (stack[i] === callback) {
                  stack.splice(i, 1);
                  return this;
                }
              }
              return this; 
            }, 
          set: () => { throw new Error(`'off' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
        'removeAllListeners': {
          get: () => 
            (eventName) => {
              if (!eventName)
                for (const eventName in listeners) 
                  if (listeners.hasOwnProperty(eventName)) 
                    delete listeners[eventName];
              if (listeners.hasOwnProperty(eventName))
                delete listeners[eventName];
              return this;
            }, 
          set: () => { throw new Error(`'removeAllListeners' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
        'emit': {
          get: () => 
            (eventName, ...args) => {
              if (!(eventName in listeners)) 
                return false;
              const stack = listeners[eventName];
              for (const callback of stack) 
                callback.call(this, ...args);
              return true;
            }, 
          set: () => { throw new Error(`'removeAllListeners' is not mutable on a ${this.constructor.name}.`); }, 
          configurable: false,
          enumerable: false,
        }, 
      } 
    );
  }
}