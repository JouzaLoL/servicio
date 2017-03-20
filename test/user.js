'use strict';

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the app after setting NODE_ENV
let app = require('../app.js');

let mongoose = require("mongoose");
let User = require(__base + 'models/User.js').User;
let jwt = require('jsonwebtoken');

// Require the dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;

chai.use(require('chai-http'));
chai.use(require('chai-json-schema'));

let Schema = require(__base + 'jsonschema/schema.js');

// ! Need to .set('content-type', 'application/x-www-form-urlencoded') for every request

// Parent block
describe('User', () => {
    before((done) => {
        mongoose.connection.dropDatabase((err) => {
            console.log('dropped db');
            done(err);
        });
    });

    afterEach((done) => {
        mongoose.connection.dropDatabase((err) => {
            console.log('dropped db');
            done(err);
        });
    });

    describe('register', () => {
        it('should register a new user', (done) => {
            chai.request(app)
                .post('/api/register')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: "test@test.com",
                    password: "testpass",
                    name: "Test Testingson",
                    telephone: "420420420"
                })
                .end((err, res) => {
                    if (err) {
                        console.log(err);
                    }
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });
    });

    describe('bad register', () => {
        it('should not register a new user with illegal email', (done) => {
            chai.request(app)
                .post('/api/register')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: "bademail",
                    password: "testpass",
                    name: "Test Testingson",
                    telephone: "420420420"
                })
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
    });

    describe('authenticate', () => {
        before((done) => {
            TestHelper.addTestUser().then((user) => {
                done();
            }, (err) => {
                done(err);
            });
        });

        it('should authenticate a registered user', (done) => {
            chai.request(app)
                .post('/api/authenticate')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: "test@test.com",
                    password: "testpass"
                })
                .end((err, res) => {
                    if (err) {
                        console.log(err);
                    }
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });

    describe('bad authenticate', () => {
        before((done) => {
            TestHelper.addTestUser().then((user) => {
                done();
            }, (err) => {
                done(err);
            });
        });

        it('should not authenticate a registered user against a bad password', (done) => {
            chai.request(app)
                .post('/api/authenticate')
                .set('content-type', 'application/x-www-form-urlencoded')
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

    describe('get user document', () => {
        // The API key
        var authkey;

        before((done) => {
            TestHelper.addTestUser()
                .catch((err) => {
                    done(err);
                })
                .then((user) => {
                    authkey = TestHelper.getAuthKey(user);
                    done();
                });
        });

        it('should get the user document', (done) => {
            chai.request(app)
                .get('/api/user')
                .set('content-type', 'application/x-www-form-urlencoded')
                .set('x-access-token', authkey)
                .end((err, res) => {
                    if (err) {
                        console.log(err);
                    }
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    expect(res.body.user).to.be.jsonSchema(Schema.Type.User);
                    done();
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
            var testUser = new User({
                email: "test@test.com",
                password: "testpass",
                name: "Test Testingson",
                telephone: "420420420"
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
    static getAuthKey(user) {
        return jwt.sign(user, app.get('superSecret'), {
            expiresIn: '24h'
        });
    }
}