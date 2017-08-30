# laravel-session

[![npm](https://img.shields.io/npm/v/laravel-session.svg)](https://www.npmjs.com/package/laravel-session)
[![Travis branch](https://img.shields.io/travis/killara/laravel-session/master.svg)](https://travis-ci.org/killara/laravel-session)
[![Codecov branch](https://img.shields.io/codecov/c/github/killara/laravel-session/master.svg)](https://codecov.io/github/killara/laravel-session?branch=master)

:couple: A session middleware to make koa and laravel cooperate with each other.

In order to migrate Laravel(PHP) to Koa(Nodejs) gradually, the most main task is to make Laravel share session management with Koa, so this repository occurs.

## Install

`npm i -S laravel-session`

## Options

- `key` - used as session cookie key
- `store` - a store used to store session. e.g. `koa-redis`
- `expire_on_close` - `true`: when browser closed, session expires, `false`: session expires according `lifetime`
- `lifetime` session lifetime
- `cipherKey` a cipherkey used encode/decode internal session key
- `cipherAlgorithm` a algorithm used in concert with `cipherKey` that encode/decode internal session key
- `prefix` distinguish keys in order to use session store more reasonable

## Example

```javascript

'use strict';

const Koa = require('koa');
const session = require('laravel-session');
const redisStore = require('koa-redis');
const phpserialize = require('php-serialize');

const app = new Koa();

const CONFIG = {
  key: 'hexindai-session', // cookie key
  store: redisStore({
    serialize: phpserialize.serialize,
    unserialize: phpserialize.unserialize,
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

```

## LICENSE

MIT License

Copyright (c) 2017 killara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
