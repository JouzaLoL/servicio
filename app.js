'use strict';

// Make require nicer
global.__base = __dirname + '/';

let express = require('express');
var app = express();
module.exports = app;

let morgan = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let errorHandler = require('./errors/error-handler.js');

// Load config
let config = require('config');



// MongoDB setup
mongoose.Promise = global.Promise;
mongoose.connect(config.db);

// Set secret for JWT
app.set('superSecret', config.secret);

// Middleware
if (config.util.getEnv('NODE_ENV') != 'test') {
  // use morgan to log at command line
  app.use(morgan('tiny'));
}
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Route vars
let apiRoutes = require('./routes/api');

// Routes
app.use('/api', apiRoutes.APIRoutes);
app.use('/api', apiRoutes.RestrictedAPIRoutes);

app.use(errorHandler);

// Start server
app.listen(3000, () => {
  console.log('! Server started');
});