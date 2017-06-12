const url = require('url');
const express = require('express');
const httpProxy = require('http-proxy');
const convertHrtime = require('convert-hrtime');

const proxySettings = {
  secure: true,
  xfwd: true,
  ignorePath: true,
  changeOrigin: true,
  proxyTimeout: 3000,
};

const router = express.Router();

router.get('/:protocol(http|https)/:host', (req, res, next) => {
  const host = req.params.host;
  if (!validDomain(host)) {
    return res.status(502).json({error: 'denied'});
  }

  const start = process.hrtime();
  const target = url.format({
    protocol: req.params.protocol,
    host: host,
    pathname: '/health'
  });
  // console.log("Proxying request to %s", target);
  const proxy = httpProxy.createProxyServer(proxySettings);
  proxy.web(req, res, { target });
  proxy.on('proxyRes', () => {
    addDurationHeader();
  });
  proxy.on('error', (err) => {
    addDurationHeader();
    res.status(504);
    res.json({error: err.message});
  });
  function addDurationHeader() {
    const duration = convertHrtime(process.hrtime(start)).milliseconds;
    res.set('X-Health-Duration', String(duration));
  }
});

function validDomain(host) {
  return host.endsWith('.hmpps.dsd.io');
}

module.exports = router;
