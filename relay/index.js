(async () => {
const { title } = require('../lib/title');
const net = require('net');
const log = require('signale').scope('relay');
const { config } = require('../package.json');
const { Identity } = require('../lib/Identity');
const stp = require('../lib/STP');
title('relay', false);
const identity = await new Identity('relay', 'default');

const clients = [];

// ==================================== [STP CLIENT]
let client = null;
(function tryConnect() {
	client = stp.connect(identity, config.ports.relay, config.addresses.relay);
	client.on('ready', () => {
		log.success(`connected to ${config.addresses.relay}`);
	})
	client.on('error', () => {
		log.error(`connection error on ${config.addresses.relay}`)
		client = null;
		setTimeout(tryConnect, 1000);
	});
	client.on('data', (data) => {
		log.debug(data.toString());
	})
})();

// ==================================== [STP SERVER]
const server = stp.createServer(identity, (client) => {
	log.info(`incomming connection from ${client.remoteAddress}
	${client.remoteIdentity}`);

	clients.push(client);

	client.on('close', pruneClients);
});
server.listen(config.ports.relay);
log.success(`STP server listening on ${config.ports.relay}`);

function pruneClients() {
	clients = clients.filter(client => client.open);
}

// ==================================== [EXPRESS]
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(`
		<table>
		${clients.map(client => `
			<tr>
				<td>${client.remoteAddress}</td>
				<td>${client.remoteIdentity}</td>
			</tr>
		`)}
		</table>
	`);
})

app.listen(9999);














})();