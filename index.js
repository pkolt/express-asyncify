const http = require('http');

const httpMethodNames = http.METHODS.map(name => name.toLowerCase());
const methodNames = ['route', 'use', 'all', 'del'].concat(httpMethodNames);

const processError = (result, next) => result instanceof Promise ? result.catch(next) : null;

/**
 * Added support promise to view.
 * @param {*} view
 * @return {*}
 */
const wrapView = (view) => {
    if (view.length === 4) {
        return (err, req, res, next) => processError(view(err, req, res, next), next);
    }
    return (req, res, next) => processError(view(req, res, next), next);
};

/**
 * Added support async/await to express.
 * @param {*} app - express application or router.
 * @return {*}
 */
const asyncify = (app) => {
    for (const name of methodNames) {
        const method = app[name];
        if (typeof method === 'function') {
            let func;
            if (name === 'route') {
                func = (...args) => {
                    const router = method.apply(app, args);
                    return asyncify(router);
                };
            } else {
                func = (...args) => {
                    const newArgs = args.map(value => typeof value === 'function' ? wrapView(value) : value);
                    return method.apply(app, newArgs);
                };
            }
            app[name] = func;
        }
    }
    return app;
}

module.exports = asyncify;
