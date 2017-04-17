'use strict';

let serializeError = require('serialize-error');
let routeHelper = require('../routes/routeHelper');
let chalk = require('chalk');
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
        if (err.name == 'JsonSchemaValidationError') {
            res.status(400).json({
                success: false,
                statusText: 'Bad Request',
                error: FormatValidationError(err.validationErrors)
            });
            return;
        } else {
            res.status(err.status ? err.status : 400).json(
                routeHelper.BasicResponse(false, 'An error occured', {
                    error: {
                        status: err.status,
                        method: err.method,
                        path: err.path
                    }
                }));
        }
    } else {
        // Need to JSON.stringify all errors before using chalk on them
        if (err.name == 'JsonSchemaValidationError') {
            let formattedError = FormatValidationError(err.validationErrors);
            res.status(400).json(routeHelper.BasicResponse(false, 'Bad Request', {
                error: formattedError
            }));
            if (process.env.NODE_ENV != ('production')) {
                console.log(chalk.white.bgRed('Validation Error:') + ' ' + chalk.red(JSON.stringify(formattedError)));
            }
        } else {
            res.status(err.status || 500).json(serializeError(err));
            if (process.env.NODE_ENV != ('production')) {
                console.log(chalk.white.bgRed('Error:') + ' ' + chalk.red(JSON.stringify(serializeError(err))));
            }
        }
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