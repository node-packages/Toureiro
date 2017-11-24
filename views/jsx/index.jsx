var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

var Sidebar = require('./sidebar.jsx');
var Jobs = require('./jobs.jsx').Jobs;
var JobDetails = require('./jobs.jsx').JobDetails;
var createReactClass = require('create-react-class');

var Toureiro = createReactClass({

  getInitialState: function () {
    var state = {
      queue: undefined,
      category: undefined,
      readonly: true
    };
    return state;
  },

  handleQueueChange: function (queue) {
    this.setState({
      queue: queue
    });
  },

  handleCategoryChange: function (category) {
    var _this = this;
    this.setState({
      category: category
    }, function () {
      if (_this.refs.jobs) {
        _this.refs.jobs.setState({
          page: 0
        }, function () {
          _this.refs.jobs.fetchJobs();
        });
      }
    });
  },

  handleReadonlyChange : function () {
    this.setState({
      readonly: !this.state.readonly
    });
  },

  render: function () {
    var _this = this;
    return (
      <div id="toureiro">
        <Sidebar onQueueChange={this.handleQueueChange} onCategoryChange={this.handleCategoryChange}
                 onReadonlyChange={this.handleReadonlyChange}/>
        <div id="toureiro-canvas">
          {
            (_this.state.queue && _this.state.category) ? (
              (_this.state.category === 'job') ? (
                <JobDetails queue={_this.state.queue} readonly={_this.state.readonly}/>
              ) : (
                <Jobs ref="jobs" queue={_this.state.queue} category={this.state.category}
                      readonly={_this.state.readonly}/>
              )
            ) : ''
          }
        </div>
      </div>
    );
  }
});

ReactDOM.render(<Toureiro />, $('#toureiro-wrapper')[0]);
