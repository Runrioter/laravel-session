'use strict';

const crc = require('crc').crc32;

module.exports = {

  base64Encode(str) {
    return Buffer.from(str, 'utf8').toString('base64');
  },

  base64Decode(str) {
    return Buffer.from(str, 'base64').toString('utf8');
  },

  /**
   * Decode the base64 cookie value to an object.
   *
   * @param {String} string
   * @return {Object}
   * @api private
   */

  decode(string) {
    const body = this.base64Decode(string);
    const json = JSON.parse(body);
    return json;
  },

  /**
   * Encode an object into a base64-encoded JSON string.
   *
   * @param {Object} body
   * @return {String}
   * @api private
   */

  encode(body) {
    body = JSON.stringify(body);
    return this.base64Encode(body);
  },

  hash(sess) {
    return crc(JSON.stringify(sess));
  },
};
