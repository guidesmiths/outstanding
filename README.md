[![Build Status](https://img.shields.io/travis/guidesmiths/outstanding/master.svg)](https://travis-ci.org/guidesmiths/outstanding)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
# outstanding

Outstanding assists with graceful shutdown of node.js applications by providing a way to track asynchronous tasks and block shutdown until they complete.

## Usage
```js
const outstanding = require('outstanding')
const tasklist = outstanding({ timeout: '5s' })

const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
    process.on(signal, () => {
        taskList.shutdown((err, outstandingTasks) => {
            if (err) console.log(outstandingTasks)
            process.exit(0)
        })
    })
})

// Meanwhile...
const token = tasklist.register('foo')
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

### You can also use the async api
```js
tasklist.register('foo', (err, token) => {
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

### Or the wrapped api
```js
tasklist.wrap('foo', someAsynchronousTask, (err, result) => {
    if (err) console.error(err)
    else console.log('The result of some asychronous task was', result)
})
```

###


