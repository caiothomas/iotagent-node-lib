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
 * please contact with::[contacto@tid.es]
 */

var config = {
    logLevel: 'DEBUG',
    contextBroker: {
        host: '192.168.56.101',
        port: '1026'
    },
    
    /**
     * The ngsi request will be with ssl connections
     */
    ssl: {
        active: true,
        keyFile: 'certificados/server/key.pem',
        certFile: 'certificados/server/cert.pem',
        //ca: 'certificados/mqtt.perm',
        rejectUnauthorized: false
    },

    /**
     * Configuration of the Northbound server of the IoT Agent.
     */
    server: {
        /**
         * Port where the IoT Agent will be listening for requests.
         */
        port: 4061,
        ssl : {
            portSSL: 4062,
        
            /**
             * This flag activates the HTTPS protocol in the server. The endpoint always listen to the indicated port
             * independently of the chosen protocol.
             */
            active: true,

            /**
             * Key file to use for codifying the HTTPS requests. Only mandatory when the flag active is true.
             */
            keyFile: 'certificados/server/key.pem',

            /**
             * SSL Certificate to present to the clients. Only mandatory when the flag active is true.
             */
            certFile: 'certificados/server/cert.pem',

            ca: '',
            requestCert: false,
            rejectUnauthorized: false                 
        }       
    },
    authentication: {
        host: 'localhost',
        port: '5000',
        user: 'iotagent',
        password: 'iotagent'
    },
    deviceRegistry: {
        type: 'memory'
    },
    types: {
        'Light': {
            url: '/',
            apikey: '',
            type: 'Light',
            // service: '',
            // subservice: '',
            // trust: ''
            // cbHost: '',
            commands: [],
            lazy: [
                {
                    name: 'luminescence',
                    type: 'Lumens'
                }
            ],
            active: [
                {
                    name: 'status',
                    type: 'Boolean'
                }
            ]
        }
    },
    service: 'smartGondor',
    subservice: '/gardens',
    providerUrl: 'http://192.168.56.1:4041',
    deviceRegistrationDuration: 'P1M',
    defaultType: 'Thing',
};

module.exports = config;
