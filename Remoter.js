'use strict'

const CB_ERROR = Symbol('Callback Error Token'), 
      CB_ERRORS = Symbol('Callback Error Array Token'), 
      CB_RESULT = Symbol('Callback Result Token'), 
      CB_RESULTS = Symbol('Callback Result Array Token'); 


let globalEventEmitter, 
    globalBoundListeners, 
    globalInstanceArgument = true, 
    globalFinallyArgument = true, 
    globalNativeComposition = true; 

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
  static off (eventName, callback) {
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
    // Remove one occurance of a specific listener for an eventName .off('eventName', listener)
    } else {
      const boundListeners = globalBoundListeners.get(callback); 
      if (Array.isArray(boundListeners) && boundListeners.length > 0) {
        const listener = boundListeners.splice(0, 1)[0]; 
        globalEventEmitter.off.call(globalEventEmitter, eventName, listener); 
      } 
      if (!Array.isArray(boundListeners) || boundListeners.length < 1)
        globalBoundListeners.delete(callback);
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
  constructor (executor) {
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
      const isNonPrototypeFunction = callback.prototype == undefined; 
      const listener = (...args) => {
        return isNonPrototypeFunction ? 
          callback.call(this, ...args, this) :
          callback.call(this, ...args); 
      }
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
        if (Array.isArray(boundListeners) && boundListeners.length > 0) {
          const listener = boundListeners.splice(0, 1)[0]; 
          tracerEventEmitter.off.call(tracerEventEmitter, eventName, listener); 
        } 
        if (!Array.isArray(boundListeners) || boundListeners.length < 1)
          tracerBoundListeners.delete(callback);
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
        tracerEventEmitter.emit('*', eventName, ...args);
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
        fulfilled = false,
        rejected = false, 
        oversaturated = false; 
    // Define fate slots
    let follows = false, 
        claimed = false, 
        caught = false, 
        finalized = false;
    // Promise callback Decorator 
    const isPromiseOrThenable = (promiseOrThenable) => 
      promiseOrThenable && (
        promiseOrThenable instanceof Remoter.Promise || 
        !!promiseOrThenable.then
      );
    const decorateResolverCalback = (
      nativeCallback, propertySetter, notificationToken, 
      remotely, value
    ) => { 
      if (!fulfilled && !rejected && !follows) { 
        remote = remotely; 
        if (isPromiseOrThenable(value)) {
          follows = true; 
          notify('follows', value); 
        } else {
          propertySetter(); 
          notify('settled', value); 
          notify(notificationToken, value); 
        }
        notify('resolved', value); 
      } else {
        oversaturated = true; 
        notify('oversaturated', value); 
      }
      return nativeCallback.call(this, value); 
    };
    // Decorate Promise callbacks 
    const resolver = decorateResolverCalback.bind(
            this, 
            nativeResolver, 
            () => fulfilled = true, 
            'fulfilled'
          ), 
          intrinsicResolver = resolver.bind(this, false), 
          extrinsicResolver = resolver.bind(this, true); 
    const rejector = decorateResolverCalback.bind(
            this, 
            nativeRejector, 
            () => rejected = true, 
            'rejected'
          ), 
          intrinsicRejecotr = rejector.bind(this, false),  
          extrinsicRejector = rejector.bind(this, true); 
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
        finallyArgument = null, 
        nativeComposition = null; 
    const getInstanceArgument = () => {
      if (instanceArgument === true)
        return true
      else if (instanceArgument == null && globalInstanceArgument === true)
        return true 
      else 
        return false; 
    }
    const getFinallyArgument = () => {
      if (finallyArgument === true)
        return true
      else if (finallyArgument == null && globalFinallyArgument === true)
        return true 
      else 
        return false; 
    }
    const getNativeComposition = () => {
      if (nativeComposition === true)
        return true
      else if (nativeComposition == null && globalNativeComposition === true)
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
          else if (token == CB_ERRORS && tokenPresence[CB_ERROR] != undefined)
            throw new Error(`Only one argument token of type CB_ERRORS or CB_ERROR is allowed.`); 
          else if (token == CB_RESULTS && tokenPresence[CB_RESULT] != undefined)
            throw new Error(`Only one argument token of type CB_RESULTS or CB_RESULT is allowed.`); 
          tokenPresence[token] = tokenIndex; 
        } else if ([CB_ERROR, CB_RESULT].includes(token)) { 
            if (tokenPresence[token] != undefined)
              throw new Error(`Only one argument token of type ${token==CB_ERROR?'CB_ERROR':'CB_RESULT'} is allowed.`); 
            tokenPresence[token] = tokenIndex; 
        }
      }
      // Check if there is at least one argument token
      if (Object.getOwnPropertySymbols(tokenPresence).length < 1) 
        throw new Error(`No argument token defined.`); 
      // Callback contains both an error and an result token 
      const tokenKeys = Object.getOwnPropertySymbols(tokenPresence); 
      const hasErrorToken = tokenKeys.reduce(
        (includes, token) => includes || [CB_ERROR, CB_ERRORS].includes(token), 
        false
      ); 
      const hasResultToken = tokenKeys.reduce(
        (includes, token) => includes || [CB_RESULT, CB_RESULTS].includes(token), 
        false
      ); 
      const isCompoundCallback = hasErrorToken && hasResultToken; 
      // Generate Callback
      return (...args) => {
        // If error argument is truthy or signature only contains error token, e.g. onError(err)
        if (tokenPresence[CB_ERROR] != undefined && (!isCompoundCallback || !!args[tokenPresence[CB_ERROR]])) {
          extrinsicRejector.call(this, args[tokenPresence[CB_ERROR]]); 
          return; 
        } 
        // If error arguments are present and at least one is truthy or 
        // signature only contains errors token, e.g. onError(err1, err2, ...)
        if (tokenPresence[CB_ERRORS] != undefined) {
          const errors = args.slice(tokenPresence[CB_ERRORS]); 
          const hasError = errors.reduce(
            (anyError, error) => anyError || !!error, 
            false
          ); 
          if (!isCompoundCallback || hasError) {
            extrinsicRejector.call(this, errors); 
            return; 
          }
        } 
        // Resolve if result token present and not rejected 
        if (tokenPresence[CB_RESULT] != undefined) 
          extrinsicResolver.call(this, args[tokenPresence[CB_RESULT]]) 
        else if (tokenPresence[CB_RESULTS] != undefined) 
          extrinsicResolver.call(
            this, 
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
    // - claimed, caught, finalized
    // - lifecycle tracing 
    const then = this.then; 

    const decorateCallback = (callback, propertySetter, notificationToken, isFinallyCallback) => 
      (...args) => {
        let callbackArgs; 
        if (!isFinallyCallback || getFinallyArgument())
          callbackArgs = [...args]; 
        if (callback.prototype == undefined && getInstanceArgument())
          callbackArgs.push(this); 
        propertySetter(); 
        notify(notificationToken, ...args, callback); 
        return callback.apply(this, callbackArgs); 
      }

    const claim = (thenCallback, catchCallback) => {
      const isFinally = thenCallback instanceof Function && thenCallback === catchCallback; 
      let decoratedThenCallback, 
          decoratedCatchCallback; 
      if (isFinally) {
        decoratedThenCallback = decoratedCatchCallback = decorateCallback(
          thenCallback, 
          () => finalized = true, 
          'finalized', 
          isFinally
        ); 
        notify('finally', thenCallback); 
      } else {
        if (thenCallback instanceof Function) { 
          decoratedThenCallback = decorateCallback(
            thenCallback, 
            () => claimed = true, 
            'claimed', 
            isFinally
          ); 
          notify('then', thenCallback);
        }
        if (catchCallback instanceof Function) { 
          decoratedCatchCallback = decorateCallback(
            catchCallback, 
            () => caught = true, 
            'caught', 
            isFinally
          ); 
          notify('catch', catchCallback);
        }
      }
      /* TODO: Check Chaining with Native Promises */
      const chain = then.call(this, decoratedThenCallback, decoratedCatchCallback); 
      if (getNativeComposition()) {
        //return Remoter.resolve(promise); 
        //const newInstance = new Remoter; 
        //promise.then(resolve, reject); 
        //console.log(newInstance)
        //chain.then(newInstance.resolve.bind(newInstance), newInstance.reject.bind(newInstance)); 
        //return Promise.resolve(chain);
        //console.log(chain)
        return Remoter.resolve(chain); 
      } else { 
        return this; 
      }
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
          get: () => (value) => (extrinsicResolver(value), this),
          set: () => { throw new Error(`Remote resolver (.resolve(value)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfill': {
          get: () => this.resolve,
          set: () => { throw new Error(`Remote fulfiller (.fulfill(value)) is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'reject': {
          get: () => (value) => (extrinsicRejector(value), this),
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
          get: () => !fulfilled && !rejected, 
          set: () => { throw new Error(`'pending' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'settled': {
          get: () => !this.pending,
          set: () => { throw new Error(`'settled' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'oversaturated': {
          get: () => oversaturated,
          set: () => { throw new Error(`'oversaturated' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Result-dependent Promise status properties 
        'resolved': {
          get: () => fulfilled || rejected || follows,
          set: () => { throw new Error(`'resolved' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfilled': {
          get: () => fulfilled,
          set: () => { throw new Error(`'fulfilled' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejected': {
          get: () => rejected,
          set: () => { throw new Error(`'rejected' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        // Result-handling status properties 
        'claimed': {
          get: () => claimed, 
          set: () => { throw new Error(`'claimed' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'caught': {
          get: () => caught, 
          set: () => { throw new Error(`'caught' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        }, 
        'finalized': {
          get: () => !!finalized, 
          set: () => { throw new Error(`'finalized' is not mutable on a ${this.constructor.name}.`); },
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
          get: () => this.settled && remote == true,
          set: () => { throw new Error(`'fulfilledRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'resolvedRemotely': {
          get: () => this.resolved && remote == true,
          set: () => { throw new Error(`'resolvedRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'fulfilledRemotely': {
          get: () => fulfilled && remote == true,
          set: () => { throw new Error(`'fulfilledRemotely' is not mutable on a ${this.constructor.name}.`); },
          configurable: false,
          enumerable: false,
        },
        'rejectedRemotely': {
          get: () => rejected && remote  == true,
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
        'instanceArgument': {
          get: () => instanceArgument, 
          set: value => instanceArgument = [null, undefined].includes(value) ? null : !!value, 
          configurable: false,
          enumerable: false,
        }, 
        'finallyArgument': {
          get: () => finallyArgument, 
          set: value => finallyArgument = [null, undefined].includes(value) ? null : !!value, 
          configurable: false,
          enumerable: false,
        }, 
        'nativeComposition': {
          get: () => nativeComposition, 
          set: value => nativeComposition = [null, undefined].includes(value) ? null : !!value, 
          configurable: false,
          enumerable: false,
        }, 
      }
    );
    // Notify tracer 
    const notifyRemoter = () => {
      globalEventEmitter.emit('*', 'create', this); 
      return globalEventEmitter.emit('create', this); 
    }
    if (globalEventEmitter) 
      setImmediate(notifyRemoter); 
    // Execute Executor
    if (executor instanceof Function)
      executor(
        intrinsicResolver,
        intrinsicRejecotr
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
    }, 
    nativeComposition: {
      get: () => globalNativeComposition, 
      set: value => globalNativeComposition = !!value, 
      configurable: false,
      enumerable: false,
    }, 
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