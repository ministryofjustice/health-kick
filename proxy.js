const url = require('url');
const express = require('express');
const request = require('superagent');

const router = express.Router();

router.get('/:protocol(http|https)/:host', (req, res, next) => {
  const host = req.params.host;
  if (!validDomain(host)) {
    return res.status(502).json({error: 'denied'});
  }

  const target = url.format({
    protocol: req.params.protocol,
    host: host,
    pathname: '/health'
  });
  // console.log("Proxying request to %s", target);
  request.get(target)
    .timeout(3000)
    .redirects(0)
    .ok(() => true)
    .then(
      (healthRes) => res
        .status(healthRes.status)
        .set(extractRelevantHeaders(healthRes))
        .json(healthRes.body),
      (err) => res.status(504).json({error: err.message})
    );
});

function validDomain(host) {
  return host.endsWith('.hmpps.dsd.io');
}

const ignoredHeaders = [];
function extractRelevantHeaders(response) {
  const extracted = {};
  Object.keys(response.header).forEach((header) => {
    if (!ignoredHeaders.includes(header)) {
      extracted[header] = response.header[header];
    }
  });
  return extracted;
}

module.exports = router;
