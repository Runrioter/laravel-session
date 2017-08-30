'use strict';

const memcached = require('koa-memcached');

const getSessionStore = driver => {
  switch (driver) {
    case 'memcached':
      return memcached;
    default:
      throw new Error('Unsupported session store driver');
  }
};

module.exports = getSessionStore;
