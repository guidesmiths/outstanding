[![Build Status](https://img.shields.io/travis/guidesmiths/outstanding/master.svg)](https://travis-ci.org/guidesmiths/outstanding)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
# outstanding

Outstanding assists with graceful shutdown of node.js applications by providing a way to track asynchronous tasks and block shutdown until they complete or the optional timeout expires.

## Usage
```js
const outstanding = require('outstanding')
const tasklist = outstanding({ timeout: '5s' })

const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
    process.on(signal, () => {
        taskList.shutdown((err, outstandingTasks) => {
            if (err) {
                // Tasks didn't complete before the timeout expired
                console.log(err.message, outstandingTasks)
                process.exit(1)
            } else {
                process.exit(0)
            }
        })
    })
})

// Meanwhile...
tasklist.wrap(someAsynchronousTask, (err, result) => {
    if (err) console.error(err)
    else console.log('The result of some asychronous task was', result)
})
```
The task is registered using its function's name, so you can see which functions didn't complete within the timeout by inspecting the ```outstandingTasks`. You can override the name (useful for anonymous functions) as follows:

```js
tasklist.wrap('some task', someAsynchronousTask, (err, result) => {
    if (err) console.error(err)
    else console.log('The result of some asychronous task was', result)
})
```

### Instead of wrapping your task, you can also use the asynchronous api
```js
tasklist.register('some task', (err, token) => {
    if (err) return console.log('system is shutting down')
    someAsynchronousTask((err, result) => {
        taskList.clear(token, () => {
            // Clear never returns an error
            if (err) console.error(err)
            else console.log('The result of some asychronous task was', result)
        })
    })
})
```

### Or the synchronous api
```js
const token = tasklist.register('some task')
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


