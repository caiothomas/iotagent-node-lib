/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-pep-steelskin
 *
 * fiware-pep-steelskin is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-pep-steelskin is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-pep-steelskin.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[iot_support@tid.es]
 */

'use strict';

var request = require('request'),
    config = require('../../commonConfig'),
    errors = require('../../errors'),
    fs = require('fs'),
    path = require('path'),       
    logger = require('logops'),
    async = require('async'),
    apply = async.apply,
    context = {
        op: 'Common.Authorization'
    };  

function authenticate(req, res, next){
    var userToken = req.headers['x-auth-token']
    var options = {
        url: config.getConfig().authentication.protocol  + config.getConfig().authentication.host + ':' +
            config.getConfig().authentication.port + config.getConfig().authentication.checktoken,
        method: 'GET',
        qs: {
            'access_token': userToken
        }
    };
        
    logger.debug('Retrieving user from Figuardian %j', options, null, 4);

    request(options, function(error, response, body) {
        if (error) {
            logger.error(context, 'Error connecting the Figuardian for authentication: %s', error.message);
            next(new errors.AuthenticationTokenError(error));                
        } else if (response.statusCode === 201) {         
            logger.debug('Token [%s] validate!', userToken);            
            next(); 
        } else {
            logger.error(context, 'Invalid user token %s', response.statusCode);
            logger.debug(context, 'Error payload: \n%j\n\n', body);
            next(new errors.AuthenticationTokenError(response.statusCode));                
        }
    });
        
}

function authenticationProcess(req, res, next) {
    async.series([
        apply(authenticate, req, res),
    ], function(error, result) {
       if (error) {
           next(error);
       } else if (!result || result.length === 0) {
           next(new errors.AuthenticationTokenError(req.headers[constants.PATH_HEADER]));
       } else {
           next();
       }
    });
}

exports.process = authenticationProcess;