const url = require('url')
const express = require('express')
const httpProxy = require('http-proxy')
const convertHrtime = require('./convert-hrtime')

const proxySettings = {
  secure: true,
  xfwd: true,
  ignorePath: true,
  changeOrigin: true,
  proxyTimeout: 3000,
}

const router = express.Router()

router.get(['/:protocol/:host', '/:protocol/:host/:probe'], (req, res) => {
  const protocol = req.params.protocol
  if (protocol !== 'http' && protocol !== 'https') {
    return res.status(404).json({error: 'not found'})
  }

  const host = req.params.host
  if (!validDomain(host)) {
    return res.status(502).json({error: 'denied'})
  }

  const probe = req.params.probe
  let path

  if (probe === 'info') {
    path = "/info"
  } else if (probe === 'health') {
    path = "/health"
  } else if (probe === 'auth-health') {
    path = "/auth/health"
  } else if (probe === 'auth-info') {
    path = "/auth/info"
  } else if (probe === "" || probe === undefined) {
    path = "/health"
  } else {
    return res.status(502).json({error: 'invalid probe path'})
  }

  const start = process.hrtime.bigint()
  const target = url.format({
    protocol: req.params.protocol,
    host: host,
    pathname: path
  })
  console.log("Proxying request to %s", target)
  const proxy = httpProxy.createProxyServer(proxySettings)
  proxy.web(req, res, { target })
  proxy.on('proxyRes', () => {
    addDurationHeader()
  })
  proxy.on('error', (err) => {
    addDurationHeader()
    res.status(504).json({error: err.message})
  })
  function addDurationHeader() {
    const duration = convertHrtime(process.hrtime.bigint() - start).milliseconds
    res.set('X-Health-Duration', String(duration))
  }
})

function validDomain(host) {
  return (host.endsWith('.svc.cluster.local') || host.endsWith('service.justice.gov.uk')) && /[a-z0-9-.]+/.test(host)
}

module.exports = router
