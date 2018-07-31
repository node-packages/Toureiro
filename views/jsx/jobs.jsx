const React = require('react');
const $ = require('jquery');
const moment = require('moment-timezone');
const { Highlight } = require( 'react-fast-highlight');
const work = require('webworkify');
const Worker = work(require('../js/worker'));


const Pagination = require('./pagination.jsx');

class Job extends React.Component {

  constructor (props) {
    super(props);
  }

  promoteJob () {
    const _this = this;
    if (confirm('Are you sure you want to promote this job?')) {
      $.post('job/promote/', {
        queue: this.props.queue,
        id: this.props.job.id
      }, response => {
        if (response.status === 'OK') {
          if (_this.props.onJobUpdate) {
            _this.props.onJobUpdate();
          }
        } else {
          console.log(response);
          alert(response.message);
        }
      });
    }
  };

  removeJob () {
    const _this = this;
    if (confirm('Are you sure you want to remove job ' + this.props.job.id + '? This action is not reversible.')) {
      $.post('job/remove/', {
        queue: this.props.queue,
        id: this.props.job.id
      }, response => {
        if (response.status === 'OK') {
          if (_this.props.onJobUpdate) {
            _this.props.onJobUpdate();
          }
        } else {
          console.log(response);
          alert(response.message);
        }
      });
    }
  };

  rerunJob () {
    const _this = this;
    if (confirm('Are you sure you want to rerun job ' + this.props.job.id + '? This will create another instance of the job with the same params and will be executed immediately.')) {
      $.post('job/rerun/', {
        queue: this.props.queue,
        id: this.props.job.id
      }, response => {
        if (response.status === 'OK') {
          if (_this.props.onJobUpdate) {
            _this.props.onJobUpdate();
          }
        } else {
          console.log(response);
          alert(response.message);
        }
      });
    }
  };

  render () {
    const _this = this;
    const job = this.props.job;
    try {
      if (typeof job.data === 'string') {
        job.data = JSON.parse(job.data);
      }
      if (typeof job.opts === 'string') {
        job.opts = JSON.parse(job.opts);
      }
    } catch (err) {
      console.log(err);
    }

    const jobId = job.id || job.opts.jobId;

    return (
      <div className="job clearfix" key={jobId}>
        <div className="job-details">
          <h4 className="job-id">Job ID: {jobId}</h4>
          <br/>
          {
            this.props.showState ? (
              <h5 className={"job-state " + job.state}>{job.state[0].toUpperCase() + job.state.substring(1)}</h5>
            ) : ''
          }
          {
            (job.data && job.data.type && job.data._category) ? (
              <div>
                <p className="job-category">
                  {job.data._category} : {job.data.type}
                </p>
              </div>
            ) : ''
          }
          <p className="job-creation">Created At:
            <br/>
            {moment(job.timestamp).format('MMM Do YYYY, hh:mm:ss a')}
          </p>
          {
            job.state === 'delayed' ? (
              <div>
                <p className="job-delay">Delayed Until:
                  <br/>
                  {moment(job.timestamp + job.delay).format('MMM Do YYYY, hh:mm:ss a')}
                </p>
                {
                  _this.props.enablePromote && !_this.props.readonly ? (
                    <button className="job-promote btn btn-embossed btn-warning" onClick={_this.promoteJob}>
                      Promote</button>
                  ) : ''
                }
                <br/>
                <br/>
              </div>
            ) : ''
          }
          {
            this.props.readonly || (job.state !== 'completed' && job.state !== 'failed') ? '' : (
              <div>
                <a className="job-rerun" href="javascript:;" onClick={this.rerunJob}>Rerun Job</a>
              </div>
            )
          }
          {
            this.props.readonly ? '' : (
              <div>
                <a className="job-remove" href="javascript:;" onClick={this.removeJob}>Remove Job</a>
              </div>
            )
          }
          <br/>
          <br/>
        </div>
        <Highlight
          languages={['json', 'js']}
          worker={Worker}
          className="job-code"
        >
          {JSON.stringify(job, null, 2)}
        </Highlight>
      </div>
    );
  }

}

