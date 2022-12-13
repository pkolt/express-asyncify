import http from 'http';

const httpMethodNames = http.METHODS.map((name) => name.toLowerCase());
const methodNames = ['route', 'use', 'all', 'del'].concat(httpMethodNames);

const processError = (result: any, next: any) => (result instanceof Promise ? result.catch(next) : null);

/**
 * Added support promise to view.
 * @param {*} view
 * @return {*}
 */
const wrapView = (view: any) => {
  if (view.length === 4) {
    return (err: any, req: any, res: any, next: any) => processError(view(err, req, res, next), next);
  }
  return (req: any, res: any, next: any) => processError(view(req, res, next), next);
};

/**
 * Added support async/await to express.
 * @param {*} app - express application or router.
 * @return {*}
 */
const asyncify = (app: any) => {
  for (const name of methodNames) {
    const method = app[name];
    if (typeof method === 'function') {
      let func;
      if (name === 'route') {
        func = (...args: any) => {
          const router = method.apply(app, args);
          return asyncify(router);
        };
      } else {
        func = (...args: any) => {
          const newArgs = args.map((value: any) => (typeof value === 'function' ? wrapView(value) : value));
          return method.apply(app, newArgs);
        };
      }
      app[name] = func;
    }
  }
  return app;
};

export = asyncify;
