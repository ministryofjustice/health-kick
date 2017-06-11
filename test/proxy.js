const http = require('http');
const express = require('express');

const supertest = require('supertest');

const proxy = require('../proxy');

const proxyApp = express();
proxyApp.use(proxy);
const request = supertest(proxyApp);

describe('request proxying', () => {
  let dummyServer;
  afterEach(() => {
    dummyServer.close();
  });
  describe('http', () => {
    function cannedResponse(statusCode, body) {
      const app = express();
      app.get('/health', (req, res) => {
        res.status(statusCode).json(body);
      });
      dummyServer = http.createServer(app);
      return new Promise((resolve, reject) => {
        dummyServer.listen(() => {
          const port = dummyServer.address().port;
          resolve(`localhost:${port}`);
        });
      });
    }

    it('should proxy a 200', () =>
      cannedResponse(200, {healthy: true})
        .then((target) =>
          request.get(`/http/${target}`)
            .expect(200, {healthy: true})
        )
    );
  });
});
