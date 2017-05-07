'use strict';
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

// Always require app first
let app = require('../app');
let express = require('express');

// Modules
let jwt = require('jsonwebtoken');
let moment = require('moment');
let imageType = require('image-type');

// Database Stuff
let UserModels = require(__base + 'models/User');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;
let Vendor = UserModels.Vendor;

// Route Helper
let RouteHelper = require(__base + 'routes/routeHelper');

// Validation
var Validator = require('express-json-validator-middleware').Validator;
var validator = new Validator({allErrors: true});
var validate = validator.validate.bind(validator);
let Schema = require(__base + 'jsonschema/schema.js');

// Init vars
var UserAPIUnrestricted = express.Router();
var VendorAPIUnrestricted = express.Router();
var UserAPI = express.Router();
var VendorAPI = express.Router();

// JWT Verification middleware
UserAPI.use(RouteHelper.verifyToken);
VendorAPI.use(RouteHelper.verifyToken);

/*
BEGIN UNRESTRICTED USER API
*/

UserAPIUnrestricted.post('/register', validate({
  body: Schema.Type.User
}), function (req, res, next) {
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
      res.status(201).json(RouteHelper.BasicResponse(true, 'User register successful', {
        user: RouteHelper.strip(newUser)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

UserAPIUnrestricted.post('/authenticate', validate({
  body: Schema.Request.Authenticate
}), function (req, res, next) {
  // Retrieve user from DB
  User
    .findOne({
      email: req.body.email
    })
    .then((user) => {
      // No user found
      if (!user) {
        next(Object.assign(Error('User not found in database'), {name: 'UserNotFound'}));
      } else if (user) {
        // User found
        // Verify password
        user.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(Object.assign(Error("Passwords don't match"), {name: 'BadPassword'}));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign({
              id: user.id
            }, app.get('superSecret'), {
                expiresIn: '24h'
              });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'Authentication success. Token generated', {
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

/*
END UNRESTRICTED USER API
*/

/*
BEGIN UNRESTRICTED VENDOR API
*/

VendorAPIUnrestricted.post('/register', validate({
  body: Schema.Type.Vendor
}), function (req, res, next) {
  var newVendor = new Vendor({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  // Save the new User to DB
  newVendor
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'Vendor register successful', {
        user: newVendor
      }));
    })
    .catch((error) => {
      next(error);
    });
});

VendorAPIUnrestricted.post('/authenticate', validate({
  body: Schema.Request.Authenticate
}), function (req, res, next) {
  // Retrieve user from DB
  Vendor
    .findOne({
      email: req.body.email
    })
    .then((vendor) => {
      // No vendor found
      if (!vendor) {
        next(Object.assign(Error('User not found in database'), {name: 'UserNotFound'}));
      } else if (vendor) {
        // vendor found
        // Verify password
        vendor.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(Object.assign(Error("Passwords don't match"), {name: 'BadPassword'}));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign({
              id: vendor.id
            }, app.get('superSecret'), {
                expiresIn: '24h'
              });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'Authentication success. Token generated', {
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

/*
END UNRESTRICTED VENDOR API
*/

/*
BEGIN RESTRICTED USER API
*/

// Get User Document
UserAPI.get('/', (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, 'User found', {
        user: RouteHelper.strip(user)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Get Cars
UserAPI.get('/cars', (req, res, next) => {
  var userID = req.decodedToken.id;
  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, '', {
        cars: RouteHelper.strip(user.cars, ['_id'])
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Add new Car
UserAPI.post('/cars', validate({
  body: Schema.Request.NewCar
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  var newCar = new Car({
    model: req.body.model,
    year: req.body.year,
    SPZ: req.body.SPZ
  });

  getUser(userID)
    .then((user) => {
      user.cars.push(newCar);
      user.markModified('cars');
      user.save((savedUser) => {
        res.status(201).json(RouteHelper.BasicResponse(true, 'Car added', {
          car: RouteHelper.strip(user.cars.id(newCar._id), ['_id'])
        }));
      });
    })
    .catch((error) => {
      next(error);
    });
});

// Update an existing Car
UserAPI.patch('/cars/:id/', validate({
  body: Schema.Request.PatchCar
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      let carToBeUpdated = user.cars.id(req.params.id);
      if (!carToBeUpdated) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'No Car matches the ID'));
      }

      Object.keys(req.body).forEach(function (key) {
        carToBeUpdated[key] = req.body[key];
      });

      user
        .save()
        .then((savedUser) => {
          res.status(201).json(RouteHelper.BasicResponse(true, 'Car updated', {
            updatedCar: RouteHelper.strip(savedUser.cars.id(carToBeUpdated.id), ['_id'])
          }));
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
UserAPI.delete('/cars/:id/', validate({
  params: Schema.Request.Params.ID
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      let car = user.cars.id(req.params.id);
      if (car) {
        car
          .remove()
          .then((removedCar) => {
            user
              .save()
              .then(() => {
                // ! Always either send data or end response with end()
                res.status(204).end();
              })
              .catch((error) => {
                next(error);
              });
          })
          .catch((err) => {
            next(err);
          });
      } else {
        res.status(404).json(RouteHelper.BasicResponse(false, 'No Car matches the ID'));
      }
    })
    .catch((error) => {
      next(error);
    });
});

// Get Car's Service entries
UserAPI.get('/cars/:id/services', (req, res, next) => {
  var userID = req.decodedToken.id;
  getUser(userID)
    .then((user) => {
      let car = user.cars.id(req.params.id);
      if (!car) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found'));
      } else {
        return res.json(RouteHelper.BasicResponse(true, '', {
          serviceBook: RouteHelper.strip(car.serviceBook)
        }));
      }
    })
    .catch((error) => {
      next(error);
    });
});

/*
END RESTRICTED USER API
*/
// TRAVIS TRIGGERED
/*
BEGIN RESTRICTED VENDOR API
*/

VendorAPI.get('/cars/search/:query', validate({
  params: Schema.Request.Search,
}), (req, res, next) => {
  let query = req.params.query;

  User
    .findOne({
      cars: {
        $elemMatch: {
          SPZ: query
        }
      }
    })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found'));
      } else {
        let car = user.cars.find((elem) => {
          return elem.SPZ = query;
        });

        return res.json(RouteHelper.BasicResponse(true, 'Car found', {
          car: RouteHelper.strip(car)
        }));
      }
    });
});

VendorAPI.post('/cars/:id/services/', validate({
  body: Schema.Request.NewService,
  params: Schema.Request.Params.ID
}), (req, res, next) => {
  var VendorID = req.decodedToken.id;
  let image = new Buffer(req.body.receipt.data, 'base64');

  var newService = new Service({
    date: req.body.date ? moment().format(req.body.date + "") : moment().format(),
    cost: req.body.cost,
    description: req.body.description,
    vendorID: VendorID,
    receipt: {
      data: image,
      contentType: imageType(image).mime
    }
  });

  User
    .findOne({
      cars: {
        $elemMatch: {
          _id: req.params.id
        }
      }
    })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found'));
      } else {
        let car = user.cars.find((elem) => {
          return elem.id = req.params.id;
        });

        car.serviceBook.push(newService);
        car.markModified('serviceBook');
        // Need to save embedded doc first, then parent doc !
        car
          .save()
          .then((savedCar) => {
            user
              .save()
              .then(() => {
                res.status(201).json(RouteHelper.BasicResponse(true, 'Service added', {
                  service: RouteHelper.strip(user.cars.id(car.id).serviceBook.id(newService._id))
                }));
              }).catch((error) => {
                next(error);
              });
          }).catch((error) => {
            next(error);
          });
      }
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
  UserAPIUnrestricted,
  VendorAPIUnrestricted,
  UserAPI,
  VendorAPI
};