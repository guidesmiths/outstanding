var uuid = require('node-uuid').v4
var parseDuration = require('parse-duration')
var clone = require('lodash.clone')

module.exports = function(config) {

    var options = config || {}
    var tasks = {}
    var done
    var timeout

    function register(name, cb) {
        if (shuttingDown()) return cb ? cb(new Error('Shutting down'), null) : null
        var token = uuid()
        tasks[token] = { name: name, registered: Date.now() }
        return cb ? cb(null, token) : token
    }

    function clear(token, cb) {
        delete tasks[token]
        if (shuttingDown()) setImmediate(checkShutdown)
        if (cb) return cb()
    }

    function wrap(name, fn, cb) {
        if (arguments.length === 2) return wrap(arguments[0].name || 'anonymous', arguments[0], arguments[1])
        register(name, function(err, token) {
            if (err) return cb(err)
            fn(function() {
                clear(token)
                cb.apply(null, Array.prototype.slice.call(arguments))
            })
        })
    }

    function list() {
        return clone(tasks)
    }


    function shutdown(cb) {
        done = cb
        if (options.timeout) scheduleTimeout()
        checkShutdown()
    }

    function scheduleTimeout() {
        timeout = setTimeout(function() {
            done(new Error('Outstanding tasks did not complete within ' + options.timeout), list())
        }, parseDuration(options.timeout))
        timeout.unref()
    }

    function checkShutdown() {
        if (idle()) {
            clearTimeout(timeout)
            done()
        }
    }

    function shuttingDown() {
        return !!done
    }

    function idle() {
        return Object.keys(tasks).length === 0
    }

    return {
        register: register,
        clear: clear,
        wrap: wrap,
        list: list,
        shutdown: shutdown
    }

}