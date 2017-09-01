'use strict';

const Koa = require('koa');
const session = require('.');
const MemcachedStore = require('killara-memcached');
const phpserialize = require('php-serialize');

const app = new Koa();

const CONFIG = {
  key: 'hexindai-session', // cookie key
  store: new MemcachedStore({
    serverLocations: '127.0.0.1:11211',
    serialize: phpserialize.serialize,
    unserialize: phpserialize.unserialize,
    reconnect: 5,
    retry: 5,
  }),
  expire_on_close: false,
  lifetime: 30, // minites, the same as maxAge
  cipherKey: 'base64:PmneUUljyYy+Ynyv9HCIjPvMicZoamVpnSUsf2RtKsE=',
  cipherAlgorithm: 'AES-256-CBC',
  prefix: 'laravel:',
};

app.use(session(app, CONFIG));

app.use(ctx => {
  // demo ignore favicon
  if (ctx.path === '/favicon.ico') return;

  let n = ctx.session.hits || 0;
  ctx.session.hits = ++n;
  ctx.body = n + ' hits';
});

app.listen(3000);
console.log('listening on port 3000');
