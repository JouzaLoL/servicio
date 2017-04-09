let jwt = require('jsonwebtoken');
let app = require('../app.js');

/**
 * Contains helper methods for use in API routes
 *
 * @class RouteHelper
 */
class RouteHelper {

    /**
     * Creates a basic response (adherent to the schema), with optional parameters
     *
     * @static
     * @param {any} success Was the API call successful?
     * @param {any} message Information
     * @param {any} params Additional params
     *
     * @memberOf RouteHelper
     */
    static BasicResponse(success, message, params) {
        var response = {
            success: success,
            message: message,
        };
        Object.assign(response, params);
        return response;
    }

    /**
     * Verifies JSON Web Token
     *
     * @static
     * @param {any} req
     * @param {any} res
     * @param {any} next
     *
     * @memberOf RouteHelper
     */
    static verifyToken(req, res, next) {
        // Check header, url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (token) {
            // Verify token and check expiration
            jwt
                .verify(token, app.get('superSecret'), (error, decodedToken) => {
                    if (error) {
                        next(error);
                    } else {
                        // Pass the decoded token to the rest of the request
                        req.decodedToken = decodedToken;
                        next();
                    }
                });
        } else {
            res.json(RouteHelper.BasicResponse(false, 'No token provided')).status(401);
        }
    }
}

module.exports = RouteHelper;