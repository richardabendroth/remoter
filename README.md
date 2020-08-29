# Remoter
Remoter is a remotely resolveable native Javascript Promise that exposes it's resolver and rejector callbacks. It is supposed to help you to keep a somewhat consistent code style when using `asyc`/`await` syntax with functions that have a callback API. It also helps you in debugging Promises and can act as a plug-in replacement for the native Promise. Additionally, it quite lightweight and has zero dependencies. 

# In a nutshell

```javascript
// Write this: 
function writeFileAsync (fileName, data, options) {
  const { promise, callback } = new Remoter; 
  fs.writeFile(fileName, data, options, callback); 
  return promise; 
}
```
```javascript
// Instead of this: 
function writeFileAsync (fileName, data, options) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        fileName, 
        data, 
        options, 
        (error, result) => {
          if (error) {
            reject(error); 
          } else {
            resolve(result); 
          }
        }
      );
    }
  ); 
}
```

# It's a Promise 
Remoter is not only a then-able, it's an extension of the native Promise. 

# Where is it useful?
* When you need to promisify a [callback-based API like `fs`](#promisify-callback-based-apis), anything with a [callback with error and result arguments](#promise), [the other way around](#resulterrorcallback), [two callbacks (e.g. onError, onSuccess)](#remoter-1), or [something odd](#customCallbackargumentToken-argumentToken2--argumentToken2N)
* When you want to use [`await` to wait for events e.g. `EventEmitter.on(...)`](#Awaiting-Events) or [`await sleep(...)`](#for-sugar)
* When implementing an [abortable/cancelable `Promise`](#Cancelling-request-promises)
* When your code looks like [a funny mix of `await`, `new Promise`, and `() => 'Arrow Functions'`](#Remotely-resolving-a-Promise) or [looks like a callback hell](#Avoid-async-callback-hells)
* When you generally want to reshape control flow
* When you want a piece of asynchronous code [to wait for an external event to happen](#Awaiting-Events)
* When the promise receiving the data is [not directly correlated with the `Promise` returning the value](#Limiting-concurrent-requests)
* When you woder if the cat is dead or alive but [you don't want to open the box](#Lifecycle-Tracing-A-glimpse-into-Schroedingers-Box)
* When one of your Promises does not have the value it should have or [you suspect it to be settled more than once](#Find-multi-settling-bugs)
* Other stuff that is totally up to your creativity! (Please let me know 🙏) LINK TO ISSUES

# Installation 

```
npm install remoter
```

# Usage

## Quick Start 

### Node (require) 
```javascript
const Remoter = require('remoter'); 
const remoter = new Remoter;
remoter.then(
  (value) => console.log(value)
); 
remoter.resolve('The answer is 42'); 
```
or if you want to be really cool: 
```javascript
const Remoter = require('remoter'); 
const {remoter, resolve, reject} = new Remoter; 
remoter.then(
  value => console.log(value)
).catch(
  error => console.log(error)
); 
resolve('The answer is 42'); 
```

### Web (import)
```javascript
import Remoter from 'remoter'; 
const remoter = new Remoter;
remoter.then(
  (value) => console.log(value)
); 
remoter.resolve('The answer is 42'); 
```

## Plug-in replacement 
Besides being used instead of the native Promise, Remoter can be used as a plug-in replacement for the native Promise to allow for debugging and lifecycle monitoring: 
```javascript
// Don't do this in Production!

const Remoter = require('remoter'); 
const NativePromise = Promise; 
let id = 0; 
Remoter.on(
  'create', 
  remoter => {
    const instanceId = ++id; 
    console.log(`${instanceId}: Remoter created`); 
    remoter.on(
      '*', 
      (...args) => 
        console.log(`${instanceId}:`, ...args) 
    )
  }
)
// You might want to disable Remoter.instanceArgument if your claiming callbacks
// in .then, .catch and .finally accept more than one argument 🙈
Remoter.instanceArgument = false; 
// You also might want to disable .finallyArgument if your claiming .finally 
// callbacks accept arguments 🙉
Remoter.finalllyArgument = false; 

Promise = Remoter; 

//...

const promise = new Promise(
  (resolve, reject) => {
    //...
    resolve(true); // <someId>: resolved true
    resolve('uh oh 😯'); // <someId>: oversaturated uh oh 😯
  }
); // <someId>: Remoter created
```
The necesarry singletons, properties, EventEmitters, and WeakMaps are created the moment you call the `.on` hook the first time. They are destroyed as soon as you `.off` all events. This is true for the introspection events on the Remoter class and the introspection events on the respective remoter instance individually. Each remoter instance holds its own introspection instances, meaning you can introspect a single Promise without bloating the others. This also means you don't need to use the class event hook if you are only looking at a specific Promise. 

The native Promise class is available via [`Remoter.Promise`](#Native-Promise-Class-Property).

Please don't use this functionality to make Promises that can be fulfilled more than once. 

Why? 
- Promises are meant to be settled only once. You will buy into more problems than you wanted to overcome. Promised. Use an EventEmitter instead: `const EventEmitter = require('events');`. 
- It won't work as sleak as you expect as you would need to use the `.on` hook and a `.catch` callback instead of the `.then`, `.catch`, or alternatively `.finally` callbacks and end up with an EventEmitter again. If you want to `await` events, there is an example [here](#Awaiting-Events) that shows you how to do that. 
- The introspection API of Remoter uses additional resources, including lightweight EventEmitters (that add to your event loop) and WeakMaps (that use your heap). 

## API 
Other than the Remoter-specific API mentioned here, the API is meant to be **identical to the native Promise API**. 

### Create a new instance 
**In addition** to the native Promise constructor
```javascript
const remoter = new Remoter(
  (resolve, reject) => {
    ...
  }
); 
```
the Remoter can be instanciated without an executor: 
```javascript
const remoter = new Remoter; 
```

### Settling (resolving and rejecting) the Remoter instance from the outsite 

#### .resolve([value])
Resolves the remoter instance with the given *value*. Returns the remoter instance. 
```javascript
const remoter = new Remoter; 
remoter.then(console.log); // Will output: 42 Remoter [Promise] { 42 }
remoter.resolve(42); 
```

#### .reject([error])
Rejects the remoter instance with the given *error*. Returns the remoter instance. 
```javascript
const remoter = new Remoter; 
remoter.catch(console.log); // Will output: Question not found. Remoter [Promise] { <rejected> 'Question not found.' }
remoter.reject('Question not found.'); 
```

### Interoperability with the native Promise 
Remoters and Promises are meant to be exchangeable when used with other API's and with each other. 

#### Exchangeable 
In general, as Remoter is derived from Promise, it can be handed to API's that expect a native Promise or any other known then-able implementation. However, in some cases where the receiving codes uses a constructor indentity check instead of traversing the instance tree, the remoter instance cannot be used directly (as any other .thenable or Promise derivative also can't be used). 

||Detection Method|Remark|
|-|-|-|
|✔|`promise instanceof Promise`||
|✔|`promise.then != undefined` or `promise.then instanceof Function`||
|(✔)|`Object.prototype.toString.call(promise) == '[object Promise]'`|**This might change in the future!** |
|❌|`promise.constructor === Promise` or similar|Hand over [`remoter.promise`](#promise) or [`Promise.resolve(remoter)`](#Chaining) instead|

Remoter can also be used in places where a library that generates promises has a configuration slot for the promise implementation that it uses to generate the promises it returns. 

#### Chaining 
For chaining, Remoters are meant to be fully compatible to Promises and vice versa: 

|Chain call|Result||
|----------|------|-|
|`Remoter.resolve(promise)`|new Remoter|The remoter instance is resolved when the promise resolves. Keep in mind that when settling the remoter instance from the outsite using [`.resolve([value])`](#resolvevalue) or [`.reject([error])`](#rejecterror) the promise will [**oversaturate**](#oversaturated) immediately when one the of the [`(resolve, reject)`](#Constructor-new-Remoterexecutor) callbacks has been called before or will [**oversaturate**](#oversaturated) in the moment when one of those callbacks is invoked after outside settling via [`.resolve([value])`](#resolvevalue) or [`.reject([error])`](#rejecterror).|
|`Remoter.resolve(remoter)`|new Remoter|The inner remoter instance can settle from its executor calling one of the [`(resolve, reject)`](#Constructor-new-Remoterexecutor) callbacks and from the outside using [`.resolve([value])`](#resolvevalue) or [`.reject([error])`](#rejecterror). The newly created remoter instance will settle in chain with the inner remoter or from the outside using [`.resolve([value])`](#resolvevalue) or [`.reject([error])`](#rejecterror). The [`.remote`](#remote) settling property of the outer remoter instance is **tied to the inner remoter's remote settling property**.|
|`Remoter.resolve(thenable)`|new Remoter|See above `Remoter.resolve(promise)`.|
|`Promise.resolve(remoter)`|new Promise|As the outer Promise has no executor the settling of the outer Promise is completely dependent on the inner remoter instance which can be settled either through its executor's [`(resolve, reject)`](#Constructor-new-Remoterexecutor) callbacks or its [`.resolve([value])`](#resolvevalue) or [`.reject([error])`](#rejecterror) methods. To obtain a persistent promise instance from the remoter use the [`.promise`](#promise) property of the remoter instance instead.|

### Remoter lifecycle properties  
#### Result-independent Promise status properties
##### .pending
Read-only property indicating if the Promise is pending, meaning it has not been resolved or rejected yet. It is ``true`` if both, [.resolved](#resolved) is ``false`` and [.rejected](#rejected) is ``false``. Otherwise it is ``true``. 
##### .settled
Read-only property indicating if the Promise is settled, meaning it has either been resolved or rejected. It is ``true`` if [.resolved](#resolved) is ``true`` or [.rejected](#rejected) is ``true``, otherwise it is ``false``. 
##### .oversaturated
Read-only property indicating if there was an attempt to settle the promise more than once. While it is possible to call a reject or resolve callback of a Promise multiple times, the respective settling callbacks get only called once. This property allows for introspection if that happend: 
```javascript
const Remoter = require('remoter'); 

function oversaturationLog () {
  if (this.oversaturated)
    console.log(`I feel fulfilled 😊`); 
  else 
    console.log(`I got too much 🤢`); 
}

const remoter = new Remoter(
  (resolve, reject) => {
    setTimeout(
      reject, 
      1e3, 
      new Error('The cat is a dog ideed')
    ); 
    resolve(); 
  }
  remoter.finally(oversaturationLog); // I feel fulfilled 😊
  setTimeout(
    oversaturationLog.bind(remoter), // I got too much 🤢
    1.5e3
  )
);
```
If you suspect one of your Promises to be settled more than once, there is an [lifecycle event](#Find-multi-settling-bugs) that helps you in finding out. 

#### Result-dependent Promise status properties 
Remoter offers read-only properties to expose its state to code outside the executor and settling callbacks. Those are set right before the settling callbacks attached via [.then](#then), [.catch](#catch), and [.finally](#finally) are invoked. 

##### .resolved
Read-only property that is `false` while the Promise is pending. Returns `true` from the moment **right before the user-defined resolver is executed**.

##### .fulfilled
Read-only. Alias for [.resolved](#resolved). 

##### .rejected
Read-only property that is `false` while the Promise is pending. Returns `true` from the moment **right before the user-defined rejector is executed**.

#### Remote settling state

##### .remote
Read-only property that is `true` if the remoter instance has been settled outside of its executor using [.resolve([value])](#resolvevalue) or [rejecte([error])](#rejecterror), otherwise `false`. While pending, the property is `null`; 

```javascript
const Remoter = require('remoter'); 
const resolvedFromOutside = new Remoter; 
resolvedFromOutside.resolve(); 
resolvedFromOutside.then(
  function () {
    console.log(this.remote); // Will output: true
  }
);
```
```javascript
const Remoter = require('remoter'); 
const resolvedInExecutor = new Remoter(
  resolve => resolve()
)
resolvedInExecutor.then(
  function () {
    console.log(this.remote); // Will output: false
  }
);
```
```javascript
const Remoter = require('remoter'); 
const resolvedRightAway = new Remoter.resolve(); 
resolvedRightAway.then(
  function () {
    console.log(this.remote); // Will output: false
  }
);
```

#### Result and remote status sugar
For your convenience Remoter provides read-only sugar properties to detect all combinations of settling status and remote status of a remoter instance. 

##### .settledRemotely
Read-only property that is `true` when the Remoter has been settled using [.resolve([value])](#resolvevalue) or [rejecte([error])](#rejecterror), otherwise `false`. It will always be `true` when `.remote` is `true`. 

##### .resolvedRemotely
Read-only property that is `true` when the Remoter has been resolved using [.resolve([value])](#resolvevalue), otherwise `false`. It is sugar for `remoter.remote && remoter.resolved`. 

##### .fulfilledRemotely
Alias for [.resolvedRemotely](#resolvedremotely). 

##### .rejectedRemotely
Read-only property that is `true` when the Remoter has been rejected using [.reject([error])](#rejectederror), otherwise `false`. It is sugar for `remoter.remote && remoter.rejected`. 

#### Result-handling status properties
Remoter offers status properties to determine if the value or error of a settled Promise has already been delivered to a callback registered via [.then](#thenthencallback-catchcallback), [.catch](#catchcatchcallback), or [.finally](#finallyfinallycallback) at least once. See also [lifecycle events](#oneventName-callback). 

##### .claimed
Read-only property that is `true` when the Promise has been resolved and its value has already been delivered to a callback registered via [.then](#thenthencallback-catchcallback) or [.finally](#finallyfinallycallback), otherwise `false`. See also [lifecycle events](#oneventName-callback). 

##### .caught
Read-only property that is `true` when the Promise has been rejected and its error has already been delivered to a callback registered via [.catch](#catchcatchcallback) or [.finally](#finallyfinallycallback), otherwise `false`. See also [lifecycle events](#oneventName-callback). 

### Claim settled Remoter results
Claiming the settled results of the Remoter works exactly like claiming settled results from a Promise. However, there is one slight difference for your convenience. For **named fuctions** and **anonymous functions** (functions that can have their own `this` context), the `this` context is the remoter instance: 
```javascript
const remoter = new Remoter; 

remoter.then(
  function (value) {
    console.log(`Remoter resolved ${this.remote?'remotely ':''}with value`, value); 
    // Will output: Remoter resolved remotely with value 42
  }
); 

remoter.resolve(42);
```

To circumvent this behavior you can use a **bound function** with a custom `this` context or use an **arrow function**. Those callbacks are invoked with an additonal argument containing a reference to the remoter instance: 
```javascript
const remoter = new Remoter; 

remoter.then(
  (value, remoterInstance) => {
    console.log(`Remoter resolved ${remoterInstace.remote?'remotely ':''}with value`, value); 
    // Will output: Remoter resolved remotely with value 42
  }
); 

const thenCallback = function (value, remoterInstance) {
  console.log(`Remoter resolved ${remoterInstace.remote?'remotely ':''}with value`, value); 
  // Will output: Remoter resolved remotely with value 42
}

remoter.then(
  thenCallback.bind(this)
); 

remoter.resolve(42);
```

Remoter uses the **prototype attribute** of the callback to determine which behavior to employ. If the prototype is `undefined`, the 2nd argument option is employed instead of a bound `this` context pointing to the remoter instance. Keep in mind that some loggers and console.log are bound functions and native functions might lack a prototype property. In those cases, Remoter will pass the remoter instance alongside the value as an additional (in this exampe second) argument to the callback. To overcome this behavior you can wrap the function into an **anonymous function**, e.g. `remoter.then(function (targetLength) { return 'silly'.pad(targetLength) });` or turn off this behavior using the [`.instanceArgument`](#instanceArgument) setting. 

#### .then(thenCallback[, catchCallback]) 

Identical to the native Promise `.then` method. When lifecycle introspection callbacks are attached to the remoter instance additionally emits `then` event with *thenCallback* as payload argument. If *catchCallback* is given, also emits `catch` event with *catchCallback* as payload argument. Except, when *thenCallback* and *catchCallback* are identical, emits `finally` event with *thenCallback* as payload argument. 

If possible, Remoter automatically sets the `this` context of the callback to the **remoter instance**. See [Claim settled Remoter results](#Claim-settled-Remoter-results) and [`.instanceArgument`](#instanceArgument) for more information. 

#### .catch(catchCallback) 

Identical to the native Promise `.catch` method. When lifecycle introspection callbacks are attached to the remoter instance additionally emits `catch` event with *catchCallback* as payload argument. 

If possible, Remoter automatically sets the `this` context of the callback to the **remoter instance**. See [Claim settled Remoter results](#Claim-settled-Remoter-results) and [`.instanceArgument`](#instanceArgument) for more information. 

#### .finally(finallyCallback)

Identical to the native Promise `.finally` method. When lifecycle introspection callbacks are attached to the remoter instance additionally emits `finally` event with *finallyCallback* as payload argument. 

If possible, Remoter automatically sets the `this` context of the callback to the **remoter instance**. See [Claim settled Remoter results](#Claim-settled-Remoter-results) and [`.instanceArgument`](#instanceArgument) for more information. 

In contrast to the native Promise, callbacks registered using `.finally` are passed an *errorOrValue* argument. This functionality can be turned off for the remoter instance either by wrapping the callback in a function, e.g. `remoter.finally(onlyOneArgument => yourCallback(onlyOneArgument))`, by setting the [`.finallyArgument`](#finallyArgument) property to *false* or by setting the [`Remoter.finallyArgument`](#RemoterfinallyArgument) global setting to *false*. 

#### .finallyArgument
`.finallyArgument` is a boolean property, that when set to *false* prevents passing of an errorOrValue argument to callbacks registered via `.finally`. When set to *true*, enables the this behavior. This setting overrides the corresponding [`Remoter.finallyArgument`](#RemoterfinallyArgument) setting. When set to *null*, the global setting is used. 

Default is *null* (uses global setting from [`Remoter.finallyArgument`](#RemoterfinallyArgument)). 

#### .instanceArgument
`.instanceArgument` is a boolean property, that when set to *false* disables the addition of the instance reference to the arguments list when the `.then`, `.catch` and `.finally` callbacks are invoked for those registered callbacks that do not have a prototype (*ArrowFunctions* and *Bound Functions*). When set to *true*, enables the this behavior. This setting overrides the corresponding [`Remoter.instanceArgument`](#RemoterinstanceArgument) setting. When set to *null*, the global setting is used. 

Default is *null* (uses global setting from [`Remoter.instanceArgument`](#RemoterinstanceArgument)). 

### Instantiation shortcuts 
To instanciate either a Remoter and it's resolver and rejector or a Promise with a callback, or any combination of those, a remoter instance provides the `.remoter` and `.promise` properties. 

#### .remoter
The `.remoter` property is a circular reference to the remoter instance. 
```javascript
const {remoter, resolve, reject} = new Remoter; 
```

Example: 
```javascript
const Remoter = require('remoter');

function echoFunctionWithOddCallbackAPI(data, onSuccess, onError) {
  if (!data) 
    onError(
      new Error(`No data to echo 😢`)
    ); 
  else
    onSuccess(data); 
}

function asyncEchoFunction(data) {
  const {remoter, resolve, reject} = new Remoter; 
  echoFunctionWithOddCallbackAPI(data, resolve, reject); 
  return remoter; 
}

asyncEchoFunction(
  'stuff'
).then(
  value => 
    console.log(value) // Will output: stuff
)
```

#### .promise 
The `.promise` property returns a persistent reference to a native Promise using [`Promise.resolve(remoter)`](#Chaining) that settles with the remoter instance. 
```javascript
const {promise, callback} = new Remoter; 
```

Example: 
```javascript
const fs = require('fs'); 
const Remoter = require('remoter');

const {promise, callback} = new Remoter; 

promise.then(
  value => 
    console.log(value) // If you happen to have such a file. Will output: stuff
).catch(
  error => 
    console.error(error) // Otherwise, will output an OS-specific error 
);

fs.readFile('message.txt', callback); 
```
The `.promise` property creates a promise the first time the property is accessed and returns the same instance for subsequent property access: 
```javascript
const Remoter = require('remoter'); 
const remoter = new Remoter; 
console.log(remoter.promise === remoter.promise); // Will outout: true 
``` 

### Callback generation 
For ease of use with callback-based API's a remoter instance offers a callback factory to create plug-in callbacks that can be used to resolve or reject the remoter instance respectively. If the *error* property in a callback is truthy, the Remoter will reject the Promise with *error* as value. Otherwise it will resolve the Promise with *result* as value.

While `.callback`, `.errorResultCallback` and `.resultErrorCallback` always return the same function reference, `.customCallback()` creates a new callback every time it is called. 
```javascript
const Remoter = require('remoter'); 

const remoter = new Remoter; 

console.log(remoter.callback === remoter.callback); // Will output: true
console.log(remoter.customCallback(Remoter.CB_RESULT) === remoter.customCallback(Remoter.CB_RESULT)); // Will output: false
```

#### .callback
Returns a callback for promisification. See [.promise](#promise) for an example. Alias for *.errorResultCallback*. 

#### .errorResultCallback
Returns a callback with the signature `callback(error, result)`. See [.promise](#promise) for an example. The callback is created the first time the method property is accessed and maintains its reference! 

#### .resultErrorCallback
Returns a callback with the signature `callback(result, error)`. The callback is created the first time the method property is accessed and maintains its reference! 

#### .customCallback(argumentToken[, argumentToken2, ..., argumentToken2N])
Generates a new callback function with a custom signature based on the *argumentTokens* passed. 

`.callback` and `.errorResultCallback` are equivalent to the callback created using `.customCallback(Remmoter.CB_ERROR, Remoter.CB_RESULT)`. `.resultErrorCallback` is equivalent to the callback created using `.customCallback(Remoter.CB_RESULT, Remmoter.CB_ERROR)`.

Each token is only allowed once per callback. The rest tokens `CB_ERRORS` and `CB_RESULTS` are only allowed at the end of the signature. A signature can only contain either one `CB_RESULT` token or one `CB_RESULTS` rest token and only either one `CB_ERROR` token or one `CB_ERRORS` rest token. It is possible to create as many callbacks per remoter instance as needed. 

If either a `CB_RESULT` token or a `CB_RESULTS` rest token and either a `CB_RESULT` token or a `CB_RESULTS` rest token are present in the same callback signature, the remoter instance is rejected when the **error value** in the argument at the positition of the **error token** is **truthy**, even if the argument at the position of a result token also contains a truthy result value. 
```javascript
const Remoter = require('remoter'); 
const {promise, callback} = new Remoter; 
callback('errors always win! 😈', 'results are ignored 😢'); 
promise.then(console.log).catch(console.log); // Will output: errors always win! 😈
```

##### Argument Tokens

`Remoter.CB_ERROR`  
The argument at the token position will be used as the error value for rejection. Only one CB_ERROR token is allowed and cannot be combined with a CB_ERRORS token. 
```javascript 
const EventEmitter = require('events'); 
const Remoter = require('remoter'); 

const eventEmitter = new EventEmitter; 

const remoter = new Remoter; 
const onError = remoter.customCallback(Remoter.CB_ERROR); 

eventEmitter.once('error', onError); // is equvalent to: eventEmitter.once('error', remoter.reject);
```

`Remoter.CB_ERRORS`
All arguments including and from the token positon will be used to form an array of error values for rejection. This token is only allowd at the very end of the token sequence.
```javascript 
import * as Remoter from 'remoter'; 

const remoter = new Remoter; 
const onError = remoter.customCallback(Remoter.CB_ERRORS); 

window.onerror = onError; // On error, will reject with [<errorMsg>, <url>, <lineNumber>, <column>, <errorObj>]
```

`Remoter.CB_RESULT`
The argument at the token position will be used as the result value for fulfillment. Only one CB_RESULT token is allowed and cannot be combined with a CB_RESULTS token. 
```javascript 
import * as Remoter from 'remoter'; 

class FakeRequest {
  constructor (options = {}) {
    this.onError = options.onError; 
    this.onSuccess options.onSuccess;
  }
  load (isSuccess = true) {
    if (isSuccess && this.onSuccess)
      this.onSuccess('some result') 
    else if(this.onError)
      this.onError('some error');
  }
}

const remoter = new Remoter; 
const onSuccess = remoter.customCallback(Remoter.CB_RESULT); 
const onError = remoter.customCallback(Remoter.CB_ERROR); 

const request = new FakeRequest(
  {
    onError, 
    onSuccess
  }
); 

request.load(); 

remoter.then(console.log); // Will output: some result Remoter [Promise] { 'some result' }
```

`Remoter.CB_RESULTS`
All arguments including and from the token positon will be used to form an array of result values for fulfillment. This token is only allowd at the very end of the token sequence.
```javascript 
const Remoter = require('remoter'); 

const remoter = new Remoter; 
const onTimeout = remoter.customCallback(Remoter.CB_RESULTS); 

remoter.then(
  values => 
    console.log( // Will output: All! The! Values!
      ...values.map(
        v => 
          v.charAt(0).toUpperCase()+v.slice(1)+'!'
      )
    ) 
)

setTimeout(onTimeout, 1e3, 'all', 'the', 'values'); 
```

*anything else*
Any other argument passed to *customCallback()* will ignore the argument at that position when passed to the generated callback function. It is recommended that you use either `null` or `undefined`. 
```javascript 
const Remoter = require('remoter'); 

const remoter = new Remoter; 
const callback = remoter.customCallback(null, Remoter.CB_ERROR, null, Remoter.CB_RESULTS); 

callback(42, false, 'Marvin', 'life', 'the universe', 'and everything'); 
// 42: will be ignored ❌
// false: is error value but is falsy and will not reject ❌
// 'Marvin': ignores everyone and will be ignored ❌
// 'life', 'the universe', 'and everything': are collapsed into an array that is used to fulfill the promise ✔ 
remoter.then(values => console.log('The answer to', ...values)); // Will output: The answer to life the universe and everything
```

### Lifecycle Tracing: A glimpse into Schroedinger's Box 
Debugging Promises sometimes feels like fiddeling with the cat in the box. To find out if it's dead or alive, you have to open the box. Remoter offers you an event API to trace the lifecycle of a Promise. 

#### Remoter Instance 

##### .on(eventName, callback)

Subscribe a callback to a lifecycle event of a remoter instance. *callback* will be invoked right before the event occures. The following table lists the events by their *eventName* and the arguments the *callback* is invoked with: 

|Event Name     |Description                                                                             |Callback Arguments                                                 |
|---------------|----------------------------------------------------------------------------------------|-------------------------------------------------------------------|
|`then`         |A callback has been registered using `.then(callback)`                                  |callback (a reference to the callback that has been registered)    |
|`catch`        |A callback has been registered using `.catch(callback)` or  `.then(..., callback)`      |callback (a reference to the callback that has been registered)    |
|`finally`      |A callback has been registered using `.finally(callback)` or `.then(callback, callback)`|callback (a reference to the callback that has been registered)    |
|`resolved`     |The Remoter has been resolved with a value or with nothing                              |value                                                              |
|`rejected`     |The Remoter has been rejected with an error or with nothing                             |error                                                              |
|`claimed`      |A result has been delivered to a `.then` or `.finally` callback                         |value, callback (a reference to the callback that has been invoked)|
|`caught`       |An error has been delivered to a `.catch` or `.finally` callback                        |error, callback (a reference to the callback that has been invoked)|
|`oversaturated`|The Remoter was resolved or rejected but has already been settled                       |valueOrError                                                       |
|`*`            |Any of the above events is emitted                                                      |eventName, ...eventArguments (see above)                           |

The *callback* function can be an **arrow function**, an **anonymous function** or a **named function**. 

As **arrow functions** do not have their own `this` context an additional argument will be added being a reference to the remoter instance: 
```javascript
const remoter = new Remoter; 
remoter.on(
  'resolved', 
  (value, remoterInstance) => {
    console.log(`Remoter resolved ${remoterInstance.remote?'externally':'internally'} with value`, value); 
  }
); 
remoter.resolve(42);
```
```
Remoter resolved externally with value 42
```

As **named functions** and **anonymous functions** can have their own `this` context, this context will be the **remoter instance**: 
```javascript
const remoter = new Remoter; 
remoter.on(
  'resolved', 
  function (remote, value) {
    console.log(`Remoter resolved ${this.remote?'externally':'internally'} with value`, value); 
  }
); 
remoter.resolve(42);
```
```
Remoter resolved externally with value 42
```
###### Find multi-settling bugs
If you miss values or receive unexpected values and you suspect that one of your promises gets resolved twice, both rejected and resolved or any wild combination of that, simply make it an Remoter and throw an error within the `oversaturated` event. 
```javascript
const yourPromise = new Remoter(/*your executor that causes the bug*/); 
yourPromise.on(
  'oversaturated', 
  valueOrError => { 
    console.log('oversaturation with value:', valueOrError); 
    throw new Error('Trace the stack trace!');  
  }
); 
```
The line that caused the 2nd settling invokation will be there in the middle of the stack trace, for sure. 

##### .off([eventName[, callback]])
The `.off` method allows you to remove a *callback* for a given [*eventName*](#oneventname-callback) that has previously been attached using the [.on](#oneventname-callback) method. *callback* needs to be a reference to the function that has been registered before. If *callback* is not provided, all callbacks for the given *eventName* are removed. If called without *eventName* and *callback*, `.off` will remove all events and remove the introspection tooling from the remoter instance. 

### Remoter Class 

#### Constructor: new Remoter([executor])
The constructor of Remoter creates a new instance of the Remoter. Unlike the native Promise 
- the *executor* can be omitted and 
- the *executor* does not need to invoke either the `reject` nor `resolve` callback. 

The *executor* `(resolve, reject) => { ... }` does **not** execute within the native space behind the `super()` call as Remoter passes a custom executor to be able to extract the native `reject` and `resolve` callbacks. To be able to handover the remoter instance as an additional argument to the `.then`, `.catch` and `.finally` callbacks as well as to the lifecycle *event listeners*, the *executor* is invoked at the very end of the constructor which means compared to the native Promise there are more calls on the stack until the instance is returned. 

#### Remoter.resolve, Remoter.all, Remoter.any, ... 
Again, Remoter is a Promise. The static methods of the native Promise are also available on Remoter. It's totally up to you if you want to use `Promise.all([remoter1, promise, remoter2])` or `Remoter.all([remoter1, promise, remoter2])` or even `Promise.all([remoter1.promise, promise, remoter2.promise])`. Remoter works well with `Promise.all` and vice versa. Keep in mind that if you want to use features of Remoter on the Promise returned e.g. by `.all` you will have to use `Remoter.all`. At the moment the `.remote` functionality property and everything related to remote settling introspection is strictly connected to the Promise created by `Remoter.all`. It tells you **nothing** about if any of the remoter instances inside have been resolved from the outside. Additionaly, resolving a remoter instance that has been created using e.g. `Remoter.all` from the outside would be a very silly thing to do as it short-circuits the intended functionality. However, you can use this to create a mock for tests: 
```javascript
// Very silly thing to do when not mocking for tests: 
const Remoter = require('remoter'); 
const allRemoters = Remoter.all([new Remoter]); 
allRemoters.resolve(['myMockResult']); 
``` 
For Promise compatibility of `Remoter.resolve()` see [Chaining](#Chaining). 

#### Lifecycle Introspection Hooks 
The Remoter Class singleton can be used as an EventEmitter emiting events when a Remoter instance has been created. This gives you the opportunity to log lifecycle information about every Promise created within your code. However, there is also [Async Hooks](https://nodejs.org/api/async_hooks.html) in Node that give you a much more granular introspection for **all** asyncronous handles. However, it isn't very easy to understand and not available for web 🤷‍♀️. 

|Event Name     |Description                                                                             |Callback Arguments                                                 |
|---------------|----------------------------------------------------------------------------------------|-------------------------------------------------------------------|
|`create`       |A `new Remoter` instance has been created and the Executor will be invoked              |remoter (a reference to the remoter instance that has been created)|
|`*`            |Any of the above events is emitted                                                      |eventName, ...eventArguments (see above)                           |


##### Remoter.on(eventName, callback) 
The `Remoter.on` method allows you to attach callbacks that get invoked every time a `new Remoter` has been created. 
```javascript
const Remoter = require('remoter'); 

function logNewRemoter () {
  console.log(`Remoter created`, this); 
}

Remoter.on(logNewRemoter); 

const remoter = new Remoter; // Will output: Remoter created Remoter [Promise] <pending>
```

##### Remoter.off(eventName[, callback]) 
The `Remoter.off` method allows you to remove a *callback* that has previously been attached using [Remoter.on](#remoteroncallback). *callback* needs to be a reference to the function that has been registered before. If *callback* is not provided, all callbacks are removed. 

#### Native Promise Class Property 
The `Remoter.Promise` property gives read-only access to the native `Promise` class. 
```javascript
const Remoter = require('remoter'); 
console.log(Remoter.Promise === Promise); // Will output: true
```
This is useful in case you [replaced](#Plug-in-replacement) `Promise` with `Remoter`.

##### Remoter.instanceArgument
`Remoter.instanceArgument` is a boolean property, that when set to *false* disables the addition of the instance reference to the arguments list when the `.then`, `.catch` and `.finally` callbacks are invoked for those registered callbacks that do not have a prototype (*ArrowFunctions* and *Bound Functions*). When set to *true*, enables this behavior. This setting can be overridden on the remoter instance with the corresponding [`.instanceArgument`](#instanceArgument) property. 

Default is *true*. 

# Examples 

## For Sugar
```javascript
const Remoter = require('remoter');

// Instead of this: 
function sleepWithPromise (milliseconds = 0) {
  return new Promise(
    resolve => setTimeout(resolve, milliseconds)
  );
}

// write this: 
function sleepWithRemoter (milliseconds = 0) {
  const {promise, resolve} = new Remoter;
  setTimeout(resolve, milliseconds);
  return promise;
}

(async () => {
  const sleepTimeMs = 2e3; 
  console.log('Sleeping for', sleepTimeMs, 'ms 😴 ...'); 
  await sleepWithRemoter(sleepTimeMs); 
  console.log('Done sleeping 🥱'); 
})(); 
```

## Promisify callback-based API's
```javascript
const fs = require('fs'); 
const Remoter = require('remoter'); 

function writeFileAsync (fileName, data, options) {
  const { remoter, callback } = new Remoter; 
  fs.writeFile(fileName, data, options, callback); 
  return remoter; 
}

(async () => {
  try {
    await writeFileAsync('message.txt', 'stuff'); 
  } catch (error) {
    throw error; 
  }
})()
```

## Avoid async callback hells
```javascript
// Compare: 
function promiseWriteFileAsync (fileName, data, options) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(
        fileName, 
        data, 
        options, 
        (error, result) => {
          if (error) {
            reject(error); 
          } else {
            resolve(result); 
          }
        }
      );
    }
  ); 
}

// to: 
function remoterWriteFileAsync (fileName, data, options) {
  const { promise, callback } = new Remoter; 
  fs.writeFile(fileName, data, options, callback); 
  return promise; 
}
```

## Remotely resolving a Promise  
```javascript
const Remoter = require('remoter');

function resolveIntrinsicly() {
  const remoter = new Remoter(
    resolve => 
      setTimeout(
        resolve, 
        1e3, 
        'Intrinsically resolved'
      )
  );  
  return remoter;
}

function resolveExtrinsicly() {
  const remoter = new Remoter;  
  setTimeout(
    remoter.resolve, 
    1e3, 
    'Extrinsically resolved'
  ); 
  return remoter;
}

async function main() {
  await resolveIntrinsicly(); 
  await resolveExtrinsicly(); 
}

main.bind(this)(); 
```

## Awaiting Events
```javascript
const Remoter = require('remoter');
const EventEmitter = require('events');

function nextEventReceived (eventEmitter, eventName) { 
  const event = new Remoter; 
  eventEmitter.once(eventName, event.resolve); 
  return event;  
}

async function main () {
  const eventEmitter = new EventEmitter(); 
  setTimeout(
    (...args) => {
      console.log('Emitting event'); 
      eventEmitter.emit(...args); 
    }, 
    1e3, 
    'myEvent', 
    'some payload'
  ); 
  console.log('⏳ Waiting for next myEvent'); 
  const payload = await nextEventReceived(eventEmitter, 'myEvent'); 
  console.log('🎉🎉🎉 myEvent received with payload:', payload); 
}

main.bind(this)(); 
```
```javascript
const Remoter = require('remoter');
const EventEmitter = require('events');

// Keep in mind that this won't work if the .next frequency (drain) is 'slower' 
// than the .emit frequency (event) as events will be lost without a buffer 
function* asyncEvents (eventEmitter, eventName) {
  while (true) {
    const {promise: event, resolve: fired} = new Remoter; 
    eventEmitter.once(eventName, fired); 
    yield event; 
  }
}

// Alternative with Error Event handling
/*
function* asyncEvents (eventEmitter, eventName, errorEventName = 'error') {
  while (true) {
    const {promise: event, resolve: fired, reject: error} = new Remoter; 
    eventEmitter.once(errorEventName, error); 
    eventEmitter.once(
      eventName, 
      (...args) => 
        eventEmitter.off(errorEventName, error), // Prevent Event leaking 
        fired(...args)
    ); 
    yield event; 
  }
}
*/

async function main () {
  const eventEmitter = new EventEmitter(); 
  let eventNo = 0; 
  setInterval(
    (...args) => {
      console.log('Emitting event'); 
      eventEmitter.emit(...args, eventNo++); 
    }, 
    1e3, 
    'myEvent'
  ); 

  for await (const payload of asyncEvents(eventEmitter, 'myEvent'))
    console.log('myEvent received with payload:', payload); 
}

main.bind(this)(); 
```

## Cancelling Request Promises
```javascript
const Remoter = require('remoter');

class FakeRequest {

  constructor (url) {
    this.running = false; 
    this.url = url; 
    this.timeout = null; 
  }

  ['get'] (callback) {
    this.running = true; 
    const result = 'some result'; 
    if (this.url)
      this.timeout = setTimeout(
        callback, 
        0.5e3, 
        null, 
        result
      ); // Start Fake Request 
  }

  abort () {
    clearTimeout(this.timeout); // Cancel Fake Request 
    this.timeout = null; 
    this.running = false; 
    console.log('Aborted', this.constructor.name);  
  }
}

function request (url) {
  const remoter = new Remoter; 
  const request = new FakeRequest(url); 
  const timeout = setTimeout( 
    () => {
      console.log('Aborting request because of timeout'); 
      request.abort(); 
      remoter.reject(new Error('Request timed out')); 
    }, 
    1e3
  ); 
  request.get(
    (error, result) => {
      clearTimeout(timeout); 
      if (error) {
        console.log('Request resulted in an error'); 
        remoter.reject(error); 
      } else { 
        console.log('Request successful'); 
        remoter.resolve(result); 
      }
    }
  ); 
  console.log('Request started'); 
  return remoter; 
}

async function main () {
  const result = await request(true); 
  console.log('1st request resulted in:', result)
  try { 
    await request(undefined); 
  } catch (error) {
    console.log('2nd request resulted in error:', error.message); 
  }
}

main.bind(this)(); 
```

## Limiting concurrent requests 
```javascript
const Remoter = require('remoter'); 

// Let's mock a fetch function for our example: 
function fetch (url) {
  const {promise, resolve} = new Remoter;
  setTimeout(
    resolve, 
    Math.floor(Math.random() * 5e2)  + 5e2, 
    url
  );
  return promise;
}

class Semaphore {
  constructor (max = 1) {
    this.flying = []; 
    this.waiting = []; 
    this.max = max; 
  }
  _getReleaseToken(token) {
    return () => {
      this.flying.splice(this.flying.indexOf(token), 1); 
      this._grantTokens(); 
    }
  }
  _grantTokens() {
    while (this.flying.length < this.max && this.waiting.length > 0) {
      const grantedToken = this.waiting.splice(0,1)[0]; 
      const release = this._getReleaseToken(grantedToken); 
      this.flying.push(grantedToken); 
      grantedToken.resolve(release); 
    }
  }
  getToken(force = false) {
    const token = new Remoter;
    if (force || this.flying.length < this.max) { 
      this.flying.push(token); 
      const release = this._getReleaseToken(token); 
      token.resolve(release); 
    } else {
      this.waiting.push(token);  
    }
    return token.promise; 
  }
  rejectAll() {
    for (const waitingToken of this.waiting)
      waitingToken.reject(new Error('wating queue cleared 🤷‍♂️')); 
    this.waiting.splice(0, this.waiting.length); 
  }
}

// Limit concurrent requests to 10 at a time 
const semaphore = new Semaphore(10); 

async function getData(url) {
  console.log('⏳ requesting token for\t\t', url); 
  const release = await semaphore.getToken(); 
  const result = await fetch(url).finally(release); // Don't forget to release! 
  console.log('📄 data received for\t\t', url); 
  return result; 
}

function getAllDataFrom(source, numberOfIds) {
  const ids = Array(numberOfIds).fill().map((v,i)=>`${source}:${i+1}`); 
  const data = ids.map(id => getData(id)); 
  return Promise.all(data); 
}

async function main () {
  const logTick = (start) => console.log(
    const timeDiff = ((new Date.getTime() - start.getTime()) / 1000; 
    `${timeDiff} I am non-blocking 🤗`
  ); 
  const start = new Date; 
  const interval = setInterval(
    logTick, 
    1e3, 
    start
  ); 
  logTick(start); 

  const requestA = getAllDataFrom('A', 100); 
  const requestB = getAllDataFrom('B', 50); 

  console.log(
    await requestA, 
    await requestB
  ); 

  clearInterval(interval); 
}

main.bind(this)(); 
```

# Crowd wisdon 

I want Remoter to be as usefull as possible which includes being as lightweight as possible. I'd love to get your opinion especially on the following topics: 
- Should Remoter stay without dependencies? I thought about using EventEmitter and a pro-forma EventTarget as the internal EventEmitter behind the introspection hooks.  
- Should the value or error respectively be available as an instance property? And if so, would you prefer the property access to result in an exception when requested before a settling callback was called or would `if (!remoter.settled) console.log(remoter.value);` be fine? What would you use that for?
- For the frontend people: Would you like to have more convenience in terms of transpiling/babeling? 
- What implementations did you do with Remoter? Which examples are you missing? 


# Open to PR's

PR's welcome! Please find and fix bugs 🙏. Improvement of the docs very welcome! 

# License
MIT.