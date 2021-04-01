(async () => {
const { title } = require('../lib/title');
const net = require('net');
const log = require('signale').scope('relay');
const { Identity } = require('../lib/Identity');
const stp = require('../lib/STP');
title('relay', false);
const identity = await new Identity('relay', 'default');
const upnp = require('../lib/upnp');
const Node = require('../lib/node');
const { config, write } = require('../lib/config');

// const client = stp.connect(identity, config.ports.relay, '127.0.0.1');

// upnp.mapIndefinite(5600);

// ==================================== [STP SERVER]

const node = new Node(identity);

function connectNetwork(t = 1000) {
	if(t > 60000) t /= 2;

	const client = stp.connect({
		identity,
		port: config.endpoints[0].split(':')[1],
		ip: config.endpoints[0].split(':')[0]
	});
	client.on('ready', () => {
		log.success('connected to relay!');
		t = 500;
	})
	client.on('error', e => {
	});
	client.on('close', e => {
		t *= 2;
		setTimeout(connectNetwork.bind(global, t), t);
		log.warn('disconnected from relay');
		log.warn('retrying connection... ' + (t/1000) + 's')
	});
}
connectNetwork();

// ==================================== [EXPRESS]
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(`
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

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	next();
})

app.get('/clients', (req, res) => {
	res.json({
		clients: clients.map((client, index) => {
			return {
				id: index,
				address: client.remoteAddress,
				loopback: client.loopback,
				identity: client.identity.publicKey,
				connected: client.secured
			}
		})
	})
})
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