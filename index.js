'use strict';

const debug = require('debug')('koa-session');
const ContextSession = require('./lib/context');
const util = require('./lib/util');
const assert = require('assert');
const uid = require('uid-safe');
const is = require('is-type-of');

const CONTEXT_SESSION = Symbol('@@contextSession');
const _CONTEXT_SESSION = Symbol('@@_contextSession');

module.exports = (app, opts) => {
  if (!app || typeof app.use !== 'function') {
    throw new TypeError('app instance required: `session(app, opts)`');
  }
  opts = opts || {};
  opts.key = opts.key || 'killara-session';
  opts.expire_on_close = opts.expire_on_close || false;
  opts.lifetime = opts.lifetime || 24 * 60; // (minites)one day

  const formatedOpts = {
    key: opts.key,
    store: opts.store,
    overwrite: true,
    httpOnly: true,
    signed: false,
    rolling: true,
  };

  if (!opts.cipherKey || !opts.cipherAlgorithm) {
    throw new Error('Both cipherKey and cipherAlgorithm required');
  } else {
    formatedOpts.cipherKey = opts.cipherKey;
    formatedOpts.cipherAlgorithm = opts.cipherAlgorithm;
  }

  if (opts.expire_on_close) {
    formatedOpts.maxAge = 'session';
  } else {
    formatedOpts.maxAge = opts.lifetime * 60 * 1000;
  }

  // setup encoding/decoding
  if (typeof formatedOpts.encode !== 'function') {
    formatedOpts.encode = util.encode;
  }
  if (typeof formatedOpts.decode !== 'function') {
    formatedOpts.decode = util.decode;
  }

  const store = formatedOpts.store;
  if (store) {
    assert(is.function(store.get), 'store.get must be function');
    assert(is.function(store.set), 'store.set must be function');
    assert(is.function(store.destroy), 'store.destroy must be function');
  }

  const ContextStore = formatedOpts.ContextStore;
  if (ContextStore) {
    assert(is.class(ContextStore), 'ContextStore must be a class');
    assert(is.function(ContextStore.prototype.get), 'ContextStore.prototype.get must be function');
    assert(is.function(ContextStore.prototype.set), 'ContextStore.prototype.set must be function');
    assert(is.function(ContextStore.prototype.destroy), 'ContextStore.prototype.destroy must be function');
  }

  if (!formatedOpts.genid) {
    if (formatedOpts.prefix) formatedOpts.genid = () => formatedOpts.prefix + uid.sync(24);
    else formatedOpts.genid = () => uid.sync(24);
  }

  debug('session options %j', formatedOpts);

  extendContext(app.context, formatedOpts);
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
