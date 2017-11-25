const React = require('react');
const classnames = require('classnames');

class Pagination extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      page: 0
    };
  }

  changePage (page) {
    const _this = this;
    this.setState({
      page: page
    }, function () {
      if (_this.props.onPageChange) {
        _this.props.onPageChange(page);
      }
    });
  };

  stepPage (operand) {
    let page = this.state.page + operand;
    if (page < 0) {
      page = 0;
    } else if (page >= this.props.total) {
      page = this.props.total - 1;
      if (page < 0) {
        page = 0;
      }
    }
    const _this = this;
    this.setState({
      page: page
    }, function () {
      if (_this.props.onPageChange) {
        _this.props.onPageChange(page);
      }
    });
  };

  render () {
    const _this = this;
    const pages = [];
    for (let i = 0; i < this.props.total; i++) {
      pages.push(i);
    }
    if (pages.length === 0) {
      pages.push(0);
    }
    return (
      <div className="pagination">
        <ul>
          <li className="previous">
            <a href="javascript:" className="fui-arrow-left" onClick={_this.stepPage.bind(_this, -1)}>«</a>
          </li>
          {
            pages.map(function (page) {
              const pageClasses = classnames({
                active: _this.state.page === page
              });
              if ([0, _this.props.total - 1, _this.state.page, _this.state.page - 1, _this.state.page + 1].indexOf(page) !== -1) {
                return (
                  <li className={pageClasses} key={page}>
                    <a href="javascript:" onClick={_this.changePage.bind(_this, page)}>{page + 1}</a>
                  </li>
                );
              } else if ((page === _this.state.page - 2 && page !== 0) || (page === _this.state.page + 2 && page !== _this.props.total - 1)) {
                return (
                  <li className="disabled" key={page}>
                    <a href="javascript:">..</a>
                  </li>
                );
              }
            })
          }
          <li className="next">
            <a href="javascript:" className="fui-arrow-right" onClick={_this.stepPage.bind(_this, 1)}>»</a>
          </li>
        </ul>
      </div>
    );
  };
}

module.exports = Pagination;
