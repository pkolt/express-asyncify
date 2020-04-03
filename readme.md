# express-asyncify ![](https://github.com/pkolt/express-asyncify/workflows/main/badge.svg)

Easy support `async/await` to [express](http://expressjs.com/).

## Installation

```bash
$ npm install express-asyncify --save
```

## Usage

Asyncify express application:

```javascript
const express = require('express');
const asyncify = require('express-asyncify');

const app = asyncify(express());

// ...

app.get('/', async (req, res) => {
    const posts = await Post.findAll();
    res.render('index', {posts});
});
```

Asyncify express router:

```javascript
const express = require('express');
const asyncify = require('express-asyncify');

const app = express();
const router = asyncify(express.Router());

// ...

router.get('/', async (req, res) => {
    const posts = await Post.findAll();
    res.render('index', {posts});
});

app.use('/blog', router);
```

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

  [MIT](license.md)