const APP_METHOD_NAMES = [
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
  'use',
  'all',
  'route',
];

const wrapHandler = (handler) => {
  return new Proxy(handler, {
    apply(func, ctx, args) {
      const next = args.at(-1);
      const result = Reflect.apply(func, ctx, args);
      if (result instanceof Promise && typeof next === 'function') {
        result.catch(next);
      }
    },
  });
};

const wrapArgs = (args) => {
  return args.map((val) => {
    if (typeof val === 'function') {
      return wrapHandler(val);
    } else if (Array.isArray(val)) {
      return wrapArgs(val);
    }
    return val;
  });
};

const wrapMethod =
  (app, handler) =>
  (...args) => {
    return handler.apply(app, wrapArgs(args));
  };

const wrapRoute =
  (app, handler) =>
  (...args) => {
    return asyncify(handler.apply(app, args));
  };

const isAppMethod = (method, name) => {
  return typeof method === 'function' && APP_METHOD_NAMES.includes(name);
};

/**
 * Added support async/await to express.
 */
const asyncify = (app) => {
  return new Proxy(app, {
    get(target, name, receiver) {
      const value = Reflect.get(target, name, receiver);
      if (isAppMethod(value, name)) {
        if (name === 'route') {
          return wrapRoute(target, value);
        } else {
          // other methods
          return wrapMethod(target, value);
        }
      }
      return value;
    },
  });
};

export default asyncify;
