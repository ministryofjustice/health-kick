const request = require('superagent');

const INSIGHTS_BASE = 'https://api.applicationinsights.io/beta';

module.exports = (config) => {
  let lastUpdated = null;

  function start() {
    performUpdate();
  }

  function getLastUpdated() {
    return lastUpdated;
  }

  function performUpdate() {
    Promise.all(
      Object.keys(config.queries).map((queryName) =>
        queryAppInsights(queryName, config.queries[queryName])
        .then((response) => extractFirstTable(queryName, response))
        .then((rows) => pushRowsToSmashing(queryName, rows))
      )
    )
      .then(
        (stuff) => { console.log("Updates completed"); },
        (err) => { console.log("Updates errored: %s", err); }
      )
      .then(() => {
        lastUpdated = new Date();
        console.log("Scheduling next update in %sms", config.interval);
        setTimeout(performUpdate, config.interval);
      });
  }

  function queryAppInsights(queryName, query) {
    console.log("Requesting data for %s", queryName);
    return request
      .get(INSIGHTS_BASE + `/apps/${config.app_id}/query`)
      .set('x-api-key', config.api_key)
      .query({query: query});
  }

  function extractFirstTable(queryName, aiResponse) {
    try {
      return aiResponse.body.Tables[0].Rows;
    } catch (ex) {
      console.log("Failed to extract table for %s: %s", queryName, ex);
      return [];
    }
  }

  function pushRowsToSmashing(queryName, rows) {
    return Promise.all(
      rows.map((row) => pushDataToSmashing(queryName, ...row))
    );
  }

  function pushDataToSmashing(queryName, field, value) {
    const url = `${config.target_url}/widgets/ai-${queryName}-${field}`;
    console.log("Setting %s to %s", url, value);
    return request.post(url)
      .send({auth_token: config.target_token, current: value });
  }

  return { start, getLastUpdated };
};

const flatMap = (xs, f) => xs.map(f).reduce((x, y) => x.concat(y), []);
