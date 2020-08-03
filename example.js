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
  await remoter;
  return;
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
  // Use the reomoter to keep the process running for a while and finally terminate
  const remoter = new Remoter();
  console.log('wait for a while...');
  await sleepWithRemoter(1500);
  remoter.resolve();
  console.log('... and halt');
}



main.bind(this)();
