# Azure App Insights Stats Exposer

### Setup

 * NodeJS 6+
 * Yarn 0.23.4+
 * `yarn install`

### Config

* `DASHBOARD_TARGET` Root URL of the smashing instance to POST to
* `APPINSIGHTS_APP_ID` App ID from the application insights API access blade
* `APPINSIGHTS_API_KEY` API Key rom the application insights API access blade
* `APPINSIGHTS_UPDATE_INTERVAL` Time in minutes between updating the stats

Further config is then needed to specify the queries that will be run.

You can set multiple variables with names of the form `APPINSIGHTS_QUERY_xxxxxxx` and values as a query which returns a table where the first column is a `key` and the second column is a value. These results will be POSTed to smashing widgets named `xxxxxxx_key`.

### License

MIT
