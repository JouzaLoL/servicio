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
        res.status(err.status || 500).json(serializeError(err));
        return;
    }
}

module.exports = handleError;