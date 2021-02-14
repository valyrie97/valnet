(async () => {
const { title } = require('../lib/title');
const net = require('net');
const log = require('signale').scope('relay');
const { config } = require('../package.json');
const { Identity } = require('../lib/Identity');
const stp = require('../lib/STP');
title('relay', false);
const identity = await new Identity('relay', 'default');
const upnp = require('../lib/upnp');

const clients = [];

// const client = stp.connect(identity, config.ports.relay, '127.0.0.1');

// upnp.mapIndefinite(5600);

// ==================================== [STP SERVER]
stp.createServer({
	identity: identity,
	port: config.ports.relay
}, socket => {
	log.debug('loopback ' + socket.loopback)
	clients.push(socket);
});

function connectNetwork(t = 1000) {
	if(t > 60000) t /= 2;

	const client = stp.connect({
		identity,
		port: config.ports.relay,
		ip: 'valnet.xyz'
	});
	client.on('ready', () => {
		log.success('connectd!');
		t = 500;
	})
	client.on('error', e => {
	});
	client.on('close', e => {
		t *= 2;
		setTimeout(connectNetwork.bind(global, t), t);
		log.debug('retrying connection... ' + (t/1000) + 's')
	});
}
connectNetwork();

// ==================================== [EXPRESS]
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(`
		<style>
			html {
				background: black;
				color: white;
			}
			td:not(:last-child), th:not(:last-child) {
				border-right: 1px solid white;
			}
			td, th {
				padding-left: 8px;
			}
			th {
				border-bottom: 3px solid white;
			}
			table {
				border-spacing: 0px;
				font-family: sans-serif;
				font-size: 13px;
			}
			tr:nth-child(2n) {
				background: #111;
			}
		</style>
		<table style="min-width: 300px">
			<tr>
				<th>Id</th>
				<th>Address</th>
				<th>loopback</th>
			</tr>
			${clients.map((client, index) => `
				<tr>
					<td><pre>${index}</pre></td>
					<td><pre>${client.remoteAddress}</pre></td>
					<td><pre>${client.loopback}</pre></td>
				</tr>
			`).join('')}
		</table>
	`);
});

// app.post

app.listen(config.ports.http).on('error', e => {
	log.warn(e);
	setTimeout(_ => {
		app.listen(config.ports.http).on('error', e => {
			log.error(e);
		});
	}, config.ports.http);
});














})();