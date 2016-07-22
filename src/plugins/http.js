const is = require('is');

function validateConfig(config, validator) {
  if (is.fn(validator)) {
    const isServerConfigValid = validator('http', config);

    if (isServerConfigValid.error) {
      throw isServerConfigValid.error;
    }

    if (config.server.handlerConfig) {
      const validatorName = `http.${config.server.handler}`;
      const isHandlerConfigValid = validator(validatorName, config.server.handlerConfig);

      if (isHandlerConfigValid.error) {
        throw isHandlerConfigValid.error;
      }
    }
  }
}

function createHttpServer(config) {
  validateConfig(config, this.validateSync);
  const handler = require(`./http/handlers/${config.server.handler}`);
  return handler(config, this);
}

module.exports = {
  name: 'http',
  attach: createHttpServer,
};