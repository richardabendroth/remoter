const Remoter = require('./Remoter'); 

function generateLogMessage (caller, remoter, value) {
  return `${caller.name}: resolved ${remoter.remote?'ex':'in'}trinsically with value "${String(value)}" \r\n\
    \tfulfilled: ${remoter.fulfilled} \r\n\
    \tresolved: ${remoter.resolved} \r\n\
    \trejected: ${remoter.rejected} \r\n\
    \tremote: ${remoter.remote} \r\n\
    \tfulfilledRemotely: ${remoter.fulfilledRemotely} \r\n\
    \tresolvedRemotely: ${remoter.resolvedRemotely} \r\n\
    \trejectedRemotely: ${remoter.rejectedRemotely} \
    `;
}

function line () {
  console.log('-'.repeat(80));
}

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

async function resolveExtrinsicly () {
  const remoter = new Remoter;
  remoter.then(
    (value) =>
      console.log(
        generateLogMessage(
          resolveExtrinsicly,
          remoter,
          value
        )
      )
  );
  remoter.resolve('Hello extrinsic world!');
}

async function resolveIntrinsicly () {
  const remoter = new Remoter(
    (resolve, reject) =>
      resolve('Hello intrinisc world!')
  );
  remoter.then(
    (value) => {
      console.log(
        generateLogMessage(
          resolveIntrinsicly,
          remoter,
          value
        )
      )
    }
  );
}

async function getSomeRemoteValue (remoter, value) {
  console.log('\t\t\t\tDoing something in parallel ...');
  console.log('\t\t\t\t... and wait for the result ...');
  await sleepWithPromise(500);
  console.log('\t\t\t\tInject the value from the parallel execution...');
  console.log('\t\t\t\t... and hand back control ...');
  remoter.resolve(value);
}

async function doSomethingAndWaitForARemoteValue (remoter, value) {
  console.log('...wating for remote injection...');
  const result = await remoter;
  return value + result;
}

async function doSomething (value) {
  const remoter = new Remoter;
  console.log('main flow\t\t\tparallel flow');
  console.log('Starting to do something.. ');
  getSomeRemoteValue(remoter, value/2);
  console.log('Doing some other stuff ...');
  console.log('Get the value by...');
  const result = await doSomethingAndWaitForARemoteValue(remoter, value/2);
  console.log('And the result: ', result);
}

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
      );
  }

  abort () {
    clearTimeout(this.timeout); 
    this.timeout = null; 
    this.running = false;
    console.log('Aborted', this.constructor.name);  
  }

}

function requestSomethingWithTimeout (resolve) {
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

const EventEmitter = require('events');

async function nextEventReceived () { 
  const eventEmitter = new EventEmitter(); 
  const myEvent = new Remoter; 
  eventEmitter.on('myEvent', myEvent.resolve); 
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
  const payload = await myEvent; 
  console.log('myEvent received with payload:', payload); 
}

async function main () {
  line();
  resolveExtrinsicly();
  await sleepWithPromise(100);
  line();
  resolveIntrinsicly();
  await sleepWithRemoter(100);
  line();
  await doSomething(42);
  line();
  const requestSomethingWithTimeoutResult = await requestSomethingWithTimeout(true); 
  console.log('Request resulted in:', requestSomethingWithTimeoutResult)
  line();
  try { 
    await requestSomethingWithTimeout(false); 
  } catch (error) {
    console.log('Request resulted in error:', error.message); 
  }
  line();
  await nextEventReceived(); 
  line();
  // Use the reomoter to keep the process running for a while and finally terminate
  const remoter = new Remoter();
  console.log('wait for a while...');
  await sleepWithRemoter(1500);
  remoter.resolve();
  console.log('... and halt');
}



main.bind(this)();
