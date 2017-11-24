const app = require('./lib/toureiro')({
  development: true,
  redis: {
    db: 7
  }
});

app.listen(3000, function () {
  console.log('Toureiro is now listening at port 3000...');
});
