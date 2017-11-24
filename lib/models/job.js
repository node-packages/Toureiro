const _ = require('lodash');
const queue = require('./queue');

module.exports = {

  /**
   * Get a job by id
   * @param {String} qName Queue name
   * @param {String} id Job id
   * @returns {Object} The job
   */
  get: (qName, id) => {
    const q = queue.get(qName);
    return q.getJob(id).then(job => {
      if (!job) {
        return job;
      }
      return job.getState().then(state => {
        job.state = state;
        return job;
      });
    });
  },

  /**
   * Add a job
   * @param {String} qName Queue name
   * @param {Object} data job data
   * @param {Object} opts job options
   * @returns {Object} The job
   */
  add: (qName, data, opts) => {
    const q = queue.get(qName);
    return q.add(data, opts).then(job => {
      if (!job) {
        return job;
      }
      return job.getState().then(state => {
        job.state = state;
        return job;
      });
    });
  },

  /**
   * Remove a job by id
   * @param {string} qName Queue name
   * @param {string} id Job id
   * @returns {Promise} A promise that resolves when the job is removed from queue
   */
  remove: (qName, id) => {
    const q = queue.get(qName);
    return q.getJob(id).then(job => {
      // only a completed job can be removed
      return job.isCompleted().then(() => {
        job.discard();
        return job.remove();
      });
    });
  },

  /**
   * Promote a delayed job to be executed immediately
   * @param {string} qName Queue name
   * @param {string} id Job id
   * @returns {Promise} A promise that resolves when the job is promoted
   */
  promote: (qName, id) => {
    const q = queue.get(qName);
    return q.getJob(id).then(job => job.promote());
  },

  /**
   * Get the total number of jobs of type
   * @param {String} qName Queue name
   * @param {String} type Job type: {wait|active|delayed|completed|failed}
   * @returns {Number} Total number of jobs
   */
  total: (qName, type) => {
    const q = queue.get(qName);
    if (type === 'wait') {
      return q.getWaitingCount();
    } else if (type === 'active') {
      return q.getActiveCount();
    } else if (type === 'delayed') {
      return q.getDelayedCount();
    } else if (type === 'failed') {
      return q.getFailedCount();
    } else if (type === 'completed') {
      return q.getCompletedCount();
    }
    throw new Error('You must provide a valid job type.');
  },

  /**
   * Fetch a number of jobs of certain type
   * @param {String} qName Queue name
   * @param {String} type Job type: {wait|active|delayed|completed|failed}
   * @param {Number} offset Index offset (optional)
   * @param {Number} limit Limit of the number of jobs returned (optional)
   * @returns {Promise} A promise that resolves to an array of jobs
   */
  fetch: (qName, type, offset, limit) => {
    const q = queue.get(qName);
    if (!(offset >= 0)) {
      offset = 0;
    }
    if (!(limit >= 0)) {
      limit = 30;
    }

    const order = {
      wait: false,
      active: true,
      delayed: true,
      completed: true,
      failed: true
    };

    if (order[type] !== undefined) {
      return q.getJobs(type, offset, offset + limit - 1, order[type]).then(jobs => Promise.all(_.map(jobs, job => {
        if (!job) {
          return null;
        }
        return job.getState().then(state => {
          job.state = state;
          return job;
        });
      })));
    }
    throw new Error('You must provide a valid job type.');
  }

};
