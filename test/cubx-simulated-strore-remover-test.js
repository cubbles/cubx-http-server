'use strict';
var assert = require('assert');
var vows = require('vows');
var request = require('request');
var cubxHttpServer = require('../lib/cubx-http-server');
var path = require('path');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('cubx.core-simulated-remover').addBatch({
  'When cubx-http-server is listening on 8080 and the request included a localstore': {
    topic: function () {
      var server = cubxHttpServer.createServer({
        root: root,
        robots: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      });

      server.listen(8080);
      this.callback(null, server);
    },
    'it should serve files from root directory': {
      topic: function () {
        request('http://127.0.0.1:8080/localstore/file', this.callback);
      },
      'status code should be 200': function (res) {
        assert.equal(res.statusCode, 200);
      }
    }
  }
}).export(module);
