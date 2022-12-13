'use strict';

const wrap = require('co').wrap;
const assert = require('assert');
const request = require('supertest-as-promised');
const express = require('express');
const asyncify = require('../dist');

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

describe('asyncify', () => {
    it('sync request', wrap(function*() {
        const app = asyncify(express());

        app.get('/', (req, res) => {
            res.send('ok');
        });

        const res = yield request(app).get('/').expect(200);
        assert.equal(res.text, 'ok');
    }));

    it('catch error to sync request', wrap(function*() {
        const app = asyncify(express());

        app.get('/', (req, res) => {
            throw new Error();
        });

        app.use(handler500);

        const res = yield request(app).get('/').expect(500);
        assert.equal(res.text, 'fail');
    }));

    it('async request', wrap(function*() {
        const app = asyncify(express());

        app.get('/', wrap(function*(req, res) {
            const data = yield getDataAsync('ok');
            res.send(data);
        }));

        const res = yield request(app).get('/').expect(200);
        assert.equal(res.text, 'ok');
    }));

    it('catch error to async request', wrap(function*() {
        const app = asyncify(express());

        app.get('/', wrap(function*(req, res) {
            const data = yield getDataAsync(new Error());
            res.send(data);
        }));

        app.use(handler500);

        const res = yield request(app).get('/').expect(500);
        assert.equal(res.text, 'fail');
    }));

    it('catch error to async/sync middleware', wrap(function*() {
        const app = asyncify(express());

        const asyncMiddleware = wrap(function*(req, res, next) {
            const data = yield getDataAsync(new Error());
            next();
        });

        const syncMiddleware = function(req, res, next) {
            next();
        };

        app.use(asyncMiddleware, syncMiddleware, handler500);

        app.get('/', (req, res) => {
            res.send('ok');
        });

        const res = yield request(app).get('/').expect(500);
        assert.equal(res.text, 'fail');
    }));

    it('catch error to app.all()', wrap(function*() {
        const app = asyncify(express());

        app.all('/', wrap(function*(req, res) {
            const data = yield getDataAsync(new Error());
            res.send(data);
        }));

        app.use(handler500);

        const resGet = yield request(app).get('/').expect(500);
        assert.equal(resGet.text, 'fail');

        const resPost = yield request(app).post('/').expect(500);
        assert.equal(resPost.text, 'fail');

        const resPut = yield request(app).put('/').expect(500);
        assert.equal(resPut.text, 'fail');

        const resDel = yield request(app).del('/').expect(500);
        assert.equal(resDel.text, 'fail');
    }));

    it('catch error to app.route()', wrap(function*() {
        const app = asyncify(express());

        app.route('/posts').get(wrap(function*(req, res) {
            const data = yield getDataAsync(new Error());
            res.send(data);
        }));

        app.use(handler500);

        const res = yield request(app).get('/posts').expect(500);
        assert.equal(res.text, 'fail');
    }));

    it('catch error to router', wrap(function*() {
        const app = express();
        const router = asyncify(express.Router());

        router.get('/', wrap(function*(req, res) {
            const data = yield getDataAsync(new Error());
            res.send(data);
        }));

        app.use(router);
        app.use(handler500);

        const res = yield request(app).get('/').expect(500);
        assert.equal(res.text, 'fail');
    }));
});
