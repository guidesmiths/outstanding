var uuid = require('node-uuid').v4
var parseDuration = require('parse-duration')
var clone = require('lodash.clone')
var format = require('util').format

module.exports = function Outstanding(config) {

    var options = config || {}
    var tasks = {}
    var done
    var closed = false
    var timeout
    var self = this

    this.register = function(name, cb) {
        if (self.isClosed()) return cb ? cb(new Error(format('Unable to register %s - registration has closed', name)), null) : null
        var token = uuid()
        tasks[token] = { name: name, registered: Date.now() }
        return cb ? cb(null, token) : token
    }

    this.clear = function(token, cb) {
        delete tasks[token]
        if (self.isClosed()) setImmediate(checkShutdown)
        if (cb) return cb()
    }

    this.wrap = function(name, fn) {
        if (arguments.length === 1) return self.wrap(arguments[0].name || 'anonymous', arguments[0], arguments[1])
        return function(cb) {
            self.run(name, fn, cb)
        }
    }

    this.run = function(name, fn, cb) {
        if (arguments.length === 2) return self.run(arguments[0].name || 'anonymous', arguments[0], arguments[1])
        self.register(name, function(err, token) {
            if (err) return cb(err)
            fn(function() {
                self.clear(token)
                cb.apply(null, Array.prototype.slice.call(arguments))
            })
        })
    }

    this.list = function() {
        return clone(tasks)
    }

    this.shutdown = function(cb) {
        closed = true
        done = cb
        if (options.timeout) scheduleTimeout()
        checkShutdown()
    }

    this.isClosed = function() {
        return closed
    }

    function scheduleTimeout() {
        timeout = setTimeout(function() {
            done(new Error('Outstanding tasks did not complete within ' + options.timeout), self.list())
        }, parseDuration(options.timeout))
        timeout.unref()
    }

    function checkShutdown() {
        if (idle()) {
            clearTimeout(timeout)
            done()
        }
    }

    function idle() {
        return Object.keys(tasks).length === 0
    }
}