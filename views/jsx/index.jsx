const React = require('react');
const ReactDOM = require('react-dom');
const $ = require('jquery');

const Sidebar = require('./sidebar.jsx');
const { Jobs, JobDetails } = require('./jobs.jsx');

class Toureiro extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      queue: undefined,
      category: undefined,
      readonly: true
    };
    this.handleQueueChange = this.handleQueueChange.bind(this);
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
    this.handleReadonlyChange = this.handleReadonlyChange.bind(this);
  }

  handleQueueChange (queue) {
    this.setState({
      queue: queue
    });
  };

  handleCategoryChange (category) {
    const _this = this;
    this.setState({
      category: category
    }, () => {
      if (_this.refs.jobs) {
        _this.refs.jobs.setState({
          page: 0
        }, () => {
          _this.refs.jobs.fetchJobs();
        });
      }
    });
  };

  handleReadonlyChange () {
    this.setState({
      readonly: !this.state.readonly
    });
  };

  render () {
    const _this = this;
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
}

ReactDOM.render(<Toureiro/>, $('#toureiro-wrapper')[0]);
