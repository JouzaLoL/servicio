let express = require('express');
let logger = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

var app = express();
module.exports = app;

var config = require('./config/config'); // get our config file

// MongoDB setup
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

// Set secret for JWT
app.set('superSecret', config.secret);

// Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Route vars
var apiRoutes = require('./routes/api');

// Routes
app.use('/api', apiRoutes.APIRoutes);
app.use('/api', apiRoutes.RestrictedAPIRoutes);

// Start server
app.listen(3000, () => {
  console.log('! Server started');
});