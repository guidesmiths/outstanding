var assert = require('chai').assert
var outstanding = require('..')

describe('Outstanding', function() {

    it('should register tasks', function(done) {
        var o = outstanding()
        var token = o.register('foo')
        assert.equal(o.list()[token].name, 'foo')
        done()
    })

    it('should register tasks asynchronously', function(done) {
        var o = outstanding()
        o.register('foo', function(err, token) {
            assert.ifError(err)
            assert.equal(o.list()[token].name, 'foo')
            done()
        })
    })

    it('should clear tasks', function(done) {
        var o = outstanding()
        var token = o.register('foo')
        o.clear(token)
        assert.equal(Object.keys(o.list()).length, 0)
        done()
    })

    it('should clear tasks asynchronously', function(done) {
        var o = outstanding()
        var token = o.register('foo')
        o.clear(token, function(err) {
            assert.ifError(err)
            assert.equal(Object.keys(o.list()).length, 0)
            done()
        })
    })

    it('should tolerate clearing non existent tasks', function(done) {
        var o = outstanding()
        o.clear('missing')
        done()
    })


    it('should tolerate clearing non existent tasks asynchronously', function(done) {
        var o = outstanding()
        o.clear('missing', function(err) {
            assert.ifError(err)
            done()
        })
    })

    it('should prevent new tasks from being registered after calling shutdown', function(done) {
        var o = outstanding()
        o.shutdown(function() {})
        assert.equal(o.register('foo'), null)
        done()
    })

    it('should prevent new tasks from being registered asynchronously after calling shutdown', function(done) {
        var o = outstanding()
        o.shutdown(function() {})
        o.register('foo', function(err, token) {
            assert.ok(err)
            assert.equal(err.message, 'Shutting down')
            assert.equal(token, null)
            done()
        })
    })

    it('should call shutdown immediately when no tasks are registered without timeout', function(done) {
        var o = outstanding()
        var before = Date.now()
        o.shutdown(function(err) {
            assert.ifError(err)
            var after = Date.now()
            assert.ok(after - before <= 100)
            done()
        })
    })

    it('should call shutdown immediately when no tasks are registered with timeout', function(done) {
        var o = outstanding({ timeout: '1s' })
        var before = Date.now()
        o.shutdown(function(err) {
            var after = Date.now()
            assert.ifError(err)
            assert.ok(after - before <= 100)
            done()
        })
    })

    it('should wait for outstanding tasks to complete before calling shutdown', function(done) {
        var o = outstanding({ timeout: '1s' })
        var token = o.register('foo')
        setTimeout(function() {
            o.clear(token)
        }, 500)
        var before = Date.now()
        o.shutdown(function(err) {
            var after = Date.now()
            assert.ifError(err)
            assert.ok(after - before >= 500)
            assert.ok(after - before < 600)
            done()
        })
    })

    it('should timeout if outstanding tasks take too long to complete', function(done) {
        var o = outstanding({ timeout: '1s' })
        var token = o.register('foo')
        var before = Date.now()
        o.shutdown(function(err, tasks) {
            var after = Date.now()
            assert.ok(after - before >= 1000)
            assert.ok(after - before < 1100)
            assert.ok(err)
            assert.equal(err.message, 'Outstanding tasks did not complete within 1s')
            assert.equal(tasks[token].name, 'foo')
            done()
        })
    })

    it('should wrap functions', function(done) {
        var o = outstanding()
        o.wrap('foo', function(cb) {
            var tasks = o.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        }, function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(o.list()).length, 0)
            done()
        })
    })

    it('should wrap functions using function name is not overriden', function(done) {
        var o = outstanding()
        o.wrap(function foo(cb) {
            var tasks = o.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        }, function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(o.list()).length, 0)
            done()
        })
    })

})