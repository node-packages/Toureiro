const _ = require('lodash');
const bull = require('bull');
const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');
const Redis = require('ioredis');
const uuid = require('node-uuid');


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

function resetData () {
  return cleanSlate().then(() => {
    const promises = [];
    let i;
    for (i = 0; i < 5; i++) {
      promises.push(buildQueue());
    }
    promises.push(buildQueue('test queue'));
    return Promise.all(promises);
  });
}

describe('Models', () => {

  before(() => {
    require('../lib/redis').init(redisOpts.redis);
  });

  describe('Queue', () => {

    const Queue = require('../lib/models/queue');

    beforeEach(() => resetData());

    it('#list()', () => Queue.list().then(keys => {
      expect(keys).to.be.a('array');
      expect(keys.length).to.equal(6);
    }));

    it('#total()', () => Queue.total('test queue').then(total => {
      expect(parseInt(total)).to.equal(20);
    }));

    it('#remove()', () => Queue.remove('test queue').then(() => client.keys('bull:test queue:*').then(keys => {
      expect(keys.length).to.equal(0);
    })));

  });

  describe('Job', () => {

    const Job = require('../lib/models/job');

    it('#get()', () => buildQueue('job').then(() => Job.get('job', 1).then(job => {
      expect(job).to.exist;
      expect(job.id).to.equal(1);
    })));

    it('#remove()', () => buildQueue('job').then(() => Job.remove('job', 1).then(() => Job.get('job', 1).then(job => {
      expect(job).to.not.exist;
    }))));

    describe('`wait`', () => {

      beforeEach(() => cleanSlate().then(() => buildQueue('wait')));

      it('#total()', () => Job.total('wait', 'wait').then(total => {
        expect(total).to.equal(20);
      }));

      it('#fetch()', () => Job.fetch('wait', 'wait', 5, 7).then(jobs => {
        expect(jobs).to.be.an('array');
        expect(jobs.length).to.equal(7);
        // ids are reversed since it's LIFO
        const ids = [15, 14, 13, 12, 11, 10, 9];
        _.map(jobs, job => {
          expect(ids.indexOf(Number(job.id))).to.not.equal(-1);
        });
      }));

    });

    describe('`active`', () => {

      beforeEach(() => cleanSlate().then(() => buildQueue('active').then(q => {
        Promise.join(
          q.getNextJob(),
          q.getNextJob(),
          q.getNextJob(),
          q.getNextJob(),
          q.getNextJob()
        );
      })));

      it('#total()', () => Job.total('active', 'active').then(total => {
        expect(total).to.equal(5);
      }));

      it('#fetch()', () => Job.fetch('active', 'active', 1, 3).then(jobs => {
        expect(jobs).to.be.an('array');
        expect(jobs.length).to.equal(3);
        const ids = [2, 3, 4];
        _.map(jobs, job => {
          expect(ids.indexOf(Number(job.id))).to.not.equal(-1);
        });
      }));

    });

    describe('`delayed`', () => {

      beforeEach(() => cleanSlate().then(() => {
        const q = createQueue('delayed');
        const promises = [];
        let i;
        for (i = 0; i < 10; i++) {
          promises.push(q.add({
            foo: 'bar'
          }, {
            delay: 1000 + i * 10
          }));
        }
        return Promise.all(promises);
      }));

      it('#total()', () => Job.total('delayed', 'delayed').then(total => {
        expect(total).to.equal(10);
      }));

      it('#fetch()', () => Job.fetch('delayed', 'delayed', 0, 4).then(jobs => {
        expect(jobs).to.be.an('array');
        expect(jobs.length).to.equal(4);
        const ids = [1, 2, 3, 4];
        _.map(jobs, job => {
          expect(ids.indexOf(Number(job.id))).to.not.equal(-1);
        });
      }));

    });

    describe('`completed`', () => {

      let q;

      beforeEach(done => {
        cleanSlate().then(() => {
          buildQueue('completed').then(_q => {
            q = _q;
            q.process(() => {
            });
            setTimeout(() => {
              done();
            }, 100);
          });
        });
      });

      it('#total()', () => Job.total('completed', 'completed').then(total => {
        expect(total).to.equal(20);
      }));

      it('#fetch()', () => Job.fetch('completed', 'completed', 1, 5).then(jobs => {
        expect(jobs).to.be.an('array');
        expect(jobs.length).to.equal(5);
        const ids = [2, 3, 4, 5, 6];
        _.map(jobs, job => {
          expect(ids.indexOf(Number(job.id))).to.not.equal(-1);
        });
      }));

    });

    describe('`failed`', () => {

      let q;

      beforeEach(done => {
        cleanSlate().then(() => {
          buildQueue('failed').then(_q => {
            q = _q;
            q.process(() => {
              throw new Error('Doomed!');
            });
            setTimeout(() => {
              done();
            }, 100);
          });
        });
      });

      it('#total()', () => Job.total('failed', 'failed').then(total => {
        expect(total).to.equal(20);
      }));

      it('#fetch()', () => Job.fetch('failed', 'failed', 3, 7).then(jobs => {
        expect(jobs).to.be.an('array');
        expect(jobs.length).to.equal(7);
        const ids = [4, 5, 6, 7, 8, 9, 10];
        _.map(jobs, job => {
          expect(ids.indexOf(Number(job.id))).to.not.equal(-1);
        });
      }));

    });

  });

});