class JobDetails extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      id: undefined,
      job: undefined
    };

    this.handleJobSearch = this.handleJobSearch.bind(this);
    this.getJobById = this.getJobById.bind(this);
  }

  handleJobSearch (event) {
    if (event.which === 13) {
      this.getJobById();
    }
  };

  getJobById () {
    const _this = this;
    const id = $(this.refs.idField).val();
    if (id) {
      $.get('job/', {
        queue: this.props.queue,
        id: id
      }, response => {
        if (response.status === 'OK') {
          _this.setState({
            id: id,
            job: response.job
          });
        } else {
          console.log(response);
          _this.setState({
            id: id,
            job: null
          });
        }
      });
    } else {
      this.setState({
        id: null,
        job: null
      });
    }
  };

  render () {
    return (
      <div className="toureiro-jobs">
        <h4 className="header">Job Details</h4>
        <div>
          <label>Find Job by ID: </label>
          <div className="input-group">
            <input ref="idField" className="form-control" type="text" name="id" onKeyUp={this.handleJobSearch}/>
            <span className="input-group-btn">
              <button className="btn btn-success" onClick={this.getJobById}>Go</button>
            </span>
          </div>
        </div>
        <br/>
        {
          (this.state.job) ? (
            <Job job={this.state.job} queue={this.props.queue} enablePromote={true} showState={true}
                 readonly={this.props.readonly}/>
          ) : (
            (this.state.id) ? (
              <span>Job is not found.</span>
            ) : ''
          )
        }
      </div>
    );
  };
}

class Jobs extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      jobs: [],
      page: 0,
      limit: 1,
      total: 0
    };
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleJobUpdate = this.handleJobUpdate.bind(this);
  }

  componentDidUpdate () {
    if (this.state.page !== this.refs.pagination.state.page) {
      this.refs.pagination.setState({
        page: this.state.page
      });
    }
  };

  fetchJobs () {
    const _this = this;
    this.setState({
      jobs: []
    }, () => {
      $.get('job/fetch/' + _this.props.category, {
        queue: _this.props.queue,
        page: _this.state.page,
        limit: _this.state.limit
      }, response => {
        if (response.status === 'OK') {
          if (response.jobs.length === 0 && response.total > 0) {
            _this.setState({
              page: 0
            }, () => {
              _this.fetchJobs();
            });
          } else {
            _this.setState({
              jobs: response.jobs,
              total: response.total
            });
          }
        } else {
          console.log(response);
        }
      });
    });
  };

  handlePageChange (page) {
    const _this = this;
    this.setState({
      page: page
    }, () => {
      _this.fetchJobs();
    });
  };

  handleJobUpdate () {
    this.fetchJobs();
  };

  static getJobId (job) {
    // get job id
    let opts;
    try {
      if (typeof job.opts === 'string') {
        opts = JSON.parse(job.opts);
      } else {
        opts = job.opts;
      }
    } catch (err) {
      console.error(err);
    }

    return job.id || opts.jobId;
  };

  render () {
    const _this = this;
    return (
      <div className="toureiro-jobs">
        <h4 className="header">{this.props.category[0].toUpperCase() + this.props.category.slice(1)} Jobs</h4>
        <div ref="jobs">
          {
            this.state.jobs.map(job => (
              <Job key={Jobs.getJobId(job)} job={job} queue={_this.props.queue} onJobUpdate={_this.handleJobUpdate}
                   enablePromote={_this.props.category === 'delayed'} readonly={_this.props.readonly}/>
            ))
          }
        </div>
        <Pagination ref="pagination" total={Math.ceil(this.state.total / this.state.limit)}
                    onPageChange={this.handlePageChange}/>
      </div>
    );
  }
}

module.exports = { JobDetails, Jobs };
