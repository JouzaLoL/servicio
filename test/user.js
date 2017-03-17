'use strict';
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the app after setting NODE_ENV
let server = require('../app.js');

let mongoose = require("mongoose");
let User = require(__base + 'models/User.js').User;

// Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');

let expect = require('chai').expect;

chai.use(chaiHttp);

// ! Need to .set('content-type', 'application/x-www-form-urlencoded') for every request

// Our parent block
describe('User', () => {
    before((done) => {
        // // Clean the database
        // User.remove({}, (err) => {
        //     console.log('cleaned the db');
        //     done();
        // });

        mongoose.connection.dropDatabase((err) => {
            done(err);
        });
    });

    describe('register', () => {
        it('should register a new user', (done) => {
            chai.request(server)
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
                    done();
                });
        });
    });

    describe('bad register', () => {
        it('should not register a new user with illegal email', (done) => {
            chai.request(server)
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
            var testUser = new User({
                email: "test@test.com",
                password: "testpass",
                name: "Test Testingson",
                telephone: "420420420"
            });

            testUser.save((err, user) => {
                done(err);
            });
        });

        it('should authenticate a registered user', (done) => {
            chai.request(server)
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
            var testUser = new User({
                email: "test@test.com",
                password: "testpass",
                name: "Test Testingson",
                telephone: "420420420"
            });

            testUser.save((err, user) => {
                done(err);
            });
        });

        it('should not authenticate a registered user with bad password', (done) => {
            chai.request(server)
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
        before((done) => {
            var testUser = new User({
                email: "test@test.com",
                password: "testpass",
                name: "Test Testingson",
                telephone: "420420420"
            });

            testUser.save((err, user) => {
                done(err);
            });
        });

        it('should get the use document', (done) => {
            chai.request(server)
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
});