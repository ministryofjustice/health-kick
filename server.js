var express = require('express');
var morgan = require('morgan');

var config = require('./config');
var updater = require('./updater')(config);

var app = express();

app.use(morgan('short'));

app.get('/last-updated', (req, res) => {
  res.json({at: updater.getLastUpdated()});
});

app.use((req, res) => {
  res.status = 404;
  res.json({error: "not-found"});
});

// start the app
updater.start();
app.listen(config.port, () => {
  console.log('Listening on port %s', config.port);
});
