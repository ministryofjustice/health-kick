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

  describe('http', () => {
    it('should proxy a 200', () => {
      nock('http://app-dev.hmpps.service.justice.gov.uk')
        .get('/health').reply(200, {healthy: true})

      return request.get(`/http/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(200, {healthy: true})
    })
    it('should proxy a 302 with headers', () => {
      nock('http://app-stage.hmpps.service.justice.gov.uk')
        .get('/health').reply(302, null, {
          Location: '/somewhere'
        })

      return request.get(`/http/app-stage.hmpps.service.justice.gov.uk/health`)
        .expect(302)
        .expect('Location', '/somewhere')
    })
    it('should proxy a 404', () => {
      nock('http://app.hmpps.service.justice.gov.uk')
        .get('/health').reply(404, {error: 'notfound'})

      return request.get(`/http/app.hmpps.service.justice.gov.uk/health`)
        .expect(404, {error: 'notfound'})
    })
    it('should proxy a 500', () => {
      nock('http://something.hmpps.service.justice.gov.uk')
        .get('/health').reply(500, {error: 'it broke'})

      return request.get(`/http/something.hmpps.service.justice.gov.uk/health`)
        .expect(500, {error: 'it broke'})
    })
    it('should reject non hmpps.service.justice.gov.uk domain', () => {
      return request.get(`/http/status.github.com`)
        .expect(502, {error: 'denied'})
    })
    it('should 504 if backend isn\'t reachable', () => {
      nock('http://useful-app.hmpps.service.justice.gov.uk')
        .get('/health').replyWithError('connection failed')

      return request.get(`/http/useful-app.hmpps.service.justice.gov.uk/health`)
        .expect(504, {error: 'connection failed'})
    })
  })

  describe('https', () => {
    it('should proxy a 200', () => {
      nock('https://app-dev.hmpps.service.justice.gov.uk')
        .get('/health').reply(200, {healthy: true})

      return request.get(`/https/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(200, {healthy: true})
    })
    it('should proxy a 302 with headers', async () => {
      nock('https://app-stage.hmpps.service.justice.gov.uk')
        .get('/health').reply(302, null, {
          Location: '/somewhere'
        })

      const response = await request.get(`/https/app-stage.hmpps.service.justice.gov.uk/health`)

      expect(response.status).toEqual(302)
      expect(response.header.location).toEqual('/somewhere')
    })
    it('should proxy a 404', () => {
      nock('https://app.service.hmpps.service.justice.gov.uk')
        .get('/health').reply(404, {error: 'notfound'})

      return request.get(`/https/app.service.hmpps.service.justice.gov.uk/health`)
        .expect(404, {error: 'notfound'})
    })
    it('should proxy a 500', () => {
      nock('https://something.hmpps.service.justice.gov.uk')
        .get('/health').reply(500, {error: 'it broke'})

      return request.get(`/https/something.hmpps.service.justice.gov.uk/health`)
        .expect(500, {error: 'it broke'})
    })
    it('should reject non hmpps.service.justice.gov.uk domain', () => {
      return request.get(`/https/status.github.com`)
        .expect(502, {error: 'denied'})
    })
    it('should 504 if backend isn\'t reachable', () => {
      nock('https://useful-app.hmpps.service.justice.gov.uk')
        .get('/health').replyWithError('connection failed')

      return request.get(`/https/useful-app.hmpps.service.justice.gov.uk/health`)
        .expect(504, {error: 'connection failed'})
    })
  })

  describe('other protocols', () => {
    it('shouldn\'t allow other protocols', () => {
      return request.get(`/gopher/app-dev.hmpps.service.justice.gov.uk/health`)
        .expect(404)
    })
  })
})
