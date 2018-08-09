/**
 * Created by ferron on 7/31/18 12:17 PM
 */

const hjs = require('highlight.js');

module.exports = function (self) {
  self.addEventListener('message', function (event) {
    const { code, languages } = event.data;
    let result;

    // waste of resources rendering large json.
    if (code.length > 4000) {
      result = code;
    } else if (languages && languages.length === 1) {
      result = hjs.highlight(languages[0], code, true);
    } else {
      result = hjs.highlightAuto(code, languages);
    }

    self.postMessage(result);
  });
};
