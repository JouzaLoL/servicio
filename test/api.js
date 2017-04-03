'use strict';

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the app after setting NODE_ENV
let app = require('../app.js');

// DB, Models and Schema
let mongoose = require("mongoose");
let Models = require(__base + 'models/User.js');
let User = Models.User;
let Car = Models.Car;
let Service = Models.Service;

// Receipt stuff
let fs = require('fs');
let imageType = require('image-type');

// Log all db access to console
// mongoose.set('debug', true);

// JSON Schema
let Schema = require(__base + 'jsonschema/schema.js');

// Authentication
let jwt = require('jsonwebtoken');
let moment = require('moment');

// Dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;

// Chai setup
chai.use(require('chai-http'));
chai.use(require('chai-json-schema'));

// Top-level test block
describe('Tests', () => {
    // Top-level cleanup before all tests
    before((done) => {
        TestHelper.prepareDB(mongoose).then((err) => {
            done(err);
        });
    });

    // Top-level cleanup after all tests
    after((done) => {
        TestHelper.prepareDB(mongoose).then((err) => {
            done(err);
        });
    });

    describe('System', () => {
        describe('register', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose).then((err) => {
                    done(err);
                });
            });

            it('should register a new user', (done) => {
                chai.request(app)
                    .post('/api/register')
                    .send({
                        email: "test@test.com",
                        password: "testpass",
                        name: "Test Testingson",
                        telephone: "420420420"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        done();
                    });
            });

            it('should not register a new user with illegal email', (done) => {
                chai.request(app)
                    .post('/api/register')
                    .send({
                        email: "bademail",
                        password: "testpass",
                        name: "Test Testingson",
                        telephone: "420420420"
                    })
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        done();
                    });
            });
        });

        describe('authenticate', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose, true).then(() => {
                    done();
                });
            });

            it('should authenticate a registered user', (done) => {
                chai.request(app)
                    .post('/api/authenticate')
                    .send({
                        email: "test@test.com",
                        password: "testpass"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        done();
                    });
            });

            it('should not authenticate a registered user against a bad password', (done) => {
                chai.request(app)
                    .post('/api/authenticate')
                    .send({
                        email: "test@test.com",
                        password: "badpass"
                    })
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(500);
                        done();
                    });
            });
        });
    });

    describe('User', () => {
        // Test user object for use in tests
        let testUser;

        // The API key
        var APIKey;

        before((done) => {
            TestHelper.prepareDB(mongoose, true).then((user) => {
                testUser = user;
                APIKey = TestHelper.getAPIKey(testUser);
                done();
            });
        });

        it('should get the user document', (done) => {
            chai.request(app)
                .get('/api/user')
                .set('x-access-token', APIKey)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    expect(res.body.user).to.be.jsonSchema(Schema.Type.User);
                    done();
                });
        });

        describe('Car', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose, true).then((user) => {
                    testUser = user;
                    APIKey = TestHelper.getAPIKey(testUser);
                    done();
                });
            });

            it("should get user's cars", (done) => {
                chai.request(app)
                    .get('/api/user/cars')
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.cars).to.be.jsonSchema(Schema.Type.CarArray);
                        done();
                    });
            });

            it("should add new car", (done) => {
                chai.request(app)
                    .post('/api/user/cars')
                    .set('x-access-token', APIKey)
                    .send({
                        model: "Test Model",
                        year: "2420"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.car).to.be.jsonSchema(Schema.Type.Car);
                        done();
                    });
            });

            it("should update an existing car", (done) => {
                let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                chai.request(app)
                    .patch('/api/user/cars/' + randomCarId)
                    .set('x-access-token', APIKey)
                    .send({
                        model: "Updated Model",
                        year: "1999"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.updatedCar).to.be.jsonSchema(Schema.Type.Car);
                        done();
                    });
            });

            it("should remove a car", (done) => {
                let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                chai.request(app)
                    .delete('/api/user/cars/' + randomCarId)
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(204);
                        done();
                    });
            });

            describe('Service', () => {
                before((done) => {
                    TestHelper.prepareDB(mongoose, true).then((user) => {
                        testUser = user;
                        APIKey = TestHelper.getAPIKey(testUser);
                        done();
                    });
                });

                it("should get Car's service entries", (done) => {
                    let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                    chai.request(app)
                        .get('/api/user/cars/' + randomCarId + '/services')
                        .set('x-access-token', APIKey)
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                            expect(res.body.serviceBook).to.be.jsonSchema(Schema.Type.ServiceArray);
                            done();
                        });
                });

                it("should add new service entry", (done) => {
                    let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                    let image = fs.readFileSync('test/receipt.jpg');
                    chai.request(app)
                        .post('/api/user/cars/' + randomCarId + '/services')
                        .set('x-access-token', APIKey)
                        .send({
                            date: moment().toISOString(),
                            cost: "42069",
                            description: "Removed the driving wheel; not needed anymore since we have self-driving cars",
                            receipt: {
                                data: new Buffer(image).toString('base64'),
                                contentType: imageType(image).mime
                            }
                        })
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(201);
                            expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                            done();
                        });
                });
            });
        });
    });
});

/**
 * Contains common helper methods for tests
 *
 * @class TestHelper
 */
class TestHelper {
    /**
     * Adds a test user to the DB
     *
     * @param {any} done Callback for Mocha to finish
     * @param {any} user The newly created User document
     * @memberOf TestHelper
     */
    static addTestUser() {
        return new Promise((resolve, reject) => {
            let image = fs.readFileSync('test/receipt.jpg');
            var testUser = new User({
                email: "test@test.com",
                password: "testpass",
                name: "Test Testingson",
                telephone: "420420420",
                cars: [
                    new Car({
                        model: 'Skoda Octavia',
                        year: '2011',
                        serviceBook: [
                            new Service({
                                date: new Date(Date.now()),
                                cost: '3200',
                                description: 'Replaced brakes',
                                receipt: {
                                    data: new Buffer(image).toString('base64'),
                                    contentType: imageType(image).mime
                                }
                            })
                        ]
                    })
                ]
            });

            testUser.save((err, user) => {
                if (err) {
                    reject(err);
                }
                resolve(user);
            });
        });
    }

    /**
     * Signs a new Auth Token for the user specified
     *
     * @param {any} user
     * @returns Auth Token
     *
     * @memberOf TestHelper
     */
    static getAPIKey(user) {
        return jwt.sign({id: user.id}, app.get('superSecret'), {
            expiresIn: '24h'
        });
    }

    /**
     * Cleans the database and optionally adds a test user
     *
     * @static
     * @param {any} db
     * @param {any} done
     * @param {any} addTestUser
     *
     * @memberOf TestHelper
     */
    static prepareDB(db, addTestUser) {
        return new Promise((resolve, reject) => {
            // Drop the whole database
            db.connection.dropDatabase()
                .then(() => {
                    if (addTestUser) {
                        TestHelper.addTestUser()
                            .catch((err) => {
                                resolve(err);
                            })
                            .then((user) => {
                                resolve(user);
                            });
                    } else {
                        resolve();
                    }
                })
                .catch((err) => {
                    resolve(err);
                });
        });
    }
}