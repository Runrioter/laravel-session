'use strict';

const Koa = require('koa');
const session = require('..');
const redisStore = require('koa-redis');
const phpserialize = require('php-serialize');

const app = new Koa();

const CONFIG = {
  key: 'hexindai-session', /** (string) cookie key (default is koa:sess) */
  store: redisStore({
    serialize: phpserialize.serialize,
    unserialize: phpserialize.unserialize,
  }),
  expire_on_close: false,
  lifetime: 30, /* minites, the same as maxAge */
  cipherKey: 'base64:PmneUUljyYy+Ynyv9HCIjPvMicZoamVpnSUsf2RtKsE=',
  cipherAlgorithm: 'AES-256-CBC',
  prefix: 'laravel:',
};

app.use(session(app, CONFIG));
// or if you prefer all default config, just use => app.use(session(app));

app.use(ctx => {
  // ignore favicon
  if (ctx.path === '/favicon.ico') return;

  let n = ctx.session.views || 0;
  ctx.session.views = ++n;
  ctx.body = n + ' views';
});

app.listen(3000);
console.log('listening on port 3000');
