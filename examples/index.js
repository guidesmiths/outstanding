var fs = require('fs')
var outstanding = require('..')()

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

function task() {
    outstanding.wrap('example', function(cb) {
        fs.writeFile('file.txt', 'hello', function(err) {
            fs.unlink('file.txt', cb)
        })
    }, function(err, x) {
        if (err) throw err
        setImmediate(task)
    })
}

task()

