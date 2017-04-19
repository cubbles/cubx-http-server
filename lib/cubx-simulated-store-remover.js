/**
 * Use in cubx-htttp-server as a before task.
 * Remove the the store 'localstore' from the path.
 */
'use strict';
var url = require('url');

var simulatedStoreRemover = {
  resolve: function (req, res) {
    var currentUrl = url.parse(req.request.url);
    if (currentUrl.pathname.indexOf('/localstore') > -1) {
      var rewrite = req.url.replace('/localstore', '');
      rewrite = rewrite.length === 0 ? '/' : rewrite; // if rewrite === '' than correct to '/'
      req.url = rewrite;
    }

    res.emit('next');
  }
};

module.exports = simulatedStoreRemover;
