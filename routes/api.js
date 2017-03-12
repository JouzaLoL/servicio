let UserModels = require('../models/User');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;
let jwt = require('jsonwebtoken');
let app = require('../app.js');
let express = require('express');
let moment = require('moment');

var APIRoutes = express.Router();
var RestrictedAPIRoutes = express.Router();
// Testing new git email
// Register a new user
APIRoutes.post('/register', (req, res) => {
  // Validate that all required data is present
  if (validateUserData(req)) {
    var newUser = new User({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name || '',
      telephone: req.body.telephone || '',
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
        handleDBError(error, res);
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
              expiresIn: '24h'
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

// Test restricted route
RestrictedAPIRoutes.get('/test', (req, res) => {
  res.json({
    user: req.decodedToken._doc.email,
    message: 'Test successful.'
  });
});

// Get User Document
RestrictedAPIRoutes.get('/user', (req, res) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      res.json(user);
    }, (error) => {
      handleDBError(error, res);
    });
});

// Get Cars
RestrictedAPIRoutes.get('/user/cars', (req, res) => {
  var userID = req.decodedToken._doc._id;
  getUser(userID)
    .then((user) => {
      res.json(user.cars);
    }, (error) => {
      handleDBError(error, res);
    });
});

// Add new Car
RestrictedAPIRoutes.post('/user/cars/add', (req, res) => {
  if (req.body.model) {
    var userID = req.decodedToken._doc._id;
    var newCar = new Car({
      model: req.body.model,
      year: req.body.year || ''
    });
    getUser(userID)
      .then((user) => {
        user.cars.push(newCar);
        user.save().then((user) => {
          res.json({
            success: true,
            message: 'Car added successfully'
          });
        });
      }, (error) => {
        handleDBError(error, res);
      });
  } else {
    // Required data not present, return error
    res.json({
      success: false,
      error: 'Required data not provided.'
    });
  }
});

// Remove Car
RestrictedAPIRoutes.delete('/user/cars/:id/remove', (req, res) => {
  var userID = req.decodedToken._doc._id;
  getUser(userID)
    .then((user) => {
      user._doc.cars.id(req.params.id).remove();
      user.save().then((user) => {
        res.json({
          success: true,
          message: 'Car removed successfully'
        });
      });
    }, (error) => {
      handleDBError(error, res);
    });
});

// Get Car's Service entries
RestrictedAPIRoutes.get('/user/cars/:id/service', (req, res) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      var car = user._doc.cars.id(req.params.id);
      res.json(car.serviceBook);
    }, (error) => {
      handleDBError(error, res);
    });
});

// Add new Service entry
RestrictedAPIRoutes.post('/user/cars/:id/service/add', (req, res) => {
  var userID = req.decodedToken._doc._id;
  // Verify provided data
  if (req.body.date && req.body.cost && req.body.description) {
    var newService = new Service({
      date: moment().format(req.body.date),
      cost: req.body.cost,
      description: req.body.description
    });
    getUser(userID)
      .then((user) => {
        var car = user._doc.cars.id(req.params.id);
        car.serviceBook.push(newService);
        // Need to save embedded doc first, then parent doc !
        car.save().then((car) => {
          user.save().then((user) => {
            res.json({
              success: true,
              message: 'Service added successfully'
            });
          }, (error) => {
            handleDBError(error, res);
          });
        }, (error) => {
          handleDBError(error, res);
        });
      }, (error) => {
        handleDBError(error, res);
      });
  } else {
    // Data not provided
    res.json({
      success: false,
      error: 'Required data not provided.'
    });
  }
});

/**
 * Handles Database errors
 *
 * @param {any} error
 * @param {any} res
 */
function handleDBError(error, res) {
  res.json({
    success: false,
    error: error.code,
    message: 'Lookup the above error code for more information'
  });
}

/**
 * Gets User from DB by ID
 * 
 * @param {any} id
 * @returns
 */
function getUser(id) {
  return new Promise((resolve, reject) => {
    User
      .findOne({
        _id: id
      })
      .then((user) => {
        resolve(user);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Export all routes
module.exports = {
  APIRoutes,
  RestrictedAPIRoutes
};