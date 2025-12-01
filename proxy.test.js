const express = require('express')

const nock = require('nock')
const supertest = require('supertest')

const proxy = require('./proxy')

const proxyApp = express()
proxyApp.use(proxy)
const request = supertest(proxyApp)

describe('request proxying', () => {
  beforeAll(() => {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
  })
  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  // Test protocol validation - only HTTPS allowed
  describe('protocol validation', () => {
    it('should reject HTTP protocol', () => {
      return request.get(`/http/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(400, {error: 'only https protocol is permitted'})
    })

    it('should reject other protocols', () => {
      return request.get(`/gopher/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(400, {error: 'only https protocol is permitted'})
    })
  })

  // Test domain validation - only allowed domains
  describe('domain validation', () => {
    it('should reject non hmpps.service.justice.gov.uk domain', () => {
      return request.get(`/https/status.github.com`)
        .expect(502, {error: 'denied'})
    })
  })

  // Test successful proxying of various response codes
  describe('successful proxying', () => {
    it('should proxy a 200 response', () => {
      nock('https://app-dev.hmpps.service.justice.gov.uk')
        .get('/health').reply(200, {healthy: true})

      return request.get(`/https/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(200, {healthy: true})
    })

    it('should proxy a 302 response but strip sensitive headers', async () => {
      nock('https://app-stage.hmpps.service.justice.gov.uk')
        .get('/health').reply(302, null, {
          Location: '/somewhere'
        })

      const response = await request.get(`/https/app-stage.hmpps.service.justice.gov.uk/health`)

      expect(response.status).toEqual(302)
      // Location header should be stripped as it's not in the allowlist
      expect(response.header.location).toBeUndefined()
    })

    it('should proxy a 404 response', () => {
      nock('https://app.service.hmpps.service.justice.gov.uk')
        .get('/health').reply(404, {error: 'notfound'})

      return request.get(`/https/app.service.hmpps.service.justice.gov.uk/health`)
        .expect(404, {error: 'notfound'})
    })

    it('should proxy a 500 response', () => {
      nock('https://something.hmpps.service.justice.gov.uk')
        .get('/health').reply(500, {error: 'it broke'})

      return request.get(`/https/something.hmpps.service.justice.gov.uk/health`)
        .expect(500, {error: 'it broke'})
    })
  })

  // Test error handling
  describe('error handling', () => {
    it('should return 504 if backend is not reachable', () => {
      nock('https://useful-app.hmpps.service.justice.gov.uk')
        .get('/health').replyWithError('connection failed')

      return request.get(`/https/useful-app.hmpps.service.justice.gov.uk/health`)
        .expect(504, {error: 'Gateway timeout'})
    })

    it('should reject response exceeding size limit', () => {
      // Create a response larger than MAX_RESPONSE_SIZE (10KB)
      const largeResponse = {data: 'x'.repeat(11 * 1024)}
      
      nock('https://large-response.hmpps.service.justice.gov.uk')
        .get('/health').reply(200, largeResponse)

      return request.get(`/https/large-response.hmpps.service.justice.gov.uk/health`)
        .expect(502, {error: 'Response too large'})
    })
  })
})
