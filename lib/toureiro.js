const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const redis = require('./redis');
const slashes = require('connect-slashes');

module.exports = config => {

  config = config || {};

  redis.init(config.redis || {});

  const app = express();

  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.set('views', path.join(__dirname, '../views/templates'));
  app.set('view engine', 'pug');

  let staticPath = '../public';
  if (config.development) {
    staticPath = '../public/dev';
  }
  app.use('/static', express.static(path.join(__dirname, staticPath)));

  app.use(slashes());

  app.all('/', (req, res) => {
    res.render('index');
  });
  app.use('/queue', require('./routes/queue'));
  app.use('/job', require('./routes/job'));

  app.use('*', (req, res) => {
    // Catch all
    res.sendStatus(404);
  });

  return app;

};
