# Toureiro


A graphical monitoring interface for the distributed job queue [bull](https://github.com/OptimalBits/bull) built using `express` and `react`. Toureiro provides simple monitoring features as well as the ability to promote delayed jobs directly. **This version only supports bull v3**

> **NB : This fork only supports bull 3.x & above. There is no**

## Screenshots

![Job List](https://raw.githubusercontent.com/Epharmix/Toureiro/screenshots/public/screenshots/Job%20List.png "Job List")

![Search Job](https://raw.githubusercontent.com/Epharmix/Toureiro/screenshots/public/screenshots/Search%20Job.png "Search Job")

## Get Started

First install `toureiro-next` from `npm`.

```
npm install toureiro-next
```

You can then use `toureiro` in your project. The constructor `toureiro()` will return an `express` app, which you can then have it listen to any port you desire:

```javascript
const toureiro = require('toureiro-next');
const app = toureiro();
const server = app.listen(3000, function() {
  console.log('Toureiro is now listening at port 3000...');
});
```

Or you can mount it to a subpath for your own `express` server:

```javascript
const express = require('express');
const toureiro = require('toureiro-next');

const app = express();
/**
 * Your own setup...
 */
app.use('/toureiro', toureiro());

const server = app.listen(8080);
```

You can also run `toureiro` as a standalone program:

```bash
> toureiro
Toureiro is now listening at port 3000...
```

## Config

By default, `toureiro` will try to connect to the redis db #0 at 127.0.0.1:6379, but you can configure it yourself:

```javascript
const app = toureiro({
  // Options to be passed directly to redis.createClient(),
  // see https://github.com/NodeRedis/node_redis#rediscreateclient
  redis: {
    // Redis host
    host: '127.0.0.1',
    // Port
    port: 6379,
    // DB number
    db: 1
    // Other redis options...
  }
});
```

## Usage

You can invoke `toureiro --help` to see usage instructions:

```
Usage: toureiro [port]
[port]         Port for toureiro to listen to
Options:
--rh           Redis host, default to 127.0.0.1
--rp           Redis port, default to 6379
--rdb          Redis database number, default to 0
--pass         Redis password, default to null
```

## Development

`gulp dev`: Starts a test server for port 3000 and redis db #1

`npm test`: Runs the mocha tests

Any issues reporting or pull requests are welcomed!

## Why Bull?

Distributed task queue is a necessity in a lot of use cases. Among all the queues out there, [Celery](http://www.celeryproject.org/) is probably the most prominent and has the biggest community. However, it's hard to integrate `Celery` into the Node.js programs, simply because that's another language environment to maintain. Therefore, a javascript native task queue is much needed.

Among the queues written for `javascript`, [Kue](https://github.com/Automattic/kue.git) is the most widely used one. `Kue` is a great library, and we have relied heavily on `Kue` before, but we are gradually troubled by the constious bugs of the library. Due to the time when `Kue` was first written, a lot of things weren't possible (for example, atomicity of complex `redis` operations, which is now enabled by the built-in `LUA` scripting engine). What's more, several important features (FIFO behavior of delayed jobs, for instance) are missing from `Kue` or are hard to implement due to the early design decisions.

Then `bull` came along. It's written by the guys from OptimalBits and its APIs are modeled heavily after those of `Kue`. In its core, however, it's written very carefully (and differently from `Kue`) to ensure robustness and atomicity. Bugs that are common to distributed queue designs are not found with `bull` or have been fixed along the way.

As awesome as `bull` is, the only thing that is missing is a web monitoring interface, much like that of `Kue`, so we decided to make our own, thus `toureiro` is born.

## Browser Compatibility

It's compatible with all modern browsers. Since the front end relies on `react`, and `react` does support all the way down to IE8, it's possible that IE8 will work as well, though with messy styles.
