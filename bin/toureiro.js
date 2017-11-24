#!/usr/bin/env node

const minimist = require('minimist');
const toureiro = require('../lib/toureiro');

const argv = minimist(process.argv.slice(2));

if (argv.h || argv.help) {
  console.log('Usage: toureiro [port]');
  console.log('[port]         Port for toureiro to listen to');
  console.log('Options:');
  console.log('--rh           Redis host, default to 127.0.0.1');
  console.log('--rp           Redis port, default to 6379');
  console.log('--rdb          Redis database number, default to 0');
  console.log('--pass         Redis password, default to null');
  process.exit(0);
}

let port = 3000;
if (argv._.length > 0 && !isNaN(parseInt(argv._[0]))) {
  port = parseInt(argv._[0]);
}
let redisHost = '127.0.0.1';
if (argv.rh) {
  redisHost = argv.rh;
}
let redisPort = 6379;
if (argv.rp && !isNaN(parseInt(argv.rp))) {
  redisPort = argv.rp;
}
let redisDB = 0;
if (argv.rdb && !isNaN(parseInt(argv.rdb))) {
  redisDB = argv.rdb;
}
let redisPass = null;
if (argv.pass) {
  redisPass = argv.pass;
}

const app = toureiro({
  redis: {
    host: redisHost,
    port: redisPort,
    auth_pass: redisPass,
    db: redisDB
  }
});

app.listen(port, function () {
  console.log('Toureiro is now listening at port', port, '...');
});
