/**
 * Use in cubx-htttp-server as a before task.
 * Remove the the store 'localstore' from the path.
 */
'use strict';
const url = require('url');
const simulatedStoreRemover = {
  resolve: function (req, res) {
    const currentUrl = url.parse(req.url);// eslint-disable-line node/no-deprecated-api
    if (currentUrl.pathname.indexOf('/localstore') > -1) {
      let rewrite = req.url.replace('/localstore', '');
      rewrite = rewrite.length === 0 ? '/' : rewrite; // if rewrite === '' than correct to '/'
      req.url = rewrite;
    }

    res.emit('next');
  }
};

module.exports = simulatedStoreRemover;
