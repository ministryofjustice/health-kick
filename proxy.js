const url = require('url')
const express = require('express')
const httpProxy = require('http-proxy')
const convertHrtime = require('./convert-hrtime')

const MAX_RESPONSE_SIZE = 20 * 1024 // 20KB limit for health endpoints

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
  if (protocol !== 'https') {
    return res.status(400).json({error: 'only https protocol is permitted'})
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
  proxy.web(req, res, { target, selfHandleResponse: true })
  proxy.on('proxyRes', (proxyRes) => {
    addDurationHeader()

    // Strip potentially sensitive headers from backend response
    const sensitiveHeaders = [
      'set-cookie', 'cookie', 'authorization', 'x-auth-token', 'x-api-key',
      'x-csrf-token', 'x-forwarded-for', 'x-real-ip', 'server', 'x-powered-by'
    ]
    sensitiveHeaders.forEach(header => delete proxyRes.headers[header])

    // Only allow specific safe headers and Content-Type
    const allowedHeaders = {}
    const safeHeaders = ['content-type', 'content-length', 'cache-control']
    safeHeaders.forEach(header => {
      if (proxyRes.headers[header]) {
        allowedHeaders[header] = proxyRes.headers[header]
      }
    })

    // Validate Content-Type is JSON or plain text (health endpoints should return these)
    const contentType = proxyRes.headers['content-type'] || ''
    if (!contentType.includes('application/json') &&
        !contentType.includes('text/plain') &&
        !contentType.includes('application/vnd.spring-boot.actuator')) {
      proxyRes.destroy()
      if (!res.headersSent) {
        res.status(502).json({error: 'Invalid response type from backend, should be json or plain text'})
      }
      return
    }

    // Limit response size to prevent data exfiltration
    let responseSize = 0
    const chunks = []

    proxyRes.on('data', (chunk) => {
      responseSize += chunk.length
      if (responseSize > MAX_RESPONSE_SIZE) {
        proxyRes.destroy()
        if (!res.headersSent) {
          res.status(502).json({error: 'Response too large'})
        }
        return
      }
      chunks.push(chunk)
    })

    proxyRes.on('end', () => {
      if (!res.headersSent) {
        res.writeHead(proxyRes.statusCode, allowedHeaders)
        res.end(Buffer.concat(chunks))
      }
    })

    proxyRes.on('error', () => {
      if (!res.headersSent) {
        res.status(502).json({error: 'Error reading backend response'})
      }
    })
  })
  proxy.on('error', (err) => {
    addDurationHeader()
    // Don't expose internal error details
    if (!res.headersSent) {
      res.status(504).json({error: 'Gateway timeout'})
    }
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
