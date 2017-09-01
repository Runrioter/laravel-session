'use strict';

const debug = require('debug')('lavavel-session');
const ContextSession = require('./lib/context');
const util = require('./lib/util');
const assert = require('assert');
const rchars = require('rchars');
const is = require('is-type-of');

const CONTEXT_SESSION = Symbol('@@contextSession');
const _CONTEXT_SESSION = Symbol('@@_contextSession');

module.exports = (app, opts) => {
  if (!app || typeof app.use !== 'function') {
    throw new TypeError('koa app instance required: `session(app, opts)`');
  }
  opts = opts || {};
  const nopts = {};
  assert(opts.cipherKey, 'Option `cipherKey` should be the `key` in config/app.php or your .env file');
  nopts.cipherKey = opts.cipherKey;
  assert(opts.cipherAlgorithm, 'Option `cipherAlgorithm` should be the `cipher` in config/app.php or your .env file');
  nopts.cipherAlgorithm = opts.cipherAlgorithm;

  nopts.key = opts.key || 'killara-session';
  nopts.expire_on_close = opts.expire_on_close || false;
  nopts.lifetime = opts.lifetime || 1440; // (minites)one day
  nopts.overwrite = opts.overwrite || true;
  nopts.httpOnly = opts.httpOnly || true;
  nopts.signed = false; // unnecessary support `sigined`
  nopts.rolling = opts.rolling || true;

  if (opts.expire_on_close) {
    nopts.maxAge = 'session';
  } else {
    assert(typeof opts.lifetime === 'number', 'Option `lifetime` should a number in minite unit');
    nopts.maxAge = opts.lifetime * 60 * 1000;
  }

  debug('session options %j', nopts);

  // setup encoding/decoding
  if (typeof opts.encode !== 'function') {
    nopts.encode = util.encode;
  }
  if (typeof opts.decode !== 'function') {
    nopts.decode = util.decode;
  }

  if (typeof opts.genid !== 'function') {
    nopts.genid = () => ((opts.prefix || '') + rchars.randomSafeSync(40));
  }

  const store = opts.store;
  if (store) {
    assert(is.function(store.get), 'store.get must be function');
    assert(is.function(store.set), 'store.set must be function');
    assert(is.function(store.destroy), 'store.destroy must be function');
    nopts.store = store;
  }

  const ContextStore = opts.ContextStore;
  if (ContextStore) {
    assert(is.class(ContextStore), 'ContextStore must be a class');
    assert(is.function(ContextStore.prototype.get), 'ContextStore.prototype.get must be function');
    assert(is.function(ContextStore.prototype.set), 'ContextStore.prototype.set must be function');
    assert(is.function(ContextStore.prototype.destroy), 'ContextStore.prototype.destroy must be function');
    nopts.ContextStore = ContextStore;
  }

  extendContext(app.context, nopts);

  return async function session(ctx, next) {
    const sess = ctx[CONTEXT_SESSION];
    if (sess.store) await sess.initFromExternal();
    try {
      await next();
    } catch (err) {
      throw err;
    } finally {
      await sess.commit();
    }
  };
};

/**
 * extend context prototype, add session properties
 *
 * @param  {Object} context koa's context prototype
 * @param  {Object} opts session options
 *
 * @api private
 */

function extendContext(context, opts) {
  Object.defineProperties(context, {
    [CONTEXT_SESSION]: {
      get() {
        if (this[_CONTEXT_SESSION]) return this[_CONTEXT_SESSION];
        this[_CONTEXT_SESSION] = new ContextSession(this, opts);
        return this[_CONTEXT_SESSION];
      },
    },
    session: {
      get() {
        return this[CONTEXT_SESSION].get();
      },
      set(val) {
        this[CONTEXT_SESSION].set(val);
      },
      configurable: true,
    },
    sessionOptions: {
      get() {
        return this[CONTEXT_SESSION].opts;
      },
    },
  });
}
