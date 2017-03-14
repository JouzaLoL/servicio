let UserModels = require('../models/User');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;

let jwt = require('jsonwebtoken');
let app = require('../app.js');
let express = require('express');
let moment = require('moment');

let validate = require('express-validation');
let validation = require('../validation/validation');

var APIRoutes = express.Router();
var RestrictedAPIRoutes = express.Router();

// Register a new user
APIRoutes.post('/register', validate(validation.register), (req, res) => {
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
});

// Authenticate a user
APIRoutes.post('/authenticate', validate(validation.authenticate), function (req, res, next) {
  // Retrieve user from DB
  User
    .findOne({
      email: req.body.email
    })
    .then((user) => {
      // No user found
      if (!user) {
        next();
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
      message: 'Restricted API endpoints require a valid token to be included in the request. Authenticate to get one.'
    });
  }
});

// Restricted route test
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
    })
    .catch((error) => {
      next(error);
    });
});

// Get Cars
RestrictedAPIRoutes.get('/user/cars', (req, res) => {
  var userID = req.decodedToken._doc._id;
  getUser(userID)
    .then((user) => {
      res.json(user.cars);
    })
    .catch((error) => {
      next(error);
    });
});

// Add new Car
RestrictedAPIRoutes.post('/user/cars/add', validate(validation.newCar), (req, res) => {
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
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
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
        })
        .catch((error) => {
          next(error);
        });
    }).catch((error) => {
      next(error);
    });
});

// Get Car's Service entries
RestrictedAPIRoutes.get('/user/cars/:id/service', (req, res) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      var car = user._doc.cars.id(req.params.id);
      res.json(car.serviceBook);
    })
    .catch((error) => {
      next(error);
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