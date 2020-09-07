const { expect } = require('chai');
const sinon = require('sinon');

const _Promise = Promise; 

const Remoter = require('./Remoter');


class Message {
    constructor (token, method, message, time = new Date) {
        Object.defineProperties(
            this, 
            {
                token: {
                    value: token, 
                    writable: false, 
                    configurable: false, 
                    enumerable: false
                }, 
                method: {
                    value: method, 
                    writable: false, 
                    configurable: false, 
                    enumerable: false
                }, 
                message: {
                    value: message, 
                    writable: false, 
                    configurable: false, 
                    enumerable: false
                }, 
                time: {
                    value: time, 
                    writable: false, 
                    configurable: false, 
                    enumerable: false
                }
            }
        ); 
    }
    equals (...args) {
        if (this.message.length != args.length) 
            return false; 
        for (let i = 0; i < Math.min(this.message.length, args.length); i++)
            if (this.message[i] !== args[i]) 
                return false; 
        return true; 
    }
}


class ConsoleTrap extends Array {
    constructor (...interceptTokens) {
        super(); 
        const consoleIntercepts = new Set(
            interceptTokens.length < 1 ? 
                ['log'] : 
                [...interceptTokens]
        ); 

        const systemConsoleMethods = new Map(); 

        const trap = (interceptToken, ...args) => {
            this.push(
                new Message(
                    interceptToken, 
                    systemConsoleMethods.get(interceptToken), 
                    [...args]
                )
            ); 
        }

        const startAllTraps = () => {
            consoleIntercepts.forEach(
                (interceptToken) => {
                    systemConsoleMethods.set(
                        interceptToken, 
                        console[interceptToken]
                    ); 
                    console[interceptToken] = trap.bind(null, interceptToken); 
                }
            );     
        }

        const endAllTraps = () => {
            consoleIntercepts.forEach(
                (interceptToken) => {
                    console[interceptToken] = systemConsoleMethods.get(
                        interceptToken
                    ); 
                    systemConsoleMethods.delete(interceptToken); 
                }
            );     
        }

        Object.defineProperties(
            this, 
            {
                end: {
                    value: endAllTraps, 
                    writeable: false, 
                    configurable: false, 
                    enumerable: false
                }, 
                start: {
                    value: startAllTraps, 
                    writeable: false, 
                    configurable: false, 
                    enumerable: false
                }, 
                raw: {
                   get: this.map.bind(this, message => message.message), 
                   configurable: false, 
                   enumerable: false                   
                }
            }
        ); 

        this.start(); 
    }
    
    hasAnyMessage (...args) {
        for (const message of this)
            if (message.equals(...args))
                return true; 
        return false; 
    }

    hasAnyMessageAtLeastNTimes (n, ...args) {
        let count = 0; 
        for (const message of this) 
            if (message.equals(...args))
                count++; 
        return count >= n; 
    }

    hasMessagesInOrder (...args) {
        if (args.length > this.length)
            return false; 
        const orderedMessages = [...args]; 
        let orderedMessage = orderedMessages.splice(0, 1)[0]; 
        for (const message of this) 
            if (message.equals(...orderedMessage)) 
                if (orderedMessage = orderedMessages.splice(0, 1)[0])
                    continue; 
                else 
                    return true; 
        return false; 
    }

}

class MockEventEmitter {
    constructor () {
        this.listeners = {}; 
    }
    on (event, listener) {
        if (!this.listeners[event]) 
            this.listeners[event] = [listener]
        else 
            this.listeners[event].push(listener); 
    }
    once (event, listener) {
        let onceListener; 
        onceListener = (...args) => {
            this.off(event, onceListener); 
            return listener(...args); 
        }
        this.on(event, onceListener); 
    }
    off (event, listener) {
        if (!this.listeners[event])
            return; 
        const listeners = this.listeners[event]; 
        const index = listeners.indexOf(listener); 
        if (index > -1)
            listeners.splice(index, 1); 
        if (listeners.length < 1)
            delete this.listeners[event]; 
    }
    emit (event, ...args) {
        if (!this.listeners[event])
            return false;
        for (const listener of this.listeners[event])
            void listener.apply(this, args); 
        return true;  
    }
}

