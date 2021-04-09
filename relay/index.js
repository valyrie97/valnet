process.env.DEBUG = 'xyz:valnet:*';

(async () => {
const { title } = require('../lib/title');
const log = require('signale').scope('RLAY');
const { Identity } = require('../lib/Identity');
title('relay', false);
const identity = await new Identity('relay', 'default');
const Node = require('../lib/node');
const { config } = require('../lib/config');
const { ensureDirSync } = require('fs-extra');
const appdata = require('../lib/appdata');

ensureDirSync(`${appdata}/valnet/relay`);
const node = new Node(identity);

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