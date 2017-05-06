'use strict'

var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis
var assert = require('assert')

describe('The \'rpush\' command', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('inserts multiple values at a time into a list', function (done) {
        client.rpush('test', ['list key', 'should be a list'])
        client.lrange('test', 0, -1, function (err, res) {
          assert.strictEqual(res[0], 'list key')
          assert.strictEqual(res[1], 'should be a list')
          done(err)
        })
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
