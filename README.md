[![Build Status](https://img.shields.io/travis/guidesmiths/outstanding/master.svg)](https://travis-ci.org/guidesmiths/outstanding)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
# outstanding
In the world of continuous deployment applications are being started and stopped more frequently than ever. Stopping a process is normally achived by sending a 'SIGINT' or 'SIGTERM' signal. Your node application can listen for this and perform a gracesful shutdown by stopping listeners and closing connections, ensuring that new http requests are rejected, but in-flight ones can complete. But what happens to asynchronous processes that are not part of a request/response workflow, e.g.

```js
setInterval(() => {
    fs.writeFile('file.txt', res.body, function(err) {

        // If SIGINT or SIGTERM is triggered now your application will shutdown
        // before the file is deleted

        fs.unlink('file.txt', function() {
            console.log('done')
        })
    })
}, 5000)
```
In truth there's nothing you can do to completely prevent this scenario. ```SIGKILL``` will kill your application instantly and cannot be listened for, but since most deployment mechanism try ```SIGTERM``` first and wait for a bit before invoking ```SIGKILL``` why not be a good citizen and wait until the asynchronous operations are complete?

This is where ```outstanding``` comes in handy. Outstanding assists with graceful shutdown of node.js applications by providing a way to track asynchronous tasks and block shutdown until they complete or an optional timeout expires.
### TL;DR
```js
const outstanding = require('outstanding')({ timeout: '5s' })
const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
    process.on(signal, () => {
        outstanding.shutdown((err, incomplete) => {
            if (err) {
                console.log(err.message, incomplete)
                process.exit(1)
            } else {
                process.exit(0)
            }
        })
    })
})

outstanding.run(someAsynchronousTask, (err, result) => {
    if (err) console.error(err)
    else console.log('The result of some asychronous task was', result)
})
```
## Advanced Usage

### Wrapping tasks
Sometimes you want to pass a function runped with outstanding to an executor.
```js
var wrapped = outstanding.wrap(someAsynchronousTask)
async.times(3, wrapped)
```

### Labeling tasks
When you ```run``` or ```wrap``` an asynchronous task, ```outstanding``` keeps track of the function name so you can at least log incomplete tasks on shutdown. If you use anonymous functions or prefer a custom label you can add an extra argument to both these functions, e.g.

```js
outstanding.run('my label', someAsynchronousTask, (err, result) => {
    if (err) console.error(err)
    else console.log('The result of some asychronous task was', result)
})
```

### Low Level API
The simplest way to use ```outstanding``` is to run tasks, but you can also use the api synchronously and asynchronously. In this case you need to explicitly use a label.

#### Asynchronous Usage
```js
outstanding.register('my label', (err, token) => {
    if (err) return console.log('Cannot register task - the system is shutting down')
    someAsynchronousTask((err, result) => {
        outstanding.clear(token, () => {
            // Clear never returns an error
            if (err) console.error(err)
            else console.log('The result of some asychronous task was', result)
        })
    })
})
```

#### Synchronous Usage
```js
const token = tasklist.register('my label')
if (token) {
    someAsynchronousTask((err, result) => {
        taskList.clear(token)
        if (err) console.error(err)
        else console.log('The result of some asychronous task was', result)
    })
} else {
    console.log('Cannot register task - the system is shutting down')
}
```
