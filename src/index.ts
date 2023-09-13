import type { Request, Response, NextFunction } from 'express';

// https://expressjs.com/en/4x/api.html#routing-methods
const routingMethods = [
  'checkout',
  'copy',
  'delete',
  'get',
  'head',
  'lock',
  'merge',
  'mkactivity',
  'mkcol',
  'move',
  'm-search',
  'notify',
  'options',
  'patch',
  'post',
  'purge',
  'put',
  'report',
  'search',
  'subscribe',
  'trace',
  'unlock',
  'unsubscribe',
] as const;

const appMethods = [...routingMethods, 'route', 'use', 'all'] as const;

const processError = (result: Promise<unknown> | void, next: NextFunction) => {
  if (result instanceof Promise) {
    result.catch(next);
  }
};

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
type ErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => void;
type Handler = RequestHandler | ErrorHandler;

const isErrorHandler = (handler: Handler): handler is ErrorHandler => handler.length === 4;

/**
 * Added support promise to view.
 */
const wrapHandler = (handler: Handler): Handler => {
  if (isErrorHandler(handler)) {
    return (err: Error, req: Request, res: Response, next: NextFunction) =>
      processError(handler(err, req, res, next), next);
  }
  return (req: Request, res: Response, next: NextFunction) => processError(handler(req, res, next), next);
};

type AppMethods = (typeof appMethods)[number];
type App = { [k in AppMethods]: (...args: any[]) => any };

/**
 * Added support async/await to express.
 */
const asyncify = <T extends App>(app: T): T => {
  for (const name of appMethods) {
    const method = app[name];
    if (typeof method === 'function') {
      if (name === 'route') {
        app[name] = (...args) => {
          const router = method.apply(app, args);
          return asyncify(router);
        };
      } else {
        app[name] = (...args) => {
          const wrapArgs = args.map((val) => {
            if (typeof val === 'function') {
              return wrapHandler(val);
            } else if (Array.isArray(val)) {
              return val.map((it) => (typeof it === 'function' ? wrapHandler(it) : it));
            }
            return val;
          });
          return method.apply(app, wrapArgs);
        };
      }
    }
  }
  return app;
};

export default asyncify;
