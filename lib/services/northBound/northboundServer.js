/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::daniel.moranjimenez@telefonica.com
 */
'use strict';

var http = require('http'),
    https = require('https'),        
    async = require('async'),
    errors = require('../../errors'),        
    express = require('express'),
    packageInformation = require('../../../package.json'),
    northboundServer,
    contextServer = require('./contextServer'),
    domainUtils = require('../common/domain'),
    authorization = require('../common/authorization'),        
    middlewares = require('../common/genericMiddleware'),
    intoTrans = domainUtils.intoTrans,
    deviceProvisioning = require('./deviceProvisioningServer'),
    groupProvisioning = require('./deviceGroupAdministrationServer'),
    logger = require('logops'),
    fs = require('fs'),
    utils = require('./restUtils'),
    context = {
        op: 'IoTAgentNGSI.NorthboundServer'
    },
    validationHeaders = [
        'fiware-service',
        'fiware-servicepath'
    ],
    authorizationHeaders = [
        'fiware-service',
        'fiware-servicepath',        
        'x-auth-token'
    ],        
    bodyParser = require('body-parser');

function start(config, callback) {
    var baseRoot = '/',
        iotaInformation;

    northboundServer = {
        server: null,
        serverSSL: null,
        app: express(),
        router: express.Router()
    };

    logger.info(context, 'Starting IoT Agent listening on port [%s]', config.server.port);
    logger.debug(context, 'Using config:\n\n%s\n', JSON.stringify(config, null, 4));
    
    northboundServer.app.set('host', config.server.host || '0.0.0.0');
    northboundServer.app.use(domainUtils.requestDomain);
    northboundServer.app.use(utils.xmlRawBody);
    northboundServer.app.use(bodyParser.json());

    if (config.authentication && config.authentication.enabled) {
        northboundServer.app.use(checkMandatoryHeaders(authorizationHeaders));        
        northboundServer.app.use(authorization.process);        
    } else {
        northboundServer.app.use(checkMandatoryHeaders(validationHeaders));        
    }

    
    if (config.logLevel && config.logLevel === 'DEBUG') {
        northboundServer.app.use(middlewares.traceRequest);
    }

    if (config.server.baseRoot) {
        baseRoot = config.server.baseRoot;
    }

    iotaInformation = {
        libVersion: packageInformation.version,
        port: config.server.port,
        baseRoot: baseRoot
    };

    if (config.iotaVersion) {
        iotaInformation.version = config.iotaVersion;
    }

    middlewares.setIotaInformation(iotaInformation);

    northboundServer.router.get('/iot/about', middlewares.retrieveVersion);
    northboundServer.router.get('/version', middlewares.retrieveVersion);
    northboundServer.router.put('/admin/log', middlewares.changeLogLevel);
    northboundServer.router.get('/admin/log', middlewares.getLogLevel);

    northboundServer.app.use(baseRoot, northboundServer.router);
    contextServer.loadContextRoutes(northboundServer.router);
    deviceProvisioning.loadContextRoutes(northboundServer.router);
    groupProvisioning.loadContextRoutes(northboundServer.router);

    northboundServer.app.use(middlewares.handleError);

    northboundServer.server = http.createServer(northboundServer.app);

    console.log("config.ssl.active", config.server.ssl.active);
    
    if(config.server && config.server.ssl && config.server.ssl.active == true){
        var sslOptions = {
            key: fs.readFileSync('../' + config.server.ssl.keyFile),
            cert: fs.readFileSync('../' + config.server.ssl.certFile),            
            requestCert: (config.server.ssl.requestCert == true ) ? true : false,
            rejectUnauthorized: (config.server.ssl.rejectUnauthorized) ? true : false
        };     
        if(config.server.ssl.ca)
            sslOptions['ca'] = fs.readFileSync('../' + config.server.ssl.ca);         
            
        console.log("SSL HTTPS");
        northboundServer.app.set('portSSL', config.server.ssl.portSSL);
        
        northboundServer.serverSSL = https.createServer(sslOptions, northboundServer.app);
        northboundServer.serverSSL.listen(northboundServer.app.get('portSSL'), northboundServer.app.get('host'), function startServer(error) {
            if (error) {
                logger.error(context, 'Error initializing proxy: ' + error.message);

                callback(error);
            } else {
                logger.info(context, 'Proxy listening on port %d with SSL', config.server.ssl.portSSL);
            }
        });        
    }
        

    northboundServer.app.set('port', config.server.port);
    northboundServer.server.listen(northboundServer.app.get('port'), northboundServer.app.get('host'), callback);
}

function stop(callback) {
    logger.info(context, 'Stopping IoT Agent');

    if (northboundServer) {
        northboundServer.server.close(callback);
    } else {
        callback();
    }
}

function clear(callback) {
    async.series([
        deviceProvisioning.clear,
        groupProvisioning.clear,
        contextServer.clear
    ], callback);
}


/**
 * Generates a middleware that checks for the pressence of the mandatory headers passed as a parameter, returning a
 * MISSING_HEADERS error if any one is not found.
 *
 * @param {Array} mandatoryHeaders      List of headers to check.
 * @return {Function}                  An express middleware that checks for the presence of the headers.
 */
function checkMandatoryHeaders(mandatoryHeaders) {
    return function(req, res, next) {
        var missing = [];
        
        for (var i = 0; i < mandatoryHeaders.length; i++) {
            if (!req.headers[mandatoryHeaders[i]] || req.headers[mandatoryHeaders[i]].trim() === '') {
                missing.push(mandatoryHeaders[i]);
            }
        }

        if (missing.length !== 0) {
            next(new errors.MissingHeaders(JSON.stringify(missing)));
        } else {
            next();
        }
    };
}
exports.setUpdateHandler = intoTrans(context, contextServer.setUpdateHandler);
exports.setQueryHandler = intoTrans(context, contextServer.setQueryHandler);
exports.setCommandHandler = intoTrans(context, contextServer.setCommandHandler);
exports.setNotificationHandler = intoTrans(context, contextServer.setNotificationHandler);
exports.setConfigurationHandler = intoTrans(context, groupProvisioning.setConfigurationHandler);
exports.setProvisioningHandler = intoTrans(context, deviceProvisioning.setProvisioningHandler);
exports.addDeviceProvisionMiddleware = deviceProvisioning.addDeviceProvisionMiddleware;
exports.addConfigurationProvisionMiddleware = groupProvisioning.addConfigurationProvisionMiddleware;
exports.addNotificationMiddleware = contextServer.addNotificationMiddleware;
exports.clear = clear;
exports.start = intoTrans(context, start);
exports.stop = intoTrans(context, stop);
