'use strict';

const base64 = require('./base64');
const crypto = require('crypto');
const phpserialize = require('php-serialize');
const config = require('../config');

class Encrypter {

  constructor(options) {
    options = options || {};
    if (!options.key || !options.cipher) {
      throw new Error('Encrypter need `key` and `cipher` options to encrypt or decrypt');
    }
    if (options.key.indexOf('base64:') === 0) {
      options.key = options.key.slice(7);
    }
    const key = Buffer.from(options.key, 'base64');
    if (this.constructor.support(key, options.cipher)) {
      this.key = key;
      this.cipher = options.cipher;
    } else {
      throw new Error('Cipher algorithms can\'t match the key length correctly.');
    }
  }

  static support(key, cipher) {
    const keyLen = key.length;
    return (cipher === 'AES-128-CBC' && keyLen === 16) ||
           (cipher === 'AES-256-CBC' && keyLen === 32);
  }

  /**
   * decrypt cookie value
   * 
   * @param {String} value the value from cookie
   * @param {Bool} isUnserialize if need unserialize
   * 
   * @return {String} the decrypted value
   * @api public
   */
  decrypt(value, isUnserialize = true) {
    const payload = this.getJsonPayload(value);
    if (payload === null) {
      return '';
    }
    const iv = Buffer.from(payload.iv, 'base64');
    const decipher = crypto.createDecipheriv(this.cipher, this.key, iv);
    let decrypted = decipher.update(payload.value, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return isUnserialize ? phpserialize.unserialize(decrypted) : decrypted;
  }

  getJsonPayload(payload) {
    try {
      const payloadObject = JSON.parse(base64.decode(payload));
      if (payloadObject.iv && payloadObject.value && payloadObject.mac && this.validMac(payloadObject)) {
        return payloadObject;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  encrypt(value, isSerialize = true) {
    value = isSerialize ? phpserialize.serialize(value) : value;
    let iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.cipher, this.key, iv);
    value = cipher.update(value, 'utf8', 'base64');
    value += cipher.final('base64');

    iv = iv.toString('base64');

    const mac = this.hash(iv, value);

    const json = JSON.stringify({
      iv,
      value,
      mac,
    });
    return base64.encode(json);
  }

  validMac(payload) {
    const bytes = crypto.randomBytes(16);
    const generatedMac = this.calculateMac(payload, bytes);
    return this.hashHmac('sha256', Buffer.from(payload.mac, 'hex').toString('base64'), bytes) === generatedMac;
  }

  calculateMac(payload, bytes) {
    return this.hashHmac('sha256', Buffer.from(this.hash(payload.iv, payload.value), 'hex').toString('base64'), bytes);
  }

  hash(iv, value) {
    return this.hashHmac('sha256', iv + value, this.key);
  }

  hashHmac(algo, value, key) {
    const hmac = crypto.createHmac(algo, key);
    hmac.update(value);
    return hmac.digest('hex');
  }
}

const encrypter = new Encrypter(config);

module.exports = encrypter;
