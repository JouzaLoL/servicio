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
let cors = require('cors');

// Custom error handler
let errorHandler = require('./errors/error-handler.js');

// Variable configuration
let config = require('config');
let dbUrl;
let secret;
if (process.env.NODE_ENV == 'production') {
  dbUrl = process.env.DB_URL;
  secret = process.env.SECRET;
} else {
  dbUrl = config.db;
  secret = config.secret;
}

// MongoDB setup
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);

// Set secret for JWT
app.set('superSecret', secret);


// Middleware
if (config.util.getEnv('NODE_ENV') != ('production') && config.util.getEnv('NODE_ENV') != ('test')) {
  app.use(morgan('tiny'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());

// Routes
let APIRoutes = require('./routes/api');

// Routes
app.use('/api/user', APIRoutes.UserAPIUnrestricted);
app.use('/api/user', APIRoutes.UserAPI);
app.use('/api/vendor', APIRoutes.VendorAPIUnrestricted);
app.use('/api/vendor', APIRoutes.VendorAPI);

// Error handler
app.use(errorHandler);

// Start server
let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(chalk.green('Server started'));
});