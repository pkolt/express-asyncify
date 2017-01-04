'use strict';

const http = require('http');

const httpMethodNames = http.METHODS.map(name => name.toLowerCase());
const methodNames = ['route', 'use', 'all', 'del'].concat(httpMethodNames);

/**
 * Added support promise to view.
 * @param {*} view
 * @return {*}
 */
const wrapView = (view) => {
    if (view.length === 4) {
        return (err, req, res, next) => {
            const result = view(err, req, res, next);
            if (result instanceof Promise) {
                result.catch(next);
            }
        };
    }
    return (req, res, next) => {
        const result = view(req, res, next);
        if (result instanceof Promise) {
            result.catch(next);
        }
    };
};

/**
 * Added support async/await to express.
 * @param {*} app - express application or router.
 * @return {*}
 */
function asyncify(app) {
    for (let name of methodNames) {
        let method = app[name];
        if (typeof method === 'function') {
            let func;
            if (name === 'route') {
                func = function() {
                    const router = method.apply(app, arguments);
                    return asyncify(router);
                };
            } else {
                func = function() {
                    const args = Array.prototype.slice.call(arguments);
                    const newArgs = args.map(value => {
                        if (typeof value === 'function') {
                            value = wrapView(value);
                        }
                        return value;
                    });
                    return method.apply(app, newArgs);
                };
            }
            app[name] = func;
        }
    }
    return app;
}

module.exports = asyncify;
