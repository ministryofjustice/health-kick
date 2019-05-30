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

router.get('/:protocol(http|https)/:host/:probe?', (req, res, next) => {
  const host = req.params.host;
  if (!validDomain(host)) {
    return res.status(502).json({error: 'denied'});
  }

  switch(req.params.probe) {
    case "grafana":
        var path = "/api/health"
        break;
    case "prometheus":
        var path = "/prometheus/-/healthy"
        break;
    case "alertmanager":
        var path = "/alertmanager/-/healthy"
        break;
    default:
        var path = "/health"
  }

  const start = process.hrtime();
  const target = url.format({
    protocol: req.params.protocol,
    host: host,
    pathname: path
  });
  console.log("Proxying request to %s", target);
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
  if (host.endsWith('.noms.dsd.io') || host.endsWith('.hmpps.dsd.io') || host.endsWith('.integration.dsd.io') || host.endsWith('.service.justice.gov.uk')) {
    return true
  } 
}

module.exports = router;
