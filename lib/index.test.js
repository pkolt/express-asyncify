/* node:coverage disable */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import asyncify from './index.js';

const getDataAsync = (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      (data instanceof Error ? reject : resolve)(data);
    }, 0);
  });
};

const handler500 = (err, req, res, next) => {
  res.status(500).send('fail');
};

test('sync request', async () => {
  const app = asyncify(express());

  app.get('/', (req, res) => {
    res.send('ok');
  });

  const res = await request(app).get('/').expect(200);
  assert.equal(res.text, 'ok');
});

test('catch error to sync request', async () => {
  const app = asyncify(express());

  app.get('/', async (req, res) => {
    throw new Error();
  });

  app.use(handler500);

  const res = await request(app).get('/').expect(500);
  assert.equal(res.text, 'fail');
});

test('async request', async () => {
  const app = asyncify(express());

  app.get('/', async (req, res) => {
    const data = await getDataAsync('ok');
    res.send(data);
  });

  const res = await request(app).get('/').expect(200);
  assert.equal(res.text, 'ok');
});

test('catch error to async request', async () => {
  const app = asyncify(express());

  app.get('/', async (req, res) => {
    const data = await getDataAsync(new Error());
    res.send(data);
  });

  app.use(handler500);

  const res = await request(app).get('/').expect(500);
  assert.equal(res.text, 'fail');
});

test('catch error to async/sync middleware', async () => {
  const app = asyncify(express());

  const asyncMiddleware = async (req, res, next) => {
    await getDataAsync(new Error());
    next();
  };

  const syncMiddleware = function (req, res, next) {
    next();
  };

  app.use(asyncMiddleware, syncMiddleware, handler500);

  app.get('/', (req, res) => {
    res.send('ok');
  });

  const res = await request(app).get('/').expect(500);
  assert.equal(res.text, 'fail');
});

test('catch error to async/sync middleware as array', async () => {
  const app = asyncify(express());

  const asyncMiddleware = async (req, res, next) => {
    await getDataAsync(new Error());
    next();
  };

  const syncMiddleware = function (req, res, next) {
    next();
  };

  app.use([asyncMiddleware, syncMiddleware], handler500);

  app.get('/', (req, res) => {
    res.send('ok');
  });

  const res = await request(app).get('/').expect(500);
  assert.equal(res.text, 'fail');
});

test('catch error to app.all()', async () => {
  const app = asyncify(express());

  app.all('/', async (req, res) => {
    const data = await getDataAsync(new Error());
    res.send(data);
  });

  app.use(handler500);

  const resGet = await request(app).get('/').expect(500);
  assert.equal(resGet.text, 'fail');

  const resPost = await request(app).post('/').expect(500);
  assert.equal(resPost.text, 'fail');

  const resPut = await request(app).put('/').expect(500);
  assert.equal(resPut.text, 'fail');

  const resDel = await request(app).del('/').expect(500);
  assert.equal(resDel.text, 'fail');
});

test('catch error to app.route()', async () => {
  const app = asyncify(express());

  app.route('/posts').get(async (req, res) => {
    const data = await getDataAsync(new Error());
    res.send(data);
  });

  app.use(handler500);

  const res = await request(app).get('/posts').expect(500);
  assert.equal(res.text, 'fail');
});

test('catch error to router', async () => {
  const app = express();
  const router = asyncify(express.Router());

  router.get('/', async (req, res) => {
    const data = await getDataAsync(new Error());
    res.send(data);
  });

  app.use(router);
  app.use(handler500);

  const res = await request(app).get('/').expect(500);
  assert.equal(res.text, 'fail');
});
