let Joi = require('joi');

module.exports = {
    register: {
        body: {
            email: Joi.string().email().required(),
            password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required(),
            name: Joi.string(),
            telephone: Joi.string().length(9)
        }
    },
    authenticate: {
        body: {
            email: Joi.string().email().required(),
            password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).required(),
        }
    },
    newCar: {
        body: {
            model: Joi.string().required(),
            year: Joi.number().required()
        }
    },
    newService: {
        body: {
            date: Joi.date().required(),
            cost: Joi.number().required(),
            description: Joi.string().min(5).max(300).required()
        }
    }
};