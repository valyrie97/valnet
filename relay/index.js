const { title } = require('../lib/title');
const net = require('net');
const log = require('signale').scope('relay');
const { config } = require('./../package.json');
const { Identity } = require('../lib/Identity');
const stp = require('../lib/STP');
title('relay', false);

const identity = new Identity('relay', 'default');


// let connection = null;

// (function tryConnect() {
// 	connection = net.createConnection(config.ports.ns, 'valnet.xyz', () => {
// 		log.success('Connected to name server');
// 	});
// 	connection.on('error', () => {
// 		log.error('Could not connect to name server')
// 		connection = null;
// 		tryConnect();
// 	});
// 	connection.on('data', (data) => {
// 		log.debug(data.toString());
// 	})
// })();

(async () => {
	await identity.key;

	const server = stp.createServer({
		publicKey: (await identity.key).exportKey('pkcs8-public-pem'),
		privateKey: (await identity.key).exportKey('pkcs8-private-pem')
	}, (client) => {
		log.info(`incomming connection from ${client.remoteAddress}`);
	});

	server.listen(config.ports.relay);
	log.success(`STP server listening on ${config.ports.relay}`);

	stp.connect(config.ports.relay, config.addresses.relay);
})();


const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(Date.now().toString());
})

app.listen(9999);