const   defautltConsoleLog = console.log,  
        defautltConsoleDir = console.dir, 
        defautltConsoleDebug = console.debug, 
        defautltConsoleInfo = console.info, 
        defautltConsoleWarn = console.warn, 
        defautltConsoleError = console.error;  

const   defaultForFinallyArgument = Remoter.finallyArgument, 
        defaultForInstanceArgument = Remoter.instanceArgument; 

beforeEach(
    () => { 
        // Restore console 
        console.log = defautltConsoleLog;
        console.dir = defautltConsoleDir;
        console.debug = defautltConsoleDebug;
        console.info = defautltConsoleInfo;
        console.warn = defautltConsoleWarn;
        console.error = defautltConsoleError;
        // Restore Remoter Defaults
        Remoter.finallyArgument = defaultForFinallyArgument; 
        Remoter.instanceArgument = defaultForInstanceArgument; 
        // Remove all Event Listeners
        Remoter.off(); 
        // Reset native Promise Reference 
        if (Promise !== _Promise)
            Promise = _Promise; 
    }
);


describe(`Documentation Exampes`, () => {

    it(`Plug-in replacement`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
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
        );
        // You might want to disable Remoter.instanceArgument if your claiming callbacks
        // in .then, .catch and .finally accept more than one argument 🙈
        Remoter.instanceArgument = false; 
        // You also might want to disable .finallyArgument if your claiming .finally 
        // callbacks accept arguments 🙉
        Remoter.finallyArgument = false; 

        Promise = Remoter; 

        //...

        const promise = new Promise(
        (resolve, reject) => {
            //...
            resolve(true); // <someId>: resolved true
            reject('uh oh 😯'); // <someId>: oversaturated uh oh 😯
        }
        ); // <someId>: Remoter created
        
        // Cleanup
        setImmediate(
            () => {
                Promise = NativePromise; 
                logs.end(); 
                expect(
                    logs.hasMessagesInOrder(
                        [`${id}: Remoter created`], 
                        [`${id}:`, 'resolved', true, promise], 
                        [`${id}:`, 'oversaturated', 'uh oh 😯', promise]
                    ), 
                    `Logs not in order as expected`
                ).to.be.ok; 

                done(); 
            }
        );
    }); 

    it(`.resolve Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        remoter.then(console.log); // Will output: 42 Remoter [Promise] { 42 }
        remoter.resolve(42); 
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(42, remoter), 
                    `instance did non fulfill or handle fulfillment`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.reject Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        remoter.catch(console.log); // Will output: Question not found. Remoter [Promise] { <rejected> 'Question not found.' }
        remoter.reject('Question not found.'); 
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Question not found.', remoter), 
                    `instance did not reject or handle rejection`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Chaining Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 

        remoter.then(
          value => value+29
        ).then(
          value => value+12
        ).then(
          value => console.log(value) // Will output: 42
        ); 
        
        remoter.resolve(1); 
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(42), 
                    `Chaining inoperative`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Composition Chaining Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const outerRemoter = new Remoter; 
        const innerRemoter = new Remoter; 
        
        outerRemoter.then(
          value => console.log(value) // Will output: 42
        ); 
        
        outerRemoter.resolve(innerRemoter); 
        innerRemoter.resolve(42); 
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(42), 
                    `Composition chaining inoperative`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 


    it(`.oversaturated Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        function oversaturationLog () {
            if (!this.oversaturated)
              console.log(`I feel fulfilled 😊`); 
            else 
              console.log(`I got too much 🤢`); 
          }
          
        const remoter = new Remoter(
            (resolve, reject) => {
                setTimeout(
                    reject, 
                    1, 
                    new Error('The cat is a dog ideed')
                ); 
                resolve(); 
            }
        ); 
        remoter.finally(oversaturationLog); // I feel fulfilled 😊
        setTimeout(
            oversaturationLog.bind(remoter), // I got too much 🤢
            2
        ); 
        
        // Cleanup
        setTimeout(
            () => {
                logs.end(); 
                expect(
                    logs.hasMessagesInOrder(
                        ['I feel fulfilled 😊'], 
                        ['I got too much 🤢']
                    ), 
                    `log messages not right`
                ).to.be.ok; 
                done(); 
            }, 
            3
        );
    }); 

    it(`.remote Exampe 1`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const resolvedFromOutside = new Remoter; 
        resolvedFromOutside.resolve(); 
        resolvedFromOutside.then(
            function () {
                console.log(this.remote); // Will output: true
            }
        );
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(true), 
                    `wrong value for .remote after remote fulfillment`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.remote Exampe 2`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const resolvedInExecutor = new Remoter(
            resolve => resolve()
        ); 
        resolvedInExecutor.then(
            function () {
                console.log(this.remote); // Will output: false
            }
        );
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(false), 
                    `wrong value for .remote after intrinsic fulfillment`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.remote Exampe 3`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const resolvedRightAway = Remoter.resolve(); 
        resolvedRightAway.then(
            function () {
                console.log(this.remote); // Will output: false
            }
        );
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(false), 
                    `wrong value for .remote after intrinsic fulfillment`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Claim settled Remoter results Exampe 1`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 

        remoter.then(
            function (value) {
                console.log(`Remoter resolved ${this.remote?'remotely ':''}with value`, value); 
                // Will output: Remoter resolved remotely with value 42
            }
        ); 
        
        remoter.resolve(42);
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Remoter resolved remotely with value', 42), 
                    `Fulfillment callback was not invoked or remoter did not resolve`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Claim settled Remoter results Exampe 2`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 

        remoter.then(
            (value, remoterInstance) => {
                console.log(`Remoter resolved ${remoterInstance.remote?'remotely ':''}with value`, value); 
                // Will output: Remoter resolved remotely with value 42
            }
        ); 
        
        const thenCallback = function (value) {
            console.log(`Remoter resolved ${remoter.remote?'remotely ':''}with value`, value); 
            // Will output: Remoter resolved remotely with value 42
        }
        
        remoter.then(
          thenCallback.bind(this)
        ); 
        
        remoter.resolve(42);
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessageAtLeastNTimes(2, 'Remoter resolved remotely with value', 42), 
                    `Remoter did not invoke both then callbacks`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.remoter Destructuring Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        function echoFunctionWithOddCallbackAPI(data, onSuccess, onError) {
            if (!data) 
                onError(
                    new Error(`No data to echo 😢`)
                )
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
        ); 
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('stuff'), 
                    `Remoter did not invoke both then callbacks`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.promise Destructuring Exampe (Happy Path)`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 
        const fs = { 
            readFile: (filename, callback) => setImmediate(
                ()=> callback(null, 'file contents')
            )
        }; 

        // Code
        
        const {promise, callback} = new Remoter; 
        
        promise.then(
          value => 
            console.log(value) // If you happen to have such a file. Will output: file contents
        ).catch(
          error => 
            console.error(error) // Otherwise, will output an OS-specific error 
        );
        
        fs.readFile('message.txt', callback);
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('file contents'), 
                    `Promise did not resolve with file contents`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.promise Destructuring Exampe (Sad Path)`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('error'); 
        const error = new Error('OS-specific Error'); 
        const fs = { 
            readFile: (filename, callback) => setImmediate(
                ()=> callback(error)
            )
        }; 

        // Code
        const {promise, callback} = new Remoter; 
        
        promise.then(
          value => 
            console.log(value) // If you happen to have such a file. Will output: file contents
        ).catch(
          error => 
            console.error(error) // Otherwise, will output an OS-specific error 
        );
        
        fs.readFile('message.txt', callback);
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(error), 
                    `Promise did not reject with OS-specific Error`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`.promise Stable Reference Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        console.log(remoter.promise === remoter.promise); // Will outout: true 
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(true), 
                    `.promise property is not a stable reference`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Callback Reference Stability Exampe`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 

        console.log(remoter.callback === remoter.callback); // Will output: true
        console.log(remoter.customCallback(Remoter.CB_RESULT) === remoter.customCallback(Remoter.CB_RESULT)); // Will output: false
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.raw, 
                    `.promise property is not a stable reference`
                ).to.eql([[true], [false]]); 
                done(); 
            }
        );
    }); 

    it(`Callback Error Precedence Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const {promise, callback} = new Remoter; 
        callback('errors always win! 😈', 'results are ignored 😢'); 
        promise.then(console.log).catch(console.log); // Will output: errors always win! 😈
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('errors always win! 😈'), 
                    `Promise did not reject`
                ).to.be.ok; 
                expect(
                    logs.hasAnyMessage('results are ignored 😢'), 
                    `Promise did resolve unexpectedly`
                ).to.be.not.ok; 
                done(); 
            }
        );
    }); 

    it(`Remoter.CB_RESULT Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        class FakeRequest {
          constructor (options = {}) {
            this.onError = options.onError; 
            this.onSuccess = options.onSuccess;
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
                
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('some result', remoter), 
                    `Promise did not reject`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Remoter.CB_RESULTS Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
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
        
        setTimeout(onTimeout, 1, 'all', 'the', 'values'); 
                
        // Cleanup
        setTimeout(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('All!', 'The!', 'Values!'), 
                    `Callback did not aggregate results`
                ).to.be.ok; 
                done(); 
            }, 
            2
        );
    }); 

    it(`Cumstom Callback placeholder Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        const callback = remoter.customCallback(null, Remoter.CB_ERROR, null, Remoter.CB_RESULTS); 
        
        callback(42, false, 'Marvin', 'life', 'the universe', 'and everything'); 
        // 42: will be ignored ❌
        // false: is error value but is falsy and will not reject ❌
        // 'Marvin': ignores everyone and will be ignored ❌
        // 'life', 'the universe', 'and everything': are collapsed into an array that is used to fulfill the promise ✔ 
        remoter.then(values => console.log('The answer to', ...values)); // Will output: The answer to life the universe and everything
                        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('The answer to', 'life', 'the universe', 'and everything'), 
                    `Callback did not aggregate results`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Arrow Functions Instance Argument Context Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        remoter.on(
          'fulfilled', 
          (value, remoterInstance) => {
            // Will output: Remoter resolved externally with value 42
            console.log(`Remoter resolved ${remoterInstance.remote?'externally':'internally'} with value`, value); 
          }
        ); 
        remoter.resolve(42);
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Remoter resolved externally with value', 42), 
                    `Instance argument not present`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Named and Anonymous Functions This Context Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const remoter = new Remoter; 
        remoter.on(
          'resolved', 
          function (value) {
            // Will also output: Remoter resolved externally with value 42
            console.log(`Remoter resolved ${this.remote?'externally':'internally'} with value`, value); 
          }
        ); 
        remoter.resolve(42);
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Remoter resolved externally with value', 42), 
                    `This context is not the remoter instance`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 
    it(`Remmoter.on Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        const logNewRemoter = remoter => {
            console.log(`Remoter created`, remoter); 
        }
          
        Remoter.on('create', logNewRemoter); 

        const remoter = new Remoter; // Will output: Remoter created Remoter [Promise] <pending>
        
        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Remoter created', remoter), 
                    `Remoter did not emit create event`
                ).to.be.ok; 
                done(); 
            }
        );
    }); 

    it(`Remmoter.Promise Example`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
        console.log(Remoter.Promise === Promise); // Will output: true          

        // Cleanup
        setImmediate(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage(true), 
                    `Remoter.Promise is not identical to Promise`
                ).to.be.ok; 
                done(); 
            }
        );
    });

});

