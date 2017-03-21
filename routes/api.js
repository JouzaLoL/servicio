// HTTP status codes
// 200 – OK – Eyerything is working
// 201 – OK – New resource has been created
// 204 – OK – The resource was successfully deleted, ! NO RESPONSE BODY !

// 400 – Bad Request – The request was invalid or cannot be served. The exact error should be explained in the error payload. E.g. „The JSON is not valid“
// 401 – Unauthorized – The request requires an user authentication
// 403 – Forbidden – The server understood the request, but is refusing it or the access is not allowed.
// 404 – Not found – There is no resource behind the URI.
// 422 – Unprocessable Entity – Should be used if the server cannot process the enitity, e.g. if an image cannot be formatted or mandatory fields are missing in the payload.

// 500 – Internal Server Error – API developers should avoid this error. If an error occurs in the global catch block, the stracktrace should be logged and not returned as response.

let app = require('../app.js');

// Models
let UserModels = require(__base + 'models/User');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;

// Modules
let jwt = require('jsonwebtoken');
let express = require('express');
let moment = require('moment');

// Route RouteHelper
let RouteHelper = require(__base + 'routes/routeHelper');

// Validation
let validate = require('express-validation');
let validation = require(__base + 'validation/validation');

// Init vars
var APIRoutes = express.Router();
var RestrictedAPIRoutes = express.Router();


// JWT Verification middleware
RestrictedAPIRoutes.use(RouteHelper.verifyToken);

// Register a new user
APIRoutes.post('/register', validate(validation.register), (req, res, next) => {
  var newUser = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    telephone: req.body.telephone
  });

  // Save the new User to DB
  newUser
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'Register successful', {
        user: newUser
      }));
    })
    .catch((error) => {
      next(error);
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
        next(new Error('User not found in database'));
      } else if (user) {
        // User found
        // Verify password
        user.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(new Error("Passwords don't match"));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign(user, app.get('superSecret'), {
              expiresIn: '24h'
            });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'Token generated', {
              token: token
            }));
          }
        });
      }
    })
    .catch((error) => {
      next(error);
    });
});

// Get User Document
RestrictedAPIRoutes.get('/user', (req, res, next) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, 'User found', {
        user: user
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Get Cars
RestrictedAPIRoutes.get('/user/cars', (req, res, next) => {
  var userID = req.decodedToken._doc._id;
  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, '', {
        cars: user.cars
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Add new Car
RestrictedAPIRoutes.post('/user/cars/', validate(validation.newCar), (req, res, next) => {
  var userID = req.decodedToken._doc._id;

  var newCar = new Car({
    model: req.body.model,
    year: req.body.year
  });

  getUser(userID)
    .then((user) => {
      user.cars.push(newCar);
      user.save((err, savedUser) => {
        if (err) {
          throw err;
        }
        res.status(201).json(RouteHelper.BasicResponse(true, 'Car added', {
          car: savedUser._doc.cars.id(newCar._id)
        }));
      });
    })
    .catch((error) => {
      next(error);
    });
});

// Remove Car
RestrictedAPIRoutes.delete('/user/cars/:id/', (req, res, next) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      let car = user.cars.id(req.params.id);
      if (car) {
        car.remove();
      } else {
        res.status(404).json(RouteHelper.BasicResponse(false, 'No Car matches the ID'));
      }

      user
        .save()
        .then(() => {
          res.status(204);
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
});

// Get Car's Service entries
RestrictedAPIRoutes.get('/user/cars/:id/services', (req, res, next) => {
  var userID = req.decodedToken._doc._id;

  getUser(userID)
    .then((user) => {
      var car = user._doc.cars.id(req.params.id);
      res.json(RouteHelper.BasicResponse(true, '', {
        serviceBook: car.serviceBook
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Add new Service entry
RestrictedAPIRoutes.post('/user/cars/:id/services/', validate(validation.newService), (req, res, next) => {
  var userID = req.decodedToken._doc._id;

  var newService = new Service({
    date: moment().format(req.body.date + ""),
    cost: req.body.cost,
    description: req.body.description
  });

  getUser(userID)
    .then((user) => {
      var car = user.cars.id(req.params.id);
      if (!car) {
        return res.json(RouteHelper.BasicResponse(false, 'Car not found').status(404));
      }
      car.serviceBook.push(newService);
      // Need to save embedded doc first, then parent doc !
      car
        .save()
        .then((savedCar) => {
          user
            .save()
            .then(() => {
              res.status(201).json(RouteHelper.BasicResponse(true, 'Service added', {
                service: savedCar.serviceBook.id(newService._id)
              }));
            }).catch((error) => {
              next(error);
            });
        }).catch((error) => {
          next(error);
        });
    }).catch((error) => {
      next(error);
    });
});

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
        if (user) {
          resolve(user);
        } else {
          reject('No user found');
        }
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