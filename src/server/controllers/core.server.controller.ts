'use strict';

/**
 * Render the main application page
 */
export function renderIndex(req, res) {
  res.render('src/server/views/index', {});
};

/**
 * Render the server error page
 */
export function renderServerError (req, res) {
  res.status(500).render('src/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
export function renderNotFound (req, res) {
  res.status(404).format({
    'text/html': function () {
      res.render('src/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};

