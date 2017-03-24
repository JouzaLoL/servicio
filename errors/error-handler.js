let serializeError = require('serialize-error');
/**
 * Handles errors
 *
 * @param {any} err
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
function handleError(err, req, res, next) {
    if (process.env.NODE_ENV == 'production') {
        res.status(err.status).json({
            message: 'An error occured',
            error: {
                status: err.status,
                method: err.method,
                path: er.path
            }
        });
    } else {
        if (err.name == 'JsonSchemaValidation') {
            res.status(400).json({
                success: false,
                statusText: 'Bad Request',
                error: FormatValidationError(err.validationErrors)
            });
            // console.log(FormatValidationError(err.validationErrors));
            return;
        }
        res.status(err.status || 500).json(serializeError(err));
    }
}


/**
 * Formats a ValidationError error
 *
 * @param {any} errors
 */
function FormatValidationError(errors) {
    var formatted = {};
    Object.keys(errors).forEach(function (requestProperty) {
        var propertyErrors = [];
        errors[requestProperty].forEach(function (error) {
            propertyErrors.push(error.dataPath + ": " + error.message);
        });
        formatted[requestProperty] = propertyErrors.toString();
    });
    return formatted;
}

module.exports = handleError;