const express = require('express');
const router = express.Router();
const Queue = require('../models/queue');
const Job = require('../models/job');
const safeParse = require('./util').safeParse;

router.all('/', (req, res) => {
  const qName = req.query.queue;
  const id = req.query.id;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Job.get(qName, id).then(job => {
      if (job) {
        const data = job.toData();
        data.id = job.id;
        data.state = job.state;
        res.json({
          status: 'OK',
          job: data
        });
        return;
      }
      res.json({
        status: 'FAIL',
        message: 'The job does not exist.'
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

router.all('/remove', (req, res) => {
  const qName = req.body.queue;
  const id = req.body.id;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Job.remove(qName, id).then(() => {
      res.json({
        status: 'OK'
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

router.all('/promote', (req, res) => {
  const qName = req.body.queue;
  const id = req.body.id;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Job.promote(qName, id).then(() => {
      res.json({
        status: 'OK'
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

router.all('/rerun', (req, res) => {
  const qName = req.body.queue;
  const id = req.body.id;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Job.get(qName, id).then(job => {
      if (job) {
        if (job.state !== 'completed' && job.state !== 'failed') {
          res.json({
            status: 'FAIL',
            message: 'Cannot rerun a job that is not completed or failed.'
          });
          return;
        }
        let data = job.toData();
        const opts = JSON.parse(data.opts);
        if (opts.delay) {
          delete opts.delay;
        }
        data = JSON.parse(data.data);
        return Job.add(qName, data, opts).then(job => {
          const data = job.toData();
          data.id = job.id;
          data.state = job.state;
          res.json({
            status: 'OK',
            job: data
          });
        });
      }
      res.json({
        status: 'FAIL',
        message: 'The job does not exist.'
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

router.all('/total/:type(((wait)|(active)|(delayed)|(completed)|(failed)))', (req, res) => {
  const qName = req.query.queue;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }
    Job.total(qName, req.params.type).then(total => {
      res.json({
        status: 'OK',
        total: total
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

router.all('/fetch/:type(((wait)|(active)|(delayed)|(completed)|(failed)))', (req, res) => {
  let page = 0;
  if (req.query.page) {
    page = parseInt(req.query.page);
  }
  let limit = 30;
  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  const qName = req.query.queue;
  Queue.exists(qName).then(result => {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return;
    }

    // override default sort-order
    const order = {
      completed: false,
      failed: false
    };

    const _type = req.params.type;

    Job.fetch(qName, _type, page * limit, limit, order[_type]).then(jobs => {
      const _jobs = [];
      for (let i in jobs) {
        const job = jobs[i];
        if (job && job.toData) {
          const data = job.toData();
          data.id = job.id;
          data.state = job.state;
          _jobs.push(data);

          ['stacktrace', 'failedReason'].forEach(prop => {
            data[prop] = safeParse(job[prop]);
          });

        } else {
          console.log('Job appears corrupt:', job);
        }
      }
      return Job.total(qName, _type).then(total => {
        res.json({
          status: 'OK',
          jobs: _jobs,
          total: total,
          page: page,
          limit: limit
        });
      });
    }).catch(err => {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

module.exports = router;
