function get(name, formatter = (x) => x) {
  if (name in process.env) {
    return formatter(process.env[name]);
  }
  throw new Error(`Missing '${name}' environment variable`);
}

const config = {
  port: process.env.PORT || 3010,
  target_url: get('DASHBOARD_TARGET'),
  target_token: get('DASHBOARD_TOKEN'),
  app_id: get('APPINSIGHTS_APP_ID'),
  api_key: get('APPINSIGHTS_API_KEY'),
  interval: get('APPINSIGHTS_UPDATE_INTERVAL', (x) => Number(x) * 60 * 1000),
  queries: {},
};

const QUERY_PREFIX = 'APPINSIGHTS_QUERY_';
Object
  .keys(process.env)
  .filter((name) => name.startsWith(QUERY_PREFIX))
  .forEach((name) => {
    const queryName = name.slice(QUERY_PREFIX.length);
    config.queries[queryName] = process.env[name];
  });

module.exports = config;
