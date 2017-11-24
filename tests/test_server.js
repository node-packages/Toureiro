const bull = require('bull');
const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');
const Redis = require('ioredis');
const uuid = require('node-uuid');
const request = require('supertest');

const redisOpts = {
  redis: {
    db: 7
  }
};

const client = new Redis({ db: redisOpts.redis.db });


function cleanSlate () {
  return client.keys('bull:*').then(keys => {
    if (keys.length) {
      return client.del(keys);
    }
  });
}

function createQueue (name) {
  return new bull(name, redisOpts);
}

function buildQueue (name) {
  const q = createQueue(name ? name : uuid());
  const promises = [];
  let i;
  for (i = 0; i < 20; i++) {
    promises.push(q.add({
      foo: 'bar'
    }));
  }
  return Promise.all(promises).return(q);
}

const Toureiro = require('../lib/toureiro');
const Job = require('../lib/models/job');

const app = Toureiro(redisOpts);

describe('Server', () => {

  describe('Rerun Job', () => {

    describe('Completed', () => {

      let q;

      beforeEach(done => {
        cleanSlate().then(() => {
          buildQueue('rerun-completed').then(_q => {
            q = _q;
            q.process((job, cb) => {
              return cb();
            });
            setTimeout(() => {
              done();
            }, 1000);
          });
        });
      });

      it('should be able to rerun completed jobs', done => {
        Job.fetch('rerun-completed', 'completed', 0, 1).then(jobs => {
          expect(jobs).to.be.an('array');
          expect(jobs.length).to.equal(1);
          const job = jobs[0];
          request(app)
            .post('/job/rerun')
            .set('Accept', 'application/json')
            .send({
              queue: 'rerun-completed',
              id: job.id
            })
            .expect(200)
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res.body.status).to.equal('OK');
              expect(res.body.job).to.exist;
              expect(res.body.job.id).to.not.equal(job.id);
              setTimeout(() => {
                Job.get('rerun-completed', res.body.job.id).then(job => {
                  expect(job).to.exist;
                  expect(job.state).to.equal('completed');
                  done();
                });
              }, 500);
            });
        });
      });

    });

    describe('Failed', () => {

      let q;

      beforeEach(done => {
        cleanSlate().then(() => {
          buildQueue('rerun-failed').then(_q => {
            q = _q;
            q.process(job => {
              if (job.id <= 20) {
                throw new Error('doomed!');
              }
            });
            setTimeout(() => {
              done();
            }, 1000);
          });
        });
      });

      it('should be able to rerun failed jobs', done => {
        Job.fetch('rerun-failed', 'failed', 0, 1).then(jobs => {
          expect(jobs).to.be.an('array');
          expect(jobs.length).to.equal(1);
          const job = jobs[0];
          request(app)
            .post('/job/rerun')
            .set('Accept', 'application/json')
            .send({
              queue: 'rerun-failed',
              id: job.id
            })
            .expect(200)
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res.body.status).to.equal('OK');
              expect(res.body.job).to.exist;
              expect(res.body.job.id).to.not.equal(job.id);
              setTimeout(() => {
                Job.get('rerun-failed', res.body.job.id).then(job => {
                  expect(job).to.exist;
                  expect(job.state).to.equal('completed');
                  done();
                });
              }, 500);
            });
        });
      });

    });

  });

});
