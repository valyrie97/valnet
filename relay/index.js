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

// const client = stp.connect(identity, config.ports.relay, '127.0.0.1');

// ==================================== [STP SERVER]
const server = stp.createServer(identity, config.ports.relay);

// ==================================== [EXPRESS]
const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.end(`
		<table style="width: 100%">
		${clients.map(client => `
			<tr>
				<td><pre>${client.remoteAddress}</pre></td>
				<td><pre>${client.remoteIdentity}</pre></td>
			</tr>
		`).join('')}
		</table>
	`);
});

// app.post

app.listen(9999);














})();