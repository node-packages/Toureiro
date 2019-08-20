/**
 * Created by ferron on 7/31/18 12:17 PM
 */

const { hljs } = require('./hljs');

module.exports = function (self) {
  self.addEventListener('message', function (event) {
    const { code, languages } = event.data;
    let result;

    // waste of resources rendering large json.
    if (languages && languages.length === 1) {
      result = hljs.highlight(languages[0], code, true);
    } else {
      result = hljs.highlightAuto(code, languages);
    }

    self.postMessage(result);
  });
};
