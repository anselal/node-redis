'use strict'

var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis

describe('The \'hincrby\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client
      var hash = 'test hash'

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('increments a key that has already been set', function (done) {
        var field = 'field 1'

        client.hset(hash, field, 33)
        client.hincrby(hash, field, 10, helper.isNumber(43, done))
      })

      it('increments a key that has not been set', function (done) {
        var field = 'field 2'

        client.hincrby(hash, field, 10, helper.isNumber(10, done))
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