describe(`Application Exampes`, () => {
    it(`For Sugar`, function (done) {
        // Installation 
        this.timeout(5e2); 
        const logs = new ConsoleTrap('log'); 

        // Code
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
            const sleepTimeMs = 1; 
            console.log('Sleeping for', sleepTimeMs, 'ms 😴 ...'); 
            await sleepWithRemoter(sleepTimeMs); 
            console.log('Done sleeping 🥱'); 
        })();         

        // Cleanup
        setTimeout(
            () => {
                logs.end(); 
                expect(
                    logs.hasAnyMessage('Sleeping for', 1, 'ms 😴 ...'), 
                    `Did not execute at all`
                ).to.be.ok; 
                expect(
                    logs.hasAnyMessage('Done sleeping 🥱'), 
                    `sleepWithPromise did not resolve`
                ).to.be.ok; 
                sleepWithPromise(0).then(
                    () => done() 
                )
            }, 
            2
        );
    });

    it(`Promisify callback-based API's`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const fs = { 
            writeFile: (fileName, data, options, callback) => setImmediate(
                ()=> callback(null)
            )
        }; 

        const logs = new ConsoleTrap('log'); 
        
        // Cleanup
        const cleanup = () => {
            logs.end(); 
            done(); 
        }

        // Code
        function writeFileAsync (fileName, data, options) {
            const { promise, callback } = new Remoter; 
            fs.writeFile(fileName, data, options, callback); 
            return promise; 
        }
          
        (async () => {
            try {
                await writeFileAsync('message.txt', 'stuff'); 
            } catch (error) {
                throw error; 
            }
            cleanup();
        })()       

    });

    it(`Avoid async callback hells Example`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const fs = { 
            writeFile: (fileName, data, options, callback) => setImmediate(
                ()=> callback(null)
            )
        }; 

        const logs = new ConsoleTrap('log'); 

        // Code
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

        // Cleanup
        let testPromiseWriteFileAsync = false, 
            testRemoterWriteFileAsync = false;
        promiseWriteFileAsync().then(() => { testPromiseWriteFileAsync = true; }); 
        remoterWriteFileAsync().then(() => { testRemoterWriteFileAsync = true; }); 

        setImmediate(
            () => {
                logs.end(); 
                expect(
                    testPromiseWriteFileAsync, 
                    `promiseWriteFileAsync did not resolve`
                ).to.be.true; 
                expect(
                    testRemoterWriteFileAsync, 
                    `remoterWriteFileAsync did not resolve`
                ).to.be.true; 
                done(); 
            }
        );
    });

    it(`Awaiting Events Example 1`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const logs = new ConsoleTrap('log'); 
        
        // Cleanup
        const cleanup = () => {
            logs.end(); 
            expect(
                logs.hasMessagesInOrder(
                    ['⏳ Waiting for next myEvent'], 
                    [ 'Emitting event' ],
                    [ '🎉🎉🎉 myEvent received with payload:', 'some payload' ]                  
                ), 
                ``
            ).to.be.ok;
            done(); 
        }

        const EventEmitter = MockEventEmitter; 

        // Code
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
                1, 
                'myEvent', 
                'some payload'
            ); 
            console.log('⏳ Waiting for next myEvent'); 
            const payload = await nextEventReceived(eventEmitter, 'myEvent'); 
            console.log('🎉🎉🎉 myEvent received with payload:', payload); 
            cleanup();
        }

        main.bind(this)(); 
    }); 

    it(`Awaiting Events Example 2`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const logs = new ConsoleTrap('log'); 
        
        // Cleanup
        const cleanup = () => {
            logs.end(); 
            expect(
                logs.hasMessagesInOrder(
                    [ 'Emitting event' ],
                    [ 'myEvent received with payload:', 0 ],
                    [ 'Emitting event' ],
                    [ 'myEvent received with payload:', 1 ],
                    [ 'Emitting event' ],
                    [ 'myEvent received with payload:', 2 ],
                    [ 'Emitting event' ],
                    [ 'myEvent received with payload:', 3 ],
                ), 
                `Events not emitted`
            ).to.be.ok;
            done(); 
        }

        const EventEmitter = MockEventEmitter; 

        // Code
        // Keep in mind that this won't work if the .next frequency (drain) is 'slower' 
        // than the .emit frequency (event) as events will be lost without a buffer 
        function* asyncEvents (eventEmitter, eventName) {
            /**/ let i = 0; 
            while (true) {
                /**/if (i++>3) break; 
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
                    (...args) => {
                        eventEmitter.off(errorEventName, error), // Prevent Event leaking 
                        fired(...args)
                    }
                ); 
                yield event; 
            }
        }
        */
        
        async function main () {
            const eventEmitter = new EventEmitter(); 
            let eventNo = 0; 
            const interval = setInterval(
                (...args) => {
                    console.log('Emitting event'); 
                    eventEmitter.emit(...args, eventNo++); 
                }, 
                /*1e3*/1, 
                'myEvent'
            ); 
        
            for await (const payload of asyncEvents(eventEmitter, 'myEvent'))
                console.log('myEvent received with payload:', payload); 
            
            clearInterval(interval); 
            
            cleanup(); 
        }
        
        main.bind(this)(); 
    }); 

    it(`Cancelling Request Promises`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const fs = { 
            writeFile: (fileName, data, options, callback) => setImmediate(
                ()=> callback(null)
            )
        }; 

        const logs = new ConsoleTrap('log'); 
        
        // Cleanup
        const cleanup = () => {
            logs.end(); 
            expect(
                logs.hasMessagesInOrder(
                    [ 'Request started' ],
                    [ 'Request successful' ],
                    [ '1st request resulted in:', 'some result' ],
                    [ 'Request started' ],
                    [ 'Aborting request because of timeout' ],
                    [ 'Aborted', 'FakeRequest' ],
                    [ '2nd request resulted in error:', 'Request timed out' ]       
                ), 
                `Log messages not right`
            ).to.be.ok;
            done(); 
        }

        // Code
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
                  0, 
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
            const fakeRequest = new FakeRequest(url); 
            const timeout = setTimeout( 
              () => {
                console.log('Aborting request because of timeout'); 
                fakeRequest.abort(); 
                remoter.reject(new Error('Request timed out')); 
              }, 
              5
            ); 
            fakeRequest.get(
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
            cleanup(); 
          }
          
          main.bind(this)(); 
    });

    it(`Limiting concurrent requests`, function (done) {
        // Installation 
        this.timeout(5e2); 

        const fs = { 
            writeFile: (fileName, data, options, callback) => setImmediate(
                ()=> callback(null)
            )
        }; 

        const logs = new ConsoleTrap('log'); 
        
        // Cleanup
        const cleanup = () => {
            logs.end(); 
            expect(
                logs.hasMessagesInOrder(
                    [ '⏳ requesting token for\t\t', 'A:1' ],
                    [ '⏳ requesting token for\t\t', 'A:2' ],
                    [ '⏳ requesting token for\t\t', 'A:3' ],
                    [ '⏳ requesting token for\t\t', 'B:1' ],
                    [ '⏳ requesting token for\t\t', 'B:2' ]
                ), 
                `Token requests not logged`
            ).to.be.ok; 
            expect(
                logs.hasAnyMessage('📄 data received for\t\t', 'A:1'), 
                `No data retrieval logs`
            ).to.be.ok; 
            expect(
                logs.hasAnyMessage('0 I am non-blocking 🤗'), 
                `Non-blocking ❤ beat missing`
            ).to.be.ok; 
            expect(
                logs.raw[logs.raw.length - 1], 
                `Result not received`
            ).to.eql([ [ 'A:1', 'A:2', 'A:3' ], [ 'B:1', 'B:2' ] ]);
            done(); 
        }

        // Code
        // Let's mock a fetch function for our example: 
        function fetch (url) {
            const {promise, resolve} = new Remoter;
            setTimeout(
                resolve, 
                Math.floor(Math.random() * /*5e2*/1)  + /*5e2*/1, 
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
        const semaphore = new Semaphore(2); 
        
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
            const logTick = (start) => {
                const timeDiff = 0; /*((new Date).getTime() - start.getTime()) / 1000;*/
                console.log(`${timeDiff} I am non-blocking 🤗`); 
            }
            const start = new Date; 
            const interval = setInterval(
                logTick, 
                1e3, 
                start
            ); 
            logTick(start); 
        
            const requestA = getAllDataFrom('A', 3); 
            const requestB = getAllDataFrom('B', 2); 
        
            console.log(
                await requestA, 
                await requestB
            ); 
        
            clearInterval(interval); 

            cleanup();
        }
        
        main.bind(this)(); 
    });
});
