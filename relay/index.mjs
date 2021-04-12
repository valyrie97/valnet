// process.env.DEBUG = 'xyz:valnet:*';
'use strict';

import { title } from '../src/lib/title.js';
import { Identity } from '../src/lib/Identity.js';
import { config } from '../src/lib/config/index.js';
import appdata from '../src/lib/appdata.js';
import Node from '../src/lib/node.js';

import Signale from 'signale';
import { ensureDirSync } from 'fs-extra';
import express from 'express';

title('relay', false);
const log = Signale.scope('RLAY');
const node = new Node();

(async () => {

// ==================================== [EXPRESS]

const app = express();
ensureDirSync(`${appdata}/valnet/relay`);

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