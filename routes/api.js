var User = require('../models/User');
var jwt = require('jsonwebtoken');
var app = require('../app.js');
var express = require('express');

var APIRoutes = express.Router();
var RestrictedAPIRoutes = express.Router();

// Register a new user
APIRoutes.post('/register', (req, res) => {
  // Validate that all required data is present
  if (validateUserData(req)) {
    var newUser = new User({
      email: req.body.email,
      password: req.body.password
    });

    // Save the new User to DB
    newUser
      .save()
      .then((err) => {
        // New user saved successfully
        res.json({
          success: true,
          message: 'Registered successfully. Authenticate to get API key.',
          user: {
            mail: newUser._doc.email
          }
        });
      })
      .catch((error) => {
        res.json({
          success: false,
          error: error.code,
          message: 'Lookup the above error code for more information'
        });
      });
  } else {
    // Required data not present, return error
    res.json({
      success: false,
      error: 'Required data not provided.'
    });
  }
});


/**
 * Validates user data
 *
 * @param {any} req
 * @returns
 */
function validateUserData(req) {
  return (req.body.email && req.body.password);
}

// Authenticate a user
APIRoutes.post('/authenticate', function (req, res) {
  // Retrieve user from DB
  User
    .findOne({
      email: req.body.email
    })
    .then((user) => {
      // No user found
      if (!user) {
        res.json({
          success: false,
          message: 'Authentication failed. User not found.'
        });
      } else if (user) {
        // User found
        // Verify password
        user.comparePassword(req.body.password, (error, isMatch) => {
          if (error) {
            res.json({
              success: false,
              message: 'Authentication failed. Wrong password.'
            });
          } else {
            // Passsword OK
            // Create a token
            let token = jwt.sign(user, app.get('superSecret'), {
              expiresIn: 1440 // 1440 minutes = 24 hours
            });

            // return the information including token as JSON
            res.json({
              success: true,
              message: 'Token generated successfully',
              token: token
            });
          }
        });
      }
    })
    .catch((error) => {
      throw error;
    });
});

// JWT Verification middleware
RestrictedAPIRoutes.use(function (req, res, next) {
  // Chheck header, url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // Token provided
  if (token) {
    // Verify token and check expiration
    jwt
      .verify(token, app.get('superSecret'), (error, decodedToken) => {
        if (error) {
          return res.json({
            success: false,
            error: error,
            message: 'Failed to authenticate token.'
          });
        } else {
          req.decodedToken = decodedToken;
          next();
        }
      });
  } else {
    // No token provided
    return res.status(403).json({
      success: false,
      error: 'No token provided.',
      message: 'Some API endpoints require a valid token to be included in the request. Authenticate to get one.'
    });
  }
});

RestrictedAPIRoutes.get('/', (req, res) => {
  res.json({
    user: req.decodedToken._doc.email,
    message: 'welcome'
  });
});

// Export all routes
module.exports = {
  APIRoutes,
  RestrictedAPIRoutes
};