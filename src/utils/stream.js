/**
 * @deprecated Use response-controller.js instead
 * Legacy module that redirects to the new implementation
 */
const { createResponseStream } = require('./response-controller');

module.exports = {
  createResponseStream
};