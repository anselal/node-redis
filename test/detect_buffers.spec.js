'use strict'

var Buffer = require('safe-buffer').Buffer
var assert = require('assert')
var config = require('./lib/config')
var helper = require('./helper')
var redis = config.redis

describe('detectBuffers', function () {
  var client
  var args = config.configureClient('localhost', {
    detectBuffers: true
  })

  beforeEach(function (done) {
    client = redis.createClient.apply(null, args)
    client.once('error', done)
    client.once('connect', function () {
      client.flushdb(function (err) {
        client.hmset('hash key 2', 'key 1', 'val 1', 'key 2', 'val 2')
        client.set('string key 1', 'string value')
        return done(err)
      })
    })
  })

  afterEach(function () {
    client.end(true)
  })

  describe('get', function () {
    describe('first argument is a string', function () {
      it('returns a string', function (done) {
        client.get('string key 1', helper.isString('string value', done))
      })

      it('returns a string when executed as part of transaction', function (done) {
        client.multi().get('string key 1').exec(function (err, res) {
          helper.isString('string value', done)(err, res[0])
        })
      })
    })

    describe('first argument is a buffer', function () {
      it('returns a buffer', function (done) {
        client.get(Buffer.from('string key 1'), function (err, reply) {
          assert.strictEqual(true, Buffer.isBuffer(reply))
          assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply.inspect())
          return done(err)
        })
      })

      it('returns a bufffer when executed as part of transaction', function (done) {
        client.multi().get(Buffer.from('string key 1')).exec(function (err, reply) {
          assert.strictEqual(1, reply.length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]))
          assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect())
          return done(err)
        })
      })
    })
  })

  describe('multi.hget', function () {
    it('can interleave string and buffer results', function (done) {
      client.multi()
        .hget('hash key 2', 'key 1')
        .hget(Buffer.from('hash key 2'), 'key 1')
        .hget('hash key 2', Buffer.from('key 2'))
        .hget('hash key 2', 'key 2')
        .exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(4, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
          assert.strictEqual(true, Buffer.isBuffer(reply[2]))
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
          assert.strictEqual('val 2', reply[3])
          return done(err)
        })
    })
  })

  describe('batch.hget', function () {
    it('can interleave string and buffer results', function (done) {
      client.batch()
        .hget('hash key 2', 'key 1')
        .hget(Buffer.from('hash key 2'), 'key 1')
        .hget('hash key 2', Buffer.from('key 2'))
        .hget('hash key 2', 'key 2')
        .exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(4, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
          assert.strictEqual(true, Buffer.isBuffer(reply[2]))
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
          assert.strictEqual('val 2', reply[3])
          return done(err)
        })
    })
  })

  describe('hmget', function () {
    describe('first argument is a string', function () {
      it('returns strings for keys requested', function (done) {
        client.hmget('hash key 2', 'key 1', 'key 2', function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(2, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual('val 2', reply[1])
          return done(err)
        })
      })

      it('returns strings for keys requested in transaction', function (done) {
        client.multi().hmget('hash key 2', 'key 1', 'key 2').exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual('val 1', reply[0][0])
          assert.strictEqual('val 2', reply[0][1])
          return done(err)
        })
      })

      it('handles array of strings with undefined values (repro #344)', function (done) {
        client.hmget('hash key 2', 'key 3', 'key 4', function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(2, reply.length)
          assert.strictEqual(null, reply[0])
          assert.strictEqual(null, reply[1])
          return done(err)
        })
      })

      it('handles array of strings with undefined values in transaction (repro #344)', function (done) {
        client.multi().hmget('hash key 2', 'key 3', 'key 4').exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual(null, reply[0][0])
          assert.strictEqual(null, reply[0][1])
          return done(err)
        })
      })
    })

    describe('first argument is a buffer', function () {
      it('returns buffers for keys requested', function (done) {
        client.hmget(Buffer.from('hash key 2'), 'key 1', 'key 2', function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(2, reply.length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect())
          return done(err)
        })
      })

      it('returns buffers for keys requested in transaction', function (done) {
        client.multi().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
          return done(err)
        })
      })

      it('returns buffers for keys requested in .batch', function (done) {
        client.batch().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec(function (err, reply) {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
          return done(err)
        })
      })
    })
  })

  describe('hgetall', function (done) {
    describe('first argument is a string', function () {
      it('returns string values', function (done) {
        client.hgetall('hash key 2', function (err, reply) {
          assert.strictEqual('object', typeof reply)
          assert.strictEqual(2, Object.keys(reply).length)
          assert.strictEqual('val 1', reply['key 1'])
          assert.strictEqual('val 2', reply['key 2'])
          return done(err)
        })
      })

      it('returns string values when executed in transaction', function (done) {
        client.multi().hgetall('hash key 2').exec(function (err, reply) {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual('val 1', reply[0]['key 1'])
          assert.strictEqual('val 2', reply[0]['key 2'])
          return done(err)
        })
      })

      it('returns string values when executed in .batch', function (done) {
        client.batch().hgetall('hash key 2').exec(function (err, reply) {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual('val 1', reply[0]['key 1'])
          assert.strictEqual('val 2', reply[0]['key 2'])
          return done(err)
        })
      })
    })

    describe('first argument is a buffer', function () {
      it('returns buffer values', function (done) {
        client.hgetall(Buffer.from('hash key 2'), function (err, reply) {
          assert.strictEqual(null, err)
          assert.strictEqual('object', typeof reply)
          assert.strictEqual(2, Object.keys(reply).length)
          assert.strictEqual(true, Buffer.isBuffer(reply['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
          return done(err)
        })
      })

      it('returns buffer values when executed in transaction', function (done) {
        client.multi().hgetall(Buffer.from('hash key 2')).exec(function (err, reply) {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
          return done(err)
        })
      })

      it('returns buffer values when executed in .batch', function (done) {
        client.batch().hgetall(Buffer.from('hash key 2')).exec(function (err, reply) {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
          return done(err)
        })
      })
    })
  })
})
