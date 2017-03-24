var Ajv = require('ajv');
var ajv = new Ajv({
    allErrors: true
});


/**
 * Express middleware for validating requests
 *
 * @param {any} options
 * @returns
 */
function validate(options) {
    return function (req, res, next) {
        var validationErrors = {};

        Object.keys(options).forEach(function (requestProperty) {
            let schema = options[requestProperty];
            let innerValidate = ajv.compile(schema);

            var valid = innerValidate(req[requestProperty]);

            if (!valid) {
                validationErrors[requestProperty] = innerValidate.errors;
            }
        });

        if (Object.keys(validationErrors).length != 0) {
            next(new ValidationError(validationErrors));
        } else {
            next();
        }
    };
}


/**
 * Validation Error
 *
 * @class ValidationError
 * @extends {Error}
 */
class ValidationError extends Error {

    /**
     * Creates an instance of ValidationError.
     * @param {any} validationErrors
     *
     * @memberOf ValidationError
     */
    constructor(validationErrors) {
        super();
        this.name = 'JsonSchemaValidation';
        this.validationErrors = validationErrors;
    }
};

module.exports = {
    validate,
    ValidationError
};