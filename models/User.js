const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    date: Date,
    cost: String,
    description: String
});

const carSchema = new mongoose.Schema({
    model: String,
    year: String,
    serviceBook: [serviceSchema]
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: String,
    telephone: String,
    cars: [carSchema]
}, {
    timestamps: true
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

// Helper method for validating password
userSchema.methods.comparePassword = function comparePassword(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        callback(err, isMatch);
    });
};

const Service = mongoose.model('Service', serviceSchema);
const Car = mongoose.model('Car', carSchema);
const User = mongoose.model('User', userSchema);

module.exports = User;