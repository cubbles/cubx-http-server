'use strict';
var url = require('url'),
    fs = require('fs'),
    path = require('path');

var cubxWebpackageResolver = {
  webpackages: [],

  init: function (root) {
    this.root = root;
    // collect all directories in root assuming each representing a single webpackage
    var fileNames = fs.readdirSync(root);
    fileNames.forEach(function (fileName) {
      if (fs.lstatSync(path.join(root, fileName)).isDirectory()) {
        this.webpackages.push(fileName);
      }
    }.bind(this));
  },

  resolve: function (req, res) {
    var URL = url.parse(req.request.url);
    // assuming that document root always points to parent directory where all local webpackages reside.
    // for example: http://localhost:8282/[webpackageId]/..
    var webpackageId = URL.pathname.split('/')[1];
    var rewrittenWebpackageId;
    var exists = true;
    var needsRewrite = false;

    // Check if requested webpackgeId exists in root directory -> if yes: res.emit('next')
    // If not remove @[version] from webpackageId  and check again -> if yes: rewrite webpackageId in req.url and res.emit('next')
    // Otherwise just call res.emit('next') and let remoteStore handle request
    try {
      fs.accessSync(path.join(this.root, webpackageId))
    } catch (e) {
      rewrittenWebpackageId = webpackageId.split('@')[0];
      try {
        fs.accessSync(path.join(this.root, rewrittenWebpackageId))
      } catch (e) {
        exists = false;
      } finally {
        needsRewrite = true;
      }
    }

    if (exists && needsRewrite) {
        var rewrite = req.url.replace(webpackageId, rewrittenWebpackageId);
        req.url = rewrite;
    }

    res.emit('next');
  }
};

module.exports = cubxWebpackageResolver;
