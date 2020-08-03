# Remoter
Remotely resolveable Native Javascript Promise that exposes it's resolver and rejector callbacks

## Where is it useful?
* When you want to use ``await`` to wait for events (e.g. ``EventEmitter.on(...)`` or ``await sleep(...)``)
* When implementing a abortable/cancelable ``Promise`` 
* When you want to reshape the control flow 
* When you want a piece of asyncronous code to wait for an external event to happen 
* When the promise receiving the data is not directly coreallated with the promise returning the value 

## Usage

#### For Sugar
```javascript
const Remoter = require('promise-remoter');

function sleepWithPromise (milliseconds = 0) {
  return new Promise(
    resolve => setTimeout(resolve, milliseconds)
  );
}

async function sleepWithRemoter (milliseconds = 0) {
  const remoter = new Remoter;
  setTimeout(remoter.resolve, milliseconds);
  return remoter;
}

(async () => {
  const sleepTimeMs = 2e3; 
  console.log('Sleeping for', sleepTimeMs, 'ms 😴 ...'); 
  await sleepWithRemoter(sleepTimeMs); 
  console.log('Done sleeping 🥱'); 
})(); 
```

#### For remotely resolving a Promise  
```javascript
const Remoter = require('promise-remoter');

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
  const remoter = new Remoter();  
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

#### Awaiting Events
```javascript
const Remoter = require('promise-remoter');
const EventEmitter = require('events');

async function nextEventReceived (eventEmitter, eventName) { 
  const event = new Remoter; 
  eventEmitter.on(eventName, event.resolve); 
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
  console.log('Waiting for next myEvent'); 
  const payload = await nextEventReceived(eventEmitter, 'myEvent'); 
  console.log('myEvent received with payload:', payload); 
}

main.bind(this)(); 
```

#### Cancelling Request Promises
```javascript
const Remoter = require('promise-remoter');

class FakeRequest {

  constructor (resolve) {
    this.running = false; 
    this.resolve = resolve; 
    this.timeout = null; 
  }

  ['get'] (callback) {
    this.running = true; 
    const result = 'some result'; 
    if (this.resolve)
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

function request (resolve) {
  const remoter = new Remoter(); 
  const request = new FakeRequest(resolve); 
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
    await request(false); 
  } catch (error) {
    console.log('2nd request resulted in error:', error.message); 
  }
}

main.bind(this)(); 
```

## Open to PR's

PR's welcome! 