'use strict';

var fs = require('fs'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy'),
    httpProxyAgent  = require('http-proxy-agent'),
    httpsProxyAgent  = require('https-proxy-agent'),
    corser = require('corser');

//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
exports.cubxHttpServer = exports.HTTPServer = cubxHttpServer;

/**
 * Returns a new instance of cubxHttpServer with the
 * specified `options`.
 */
exports.createServer = function (options) {
  return new cubxHttpServer(options);
};

/**
 * Constructor function for the cubxHttpServer object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function cubxHttpServer(options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    }
    catch (err) {
      this.root = './';
    }
  }

  this.headers = options.headers || {};

  this.cache = options.cache === undefined ? 3600 : options.cache; // in seconds.
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';
  this.contentType = options.contentType || 'application/octet-stream';

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  var before = options.before ? options.before.slice() : [];

  before.push(function (req, res) {
    if (options.logFn) {
      options.logFn(req, res);
    }

    res.emit('next');
  });

  if (options.cors) {
    this.headers['Access-Control-Allow-Origin'] = '*';
    this.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
          .forEach(function (h) { this.headers['Access-Control-Allow-Headers'] += ', ' + h; }, this);
    }
    before.push(corser.create(options.corsHeaders ? {
      requestHeaders: this.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
    } : null));
  }

  if (options.robots) {
    before.push(function (req, res) {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        var robots = options.robots === true
          ? 'User-agent: *\nDisallow: /'
          : options.robots.replace(/\\n/, '\n');

        return res.end(robots);
      }

      res.emit('next');
    });
  }

  before.push(ecstatic({
    root: this.root,
    cache: this.cache,
    showDir: this.showDir,
    autoIndex: this.autoIndex,
    defaultExt: this.ext,
    contentType: this.contentType,
    handleError: typeof options.proxy !== 'string'
  }));

  if (typeof options.proxy === 'string') {
    if(typeof options.npu === 'string') {
      if (options.proxy.indexOf('https') === 0) {
        options.agent = new httpsProxyAgent(options.npu);
      } else if (options.proxy.indexOf('http') === 0) {
        options.agent = new httpProxyAgent(options.npu);
      }
    }

    var proxy;
    if (options.agent) {
      proxy = httpProxy.createProxyServer({agent: options.agent});
    } else {
      proxy = httpProxy.createProxyServer({});
    }
    before.push(function (req, res) {
      proxy.web(req, res, {
        target: options.proxy,
        changeOrigin: true
      });
    });
  }

  var serverOptions = {
    before: before,
    headers: this.headers,
    onError: function (err, req, res) {
      if (options.logFn) {
        options.logFn(req, res, err);
      }

      res.end();
    }
  };

  if (options.https) {
    serverOptions.https = options.https;
  }

  this.server = union.createServer(serverOptions);
}

cubxHttpServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

cubxHttpServer.prototype.close = function () {
  return this.server.close();
};