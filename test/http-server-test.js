var assert = require('assert');
var path = require('path');
var fs = require('fs');
var vows = require('vows');
var request = require('request');
var cubxHttpServer = require('../lib/cubx-http-server');

var root = path.join(__dirname, 'fixtures', 'root');

vows.describe('cubx-http-server').addBatch({
  'When cubx-http-server is listening on 8080': {
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
        request('http://127.0.0.1:8080/file', this.callback);
      },
      'status code should be 200': function (res) {
        assert.equal(res.statusCode, 200);
      },
      'and file content': {
        topic: function (res, body) {
          var self = this;
          fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
            self.callback(err, data, body);
          });
        },
        'should match content of served file': function (err, file, body) { // eslint-disable-line handle-callback-err
          assert.equal(body.trim(), file.trim());
        }
      }
    },
    'when requesting non-existent file': {
      topic: function () {
        request('http://127.0.0.1:8080/404', this.callback);
      },
      'status code should be 404': function (res) {
        assert.equal(res.statusCode, 404);
      }
    },
    'when requesting /': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with index': function (err, res, body) { // eslint-disable-line handle-callback-err
        assert.equal(res.statusCode, 200);
        assert.include(body, '/file');
        assert.include(body, '/canYouSeeMe');
      }
    },
    'when robots options is activated': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with status code 200 to /robots.txt': function (res) {
        assert.equal(res.statusCode, 200);
      }
    },
    'and options include custom set http-headers': {
      topic: function () {
        request('http://127.0.0.1:8080/', this.callback);
      },
      'should respond with headers set in options': function (err, res) { // eslint-disable-line handle-callback-err
        assert.equal(res.headers[ 'access-control-allow-origin' ], '*');
        assert.equal(res.headers[ 'access-control-allow-credentials' ], 'true');
      }
    },
    'When cubx-http-server is proxying from 8081 to 8080': {
      topic: function () {
        var proxyServer = cubxHttpServer.createServer({
          proxy: 'http://127.0.0.1:8080/',
          root: path.join(__dirname, 'fixtures')
        });
        proxyServer.listen(8081);
        this.callback(null, proxyServer);
      },
      'it should serve files from the proxy server root directory': {
        topic: function () {
          request('http://127.0.0.1:8081/root/file', this.callback);
        },
        'status code should be the enpoint code 200': function (res) {
          assert.equal(res.statusCode, 200);
        },
        'and file content': {
          topic: function (res, body) {
            var self = this;
            fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
              self.callback(err, data, body);
            });
          },
          'should match content of the served file': function (err, file, body) { // eslint-disable-line handle-callback-err
            assert.equal(body.trim(), file.trim());
          }
        }
      },
      'it should fallback to the proxied server': {
        topic: function () {
          request('http://127.0.0.1:8081/file', this.callback);
        },
        'status code should be the enpoint code 200': function (res) {
          assert.equal(res.statusCode, 200);
        },
        'and file content': {
          topic: function (res, body) {
            var self = this;
            fs.readFile(path.join(root, 'file'), 'utf8', function (err, data) {
              self.callback(err, data, body);
            });
          },
          'should match content of the proxied served file': function (err, file, body) { // eslint-disable-line handle-callback-err
            assert.equal(body.trim(), file.trim());
          }
        }
      }
    }
  },
  'When cors is enabled': {
    topic: function () {
      var server = cubxHttpServer.createServer({
        root: root,
        cors: true,
        corsHeaders: 'X-Test'
      });
      server.listen(8082);
      this.callback(null, server);
    },
    'and given OPTIONS request': {
      topic: function () {
        request({
          method: 'OPTIONS',
          uri: 'http://127.0.0.1:8082/',
          headers: {
            'Access-Control-Request-Method': 'GET',
            Origin: 'http://example.com',
            'Access-Control-Request-Headers': 'Foobar'
          }
        }, this.callback);
      },
      'status code should be 204': function (err, res) { // eslint-disable-line handle-callback-err
        assert.equal(res.statusCode, 204);
      },
      'response Access-Control-Allow-Headers should contain X-Test': function (err, res) { // eslint-disable-line handle-callback-err
        assert.ok(res.headers[ 'access-control-allow-headers' ].split(/\s*,\s*/g).indexOf('X-Test') >= 0, 204);
      }
    }
  }
}).export(module);
