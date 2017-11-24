const express = require('express');
const router = express.Router();
const Promise = require('bluebird');
const Queue = require('../models/queue');
const Job = require('../models/job');

router.all('/', (req, res) => {
  const qName = req.query.name;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Promise.join(
      Queue.total(qName),
      Job.total(qName, 'wait'),
      Job.total(qName, 'active'),
      Job.total(qName, 'delayed'),
      Job.total(qName, 'completed'),
      Job.total(qName, 'failed')
    ).then(results => {
      const jobData = {
        total: results[0],
        wait: results[1],
        active: results[2],
        delayed: results[3],
        completed: results[4],
        failed: results[5]
      };
      res.json({
        status: 'OK',
        queue: {
          name: qName,
          stats: jobData
        }
      });
    });
  });
});

router.all('/list', (req, res) => {
  Queue.list().then(queues => {
    res.json({
      status: 'OK',
      queues: queues
    });
  }).catch(err => {
    console.log(err.stack);
    res.json({
      status: 'FAIL',
      message: err.message
    });
  });
});

module.exports = router;
