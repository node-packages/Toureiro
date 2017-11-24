const React = require('react');
const $ = require('jquery');

class Sidebar extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      queues: [],
      queue: undefined,
      category: undefined,
      readonly: true
    };
    this.pollTimer = undefined;

    this.changeQueue = this.changeQueue.bind(this);
    this.changeCategory = this.changeCategory.bind(this);
    this.toggleReadonly = this.toggleReadonly.bind(this);
  }

  componentDidMount () {
    const _this = this;
    this.listQueues();
    this.pollTimer = setInterval(() => {
      _this.listQueues();
      if (_this.state.queue) {
        _this.getQueue(_this.state.queue.name);
      }
    }, 2000);
  };

  listQueues () {
    const _this = this;
    $.get('queue/list/', response => {
      if (response.status === 'OK') {
        _this.setState({
          queues: response.queues
        })
        if (!_this.state.queue && response.queues.length > 0) {
          _this.getQueue(response.queues[0]);
        }
      } else {
        console.log(response);
      }
    });
  };

  getQueue (queue) {
    const _this = this;
    $.get('queue/?name=' + encodeURIComponent(queue), response => {
      if (response.status === 'OK') {
        const state = {
          queue: response.queue,
        };
        if (!_this.state.queue) {
          const stats = response.queue.stats;
          let category = 'active';
          if (stats['active'] > 0) {
            category = 'active';
          } else if (stats['wait'] > 0) {
            category = 'wait';
          } else if (stats['delayed'] > 0) {
            category = 'delayed';
          } else if (stats['completed'] > 0) {
            category = 'completed';
          } else if (stats['failed'] > 0) {
            category = 'failed';
          }
          state.category = category;
          if (_this.props.onQueueChange) {
            _this.props.onQueueChange(queue);
            _this.props.onCategoryChange(category);
          }
        }
        _this.setState(state);
      } else {
        console.log(response);
      }
    });
  };

  changeQueue (event) {
    const _this = this;
    const queue = $(event.target).val();
    this.getQueue(queue);
    if (_this.props.onQueueChange) {
      _this.props.onQueueChange(queue);
    }
  };

  changeCategory (key, event) {
    const _this = this;
    this.setState({
      category: key
    }, () => {
      if (_this.props.onCategoryChange) {
        _this.props.onCategoryChange(key);
      }
    });
  };

  toggleReadonly (event) {
    const _this = this;
    this.setState({
      readonly: !this.state.readonly
    }, () => {
      if (_this.props.onReadonlyChange) {
        _this.props.onReadonlyChange();
      }
    });
  };

  render () {
    const _this = this;
    return (
      <div id="toureiro-sidebar">
        <h4 className="header">Queue Manager</h4>
        <div id="sidebar-queues">
          <h5>Select Queue:</h5>
          <select name="queue" onChange={this.changeQueue} className="form-control">
            {
              this.state.queues.map(queue => (
                <option value={queue} key={queue}>{queue}</option>
              ))
            }
          </select>
        </div>
        <div id="sidebar-stats">
          <h5>Job Status</h5>
          {
            (_this.state.queue) ? (
              ['active', 'wait', 'delayed', 'completed', 'failed'].map(key => (
                <div key={key} className="sidebar-stat">
                  <a href="javascript:;" onClick={_this.changeCategory.bind(_this, key)}>
                    {key[0].toUpperCase() + key.slice(1)} : <span
                    className="badge">{_this.state.queue.stats[key]}</span>
                  </a>
                </div>
              ))
            ) : ''
          }
          <div className="sidebar-stat">
            <a href="javascript:;" onClick={_this.changeCategory.bind(_this, 'job')}>Job Details</a>
          </div>
        </div>
        <div className="sidebar-controls">
          <div>
            <input type="checkbox" name="readonly" onChange={_this.toggleReadonly} checked={this.state.readonly}/>
            <label
              htmlFor="readonly">ReadOnly</label>
          </div>
        </div>
      </div>
    );
  }

}

module.exports = Sidebar;
