const express = require('express');
const bodyParser = require('body-parser');
const toureiro = require('./lib/toureiro')({
  redis: {
    db: 1
  }
});

const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.use('/toureiro', toureiro);

app.listen(3000, () => {
  console.log('Server is now listening at port 3000...');
});
