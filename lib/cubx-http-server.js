'use strict';

const fs = require('fs');
const union = require('union');
const ecstatic = require('ecstatic');
const httpProxy = require('http-proxy');
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const corser = require('corser');
const resolver = require('../lib/cubx-webpackage-resolver');
const storeRemover = require('../lib/cubx-simulated-store-remover');
const url = require('url');
//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
exports.CubxHttpServer = exports.HTTPServer = CubxHttpServer;

/**
 * Returns a new instance of cCbxHttpServer with the
 * specified `options`.
 */
exports.createServer = function (options) {
  return new CubxHttpServer(options);
};

/**
 * Constructor function for the CubxHttpServer object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function CubxHttpServer (options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  } else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    } catch (err) {
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

  const before = options.before ? options.before.slice() : [];

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
    before.push(corser.create(options.corsHeaders ? { requestHeaders: this.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/) } : null));
  }

  if (options.robots) {
    before.push(function (req, res) {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        const robots = options.robots === true
          ? 'User-agent: *\nDisallow: /'
          : options.robots.replace(/\\n/, '\n');

        return res.end(robots);
      }

      res.emit('next');
    });
  }

  // remove simulated store from url path
  before.push(function (req, res) {
    storeRemover.resolve(req, res);
  });

  // resolving local webpackages
  resolver.init(this.root);
  before.push(function (req, res) {
    resolver.resolve(req, res);
  });

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
    if (!options.npu) {
      const npuHttpProxy = process.env.http_proxy || process.env.HTTP_PROXY || null;

      const npuHttpsProxy = process.env.https_proxy || process.env.HTTPS_PROXY || null;

      if (options.proxy.indexOf('https:') === 0 && npuHttpsProxy && !this.isInNoProxyConfig(options.proxy)) {
        options.agent = new HttpsProxyAgent(npuHttpsProxy);
        console.log('use networkProxy:', npuHttpsProxy);
      }

      if (options.proxy.indexOf('http:') === 0 && npuHttpProxy && !this.isInNoProxyConfig(options.proxy)) {
        options.agent = new HttpProxyAgent(npuHttpProxy);
        console.log('use networkProxy:', npuHttpsProxy);
      }
    }

    if (typeof options.npu === 'string') {
      console.log('use networkProxy:', options.npu);
      if (options.proxy.indexOf('https') === 0) {
        options.agent = new HttpsProxyAgent(options.npu);
      } else if (options.proxy.indexOf('http') === 0) {
        options.agent = new HttpProxyAgent(options.npu);
      }
    }

    let proxy;
    if (options.agent) {
      proxy = httpProxy.createProxyServer({ agent: options.agent });
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

  const serverOptions = {
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

CubxHttpServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

CubxHttpServer.prototype.close = function () {
  return this.server.close();
};

CubxHttpServer.prototype.isInNoProxyConfig = function (proxyUrl) {
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || null;

  // easy case first - if NO_PROXY is '*'
  if (noProxy === '*') {
    return true;
  }

  // otherwise, parse the noProxy value to see if it applies to the URL
  if (noProxy !== null) {
    const uri = url.parse(proxyUrl); // eslint-disable-line node/no-deprecated-api
    const parts = uri.hostname.split(':');
    let hostname = parts[0];
    let noProxyItem;
    let port;
    let noProxyItemParts;
    let noProxyHost;
    let noProxyPort;

    // canonicalize the hostname, so that 'oogle.com' won't match 'google.com'
    hostname = hostname.replace(/^\.*/, '.').toLowerCase();
    const noProxyList = noProxy.split(',');

    for (let i = 0, len = noProxyList.length; i < len; i++) {
      noProxyItem = noProxyList[i].trim().toLowerCase();

      // no_proxy can be granular at the port level, which complicates things a bit.
      if (noProxyItem.indexOf(':') > -1) {
        noProxyItemParts = noProxyItem.split(':', 2);
        noProxyHost = noProxyItemParts[0].replace(/^\.*/, '.');
        noProxyPort = noProxyItemParts[1];
        port = uri.port || (uri.protocol === 'https:' ? '443' : '80');

        // we've found a match - ports are same and host ends with no_proxy entry.
        if (port === noProxyPort && hostname.indexOf(noProxyHost) === hostname.length - noProxyHost.length) {
          return true;
        }
      } else {
        noProxyItem = noProxyItem.replace(/^\.*/, '.');
        const isMatchedAt = hostname.indexOf(noProxyItem);
        if (isMatchedAt > -1 && isMatchedAt === hostname.length - noProxyItem.length) {
          return true;
        }
      }
    }
  }
  return false;
};
