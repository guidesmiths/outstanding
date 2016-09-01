var assert = require('chai').assert
var Outstanding = require('..')

describe('Outstanding', function() {

    it('should register tasks', function(done) {
        var outstanding = new Outstanding()
        var token = outstanding.register('foo')
        assert.equal(outstanding.list()[token].name, 'foo')
        done()
    })

    it('should register tasks asynchronously', function(done) {
        var outstanding = new Outstanding()
        outstanding.register('foo', function(err, token) {
            assert.ifError(err)
            assert.equal(outstanding.list()[token].name, 'foo')
            done()
        })
    })

    it('should clear tasks', function(done) {
        var outstanding = new Outstanding()
        var token = outstanding.register('foo')
        outstanding.clear(token)
        assert.equal(Object.keys(outstanding.list()).length, 0)
        done()
    })

    it('should clear tasks asynchronously', function(done) {
        var outstanding = new Outstanding()
        var token = outstanding.register('foo')
        outstanding.clear(token, function(err) {
            assert.ifError(err)
            assert.equal(Object.keys(outstanding.list()).length, 0)
            done()
        })
    })

    it('should tolerate clearing non existent tasks', function(done) {
        var outstanding = new Outstanding()
        outstanding.clear('missing')
        done()
    })


    it('should tolerate clearing non existent tasks asynchronously', function(done) {
        var outstanding = new Outstanding()
        outstanding.clear('missing', function(err) {
            assert.ifError(err)
            done()
        })
    })

    it('should prevent new tasks from being registered after calling shutdown', function(done) {
        var outstanding = new Outstanding()
        outstanding.shutdown(function() {})
        assert.equal(outstanding.register('foo'), null)
        done()
    })

    it('should prevent new tasks from being registered asynchronously after calling shutdown', function(done) {
        var outstanding = new Outstanding()
        outstanding.shutdown(function() {})
        outstanding.register('foo', function(err, token) {
            assert.ok(err)
            assert.equal(err.message, 'Shutting down')
            assert.equal(token, null)
            done()
        })
    })

    it('should call shutdown immediately when no tasks are registered without timeout', function(done) {
        var outstanding = new Outstanding()
        var before = Date.now()
        outstanding.shutdown(function(err) {
            assert.ifError(err)
            var after = Date.now()
            assert.ok(after - before <= 100)
            done()
        })
    })

    it('should call shutdown immediately when no tasks are registered with timeout', function(done) {
        var outstanding = new Outstanding({ timeout: '1s' })
        var before = Date.now()
        outstanding.shutdown(function(err) {
            var after = Date.now()
            assert.ifError(err)
            assert.ok(after - before <= 100)
            done()
        })
    })

    it('should wait for new Outstanding tasks to complete before calling shutdown', function(done) {
        var outstanding = new Outstanding({ timeout: '1s' })
        var token = outstanding.register('foo')
        setTimeout(function() {
            outstanding.clear(token)
        }, 500)
        var before = Date.now()
        outstanding.shutdown(function(err) {
            var after = Date.now()
            assert.ifError(err)
            assert.ok(after - before >= 500)
            assert.ok(after - before < 600)
            done()
        })
    })

    it('should timeout if new Outstanding tasks take too long to complete', function(done) {
        var outstanding = new Outstanding({ timeout: '1s' })
        var token = outstanding.register('foo')
        var before = Date.now()
        outstanding.shutdown(function(err, tasks) {
            var after = Date.now()
            assert.ok(after - before >= 1000)
            assert.ok(after - before < 1100)
            assert.ok(err)
            assert.equal(err.message, 'Outstanding tasks did not complete within 1s')
            assert.equal(tasks[token].name, 'foo')
            done()
        })
    })

    it('should wrap task', function(done) {
        var outstanding = new Outstanding()
        var wrapped = outstanding.wrap('foo', function(cb) {
            var tasks = outstanding.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        })

        wrapped(function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(outstanding.list()).length, 0)
            done()
        })
    })

    it('should wrap using function name when not overriden', function(done) {
        var outstanding = new Outstanding()
        var wrapped = outstanding.wrap(function foo(cb) {
            var tasks = outstanding.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        })

        wrapped(function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(outstanding.list()).length, 0)
            done()
        })
    })

    it('should run task', function(done) {
        var outstanding = new Outstanding()
        outstanding.run('foo', function(cb) {
            var tasks = outstanding.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        }, function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(outstanding.list()).length, 0)
            done()
        })
    })

    it('should run using function name when not overriden', function(done) {
        var outstanding = new Outstanding()
        outstanding.run(function foo(cb) {
            var tasks = outstanding.list()
            var tokens = Object.keys(tasks)
            assert.equal(tokens.length, 1)
            assert.equal(tasks[tokens[0]].name, 'foo')
            cb(null, 1, 2, 3)
        }, function(err, one, two, three) {
            assert.ifError(err)
            assert.equal(one, 1)
            assert.equal(two, 2)
            assert.equal(three, 3)
            assert.equal(Object.keys(outstanding.list()).length, 0)
            done()
        })
    })

})