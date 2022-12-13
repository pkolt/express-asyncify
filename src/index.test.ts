import assert from 'assert';
import request from 'supertest-as-promised';
import express, { Request, Response, NextFunction } from 'express';
import asyncify from './';

const getDataAsync = (data: string | Error) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      (data instanceof Error ? reject : resolve)(data);
    }, 0);
  });
};

const handler500 = (err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send('fail');
};

describe('asyncify', () => {
  it('sync request', async () => {
    const app = asyncify(express());

    app.get('/', (req: Request, res: Response) => {
      res.send('ok');
    });

    const res = await request(app).get('/').expect(200);
    assert.equal(res.text, 'ok');
  });

  it('catch error to sync request', async () => {
    const app = asyncify(express());

    app.get('/', (req: Request, res: Response) => {
      throw new Error();
    });

    app.use(handler500);

    const res = await request(app).get('/').expect(500);
    assert.equal(res.text, 'fail');
  });

  it('async request', async () => {
    const app = asyncify(express());

    app.get('/', async (req: Request, res: Response) => {
      const data = await getDataAsync('ok');
      res.send(data);
    });

    const res = await request(app).get('/').expect(200);
    assert.equal(res.text, 'ok');
  });

  it('catch error to async request', async () => {
    const app = asyncify(express());

    app.get('/', async (req: Request, res: Response) => {
      const data = await getDataAsync(new Error());
      res.send(data);
    });

    app.use(handler500);

    const res = await request(app).get('/').expect(500);
    assert.equal(res.text, 'fail');
  });

  it('catch error to async/sync middleware', async () => {
    const app = asyncify(express());

    const asyncMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      const data = await getDataAsync(new Error());
      next();
    };

    const syncMiddleware = function (req: Request, res: Response, next: NextFunction) {
      next();
    };

    app.use(asyncMiddleware, syncMiddleware, handler500);

    app.get('/', (req: Request, res: Response) => {
      res.send('ok');
    });

    const res = await request(app).get('/').expect(500);
    assert.equal(res.text, 'fail');
  });

  it('catch error to app.all()', async () => {
    const app = asyncify(express());

    app.all('/', async (req: Request, res: Response) => {
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

  it('catch error to app.route()', async () => {
    const app = asyncify(express());

    app.route('/posts').get(async (req: Request, res: Response) => {
      const data = await getDataAsync(new Error());
      res.send(data);
    });

    app.use(handler500);

    const res = await request(app).get('/posts').expect(500);
    assert.equal(res.text, 'fail');
  });

  it('catch error to router', async () => {
    const app = express();
    const router = asyncify(express.Router());

    router.get('/', async (req: Request, res: Response) => {
      const data = await getDataAsync(new Error());
      res.send(data);
    });

    app.use(router);
    app.use(handler500);

    const res = await request(app).get('/').expect(500);
    assert.equal(res.text, 'fail');
  });
});
