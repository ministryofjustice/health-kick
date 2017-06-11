function get(name, formatter = (x) => x) {
  if (name in process.env) {
    return formatter(process.env[name]);
  }
  throw new Error(`Missing '${name}' environment variable`);
}

const config = {
  port: process.env.PORT || 3003,
};

module.exports = config;
