# Health Kick

Highly specific HTTP proxy for exposing health endpoints that live behind firewalls.

### Setup

 * NodeJS 12+
 * `npm install`

### Config

* `PORT` Where to listen

### Usage

`GET /http/<domain>`
Will make a request to `http://<domain>/health` and proxy the response

`GET /https/<domain>`
Will make a request to `https://<domain>/health` and proxy the response

### License

MIT
