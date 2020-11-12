const { title } = require('../lib/title');
const net = require('net');
const log = require('signale');
const { config } = require('./../package.json');

title('relay');

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


setTimeout(() => {}, 1000)