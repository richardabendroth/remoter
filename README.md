# Remoter

## What is it?
When the promise getting the data is not directly coreallated with the promise returning the value.

## Usage
```javscript
const Remoter = require('remoter');

function resolveIntrinsicly(delay = 0) {
  const remoter = new Remoter();  
  return remoter;
}

function resolveExtrinsicly(delay = 0) {
  const remoter = new Remoter();  
  return remoter;
}


async function main() {
  const remoter = new Remoter;

  console.log('Remoter is resolved?: ', remoter.resolved);
  console.log('Remoter value', await remoter);
}

main.bind(this)();

```




## Why is it not called callbackify(), depromisify() or simply Callback?

I thought about it but after all, since a promise can settle either as fulfilled
(resolved) or as rejected you need to return a result structure with two
callbacks. As the intention is to add the idea of a callback back to the concept
of promises with ES6 async/await syntax convenience.
I didn't call it Callback as it is a set of multiple callsbacks (which would be
onDone, onError, etc.). If you want to call it Callback, be my guest:

```javscript
const Callback = require('remoter');
```

or

```javscript
import Remoter as Callback;
```

Why is it called Remoter?

I chose the name Remoter since it's the concept of a remotely settled promise.


## Couldn't this be achieved by using plain old callbacks?

Yes, but if you want to work with ES6 async/await syntax convenience, you will
have to promisify before returning.
