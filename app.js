'use strict';

// Make require nicer
global.__base = __dirname + '/';

let express = require('express');
var app = express();
module.exports = app;

// Modules
let morgan = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let chalk = require('chalk');

// Custom error handler
let errorHandler = require('./errors/error-handler.js');

// Variable configuration
let config = require('config');

// MongoDB setup
mongoose.Promise = global.Promise;
mongoose.connect(config.db);

// Set secret for JWT
app.set('superSecret', config.secret);

// Middleware
if (config.util.getEnv('NODE_ENV') != 'production') {
  app.use(morgan('tiny'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Rotues
let APIRoutes = require('./routes/api');

// Routes
app.use('/api/user', APIRoutes.UserAPI);
app.use('/api/user', APIRoutes.UserAPIUnrestricted);
app.use('/api/vendor', APIRoutes.VendorAPI);
app.use('/api', APIRoutes.VendorAPIUnrestricted);

// Error handler
app.use(errorHandler);

// Start server
app.listen(3000, () => {
  console.log(chalk.green('Server started'));
});