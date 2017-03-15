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
    switch (err.type) {
        case 'UserNotFound':
            return res.json({
                success: false,
                error: err.type,
                message: 'User with the provided email was not found'
            });
            break;
        case 'DBError':
            return res.json({
                success: false,
                error: err.type,
                message: 'A database error has occured'
            });
            break;
        default:
        // TODO: If production, then only send error name and message
            res.json(serializeError(err));
            break;
    }
}

module.exports = handleError;