const express = require('express');
const morgan = require('morgan');

const request = require('superagent');

const config = require('./config');

const app = express();

app.set('json spaces', 2);

app.use(morgan('short'));

app.get('/health', (req, res) => {
  res.json({healthy: true});
});

app.get('/ip', (req, res, next) => {
  request.get('http://icanhazip.com')
    .then(
      (ipResp) => res.json({ip: ipResp.text.trim()}),
      (err) => next(err)
    );
});

app.use(require('./proxy'));

app.use((req, res) => {
  res.status = 404;
  res.json({error: "not-found"});
});

app.listen(config.port, () => {
  console.log('Listening on port %s', config.port);
});
