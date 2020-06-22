const hljs = require('highlight.js/lib/highlight');

// Lets only register json
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));

module.exports = {
  hljs
};
