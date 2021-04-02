const { config } = require('./config');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { Signale } = require('signale');
const log = new Signale().scope('GTWY');
const interactive = new Signale({interactive: true, scope: 'GTWY'});
const stp = require('./STP');

class Gateway {
	constructor(identity, endpoints) {
		this.identity = identity;
		const appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")

		this.endpoints = new Keyv({
			store: new KeyvFile({
				filename: `${appdata}/valnet/relay/${this.identity.name}-endpoints.json`
			})
		});

		this.ready = this.insertEndpoints(endpoints)
			.then(this.networkTest.bind(this));
	}

	async insertEndpoints(endpoints) {
		for (const endpoint of endpoints) {
			const storeValue = await this.endpoints.get(endpoint);
			if (storeValue) continue;

			const [host, port] = endpoint.split(':');
			const record = new EndpointRecord(host, port, null, 'unknown');
			const currentEnpoints = await this.endpoints.get('cache') || [];

			if (currentEnpoints.indexOf(endpoint) === -1) {
				currentEnpoints.push(endpoint);
				await this.endpoints.set('cache', currentEnpoints);
			}

			await this.endpoints.set(endpoint, record);
		}

		log.info('gateway endpoints:');
		log.info('\t' + (await this.endpoints.get('cache')).join('\n\t'));
	}

	async networkTest() {
		const endpoints = (await Promise.all(
			(await this.endpoints.get('cache'))
				.map(endpoint => this.endpoints.get(endpoint))
		)).map(EndpointRecord.fromJson);
		
		for(const endpoint of endpoints) {
			await this.testEndpoint(endpoint.host, endpoint.port);
		}
	}

	async testEndpoint(host, port) {
		await new Promise(async (res, rej) => {
			let pings = [];
			let maxPings = 10;
			let connectionAttempts = 0;
			log.info(`Conencting to ${host}:${port}...`);

			while(connectionAttempts < 10 && pings.length < maxPings) {

				await new Promise(async (res) => {
					const client = stp.connect({
						identity: this.identity,
						ip: host,
						port: parseInt(port)
					});

					client.on('error', _ => _);

					client.on('ready', async () => {
						while(pings.length < maxPings) {
							interactive.info(`[${pings.length + 1}/${maxPings}] Testing connection...`);
							pings.push(await client.ping());
							// pings.push(10);
							await new Promise(res => setTimeout(res, 1000));
						}
						interactive.success(`Test complete. Average Ping: ${pings.reduce((a, v) => a += (v / maxPings), 0)}`)
						client.tcpSocket.destroy();
						res();
					});

					client.on('close', () => {
						res();
					});

				});

			}
		});
	}
}

class EndpointRecord {

	/**
	 * @param {Object|string} json string / object representation
	 * @returns {EndpointRecord}
	 */
	static fromJson(obj) {
		if (typeof obj === 'string')
			return EndpointRecord.fromJson(JSON.parse(obj));

		return new EndpointRecord(
			obj.host,
			obj.port,
			obj.lastPing ? new PingRecord(
				obj.lastPing.average,
				obj.lastPing.tests,
				obj.lastPing.date
			) : null,
			obj.status
		);
	}

	constructor(host, port, lastPing, status) {
		this.host = host;
		this.port = port;
		this.lastPing = lastPing;
		this.status = status;
	}
}

class PingRecord {
	constructor(average, tests, date) {
		this.average = average;
		this.tests = tests;
		this.date = date;
	}
}

module.exports = Gateway