const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { hri } = require('human-readable-ids');
const os = require('os');
const NodeRSA = require('node-rsa');
let log = require('signale').scope('Identity(null)');
const appdata = require('./appdata');

module.exports.Identity = class Identity {
	key;
	name;

	/// ASYNC CONSTRUCTOR
	constructor(module, id) {
		return new Promise(async (res, rej) => {

			const store = new Keyv({
				store: new KeyvFile({
					filename: `${appdata}/valnet/${module}/${id}.json`
				})
			});

			log = log.scope(`Identity(${module}/${id})`);

			this.key = await new Promise(async (res) => {
				log.info(`Searching for identity`);
				
				if(! await store.get('private-key')
					|| ! await store.get('public-key')
					|| ! await store.get('name')) {

					log.warn(`no keypair found, generating...`);
					const name = hri.random();
					const key = new NodeRSA({b: 512});
					key.generateKeyPair();
					await store.set('name', name);
					await store.set('private-key', key.exportKey('pkcs8-private-pem'));
					await store.set('public-key', key.exportKey('pkcs8-public-pem'));
					log.success(`done!`);
				}

				const identity = new NodeRSA();
				identity.importKey(await store.get('private-key'), 'pkcs8-private-pem');
				identity.importKey(await store.get('public-key'), 'pkcs8-public-pem');
				log.info(`Identity imported.`);

				this.name = await store.get('name');
				res(identity);
			});

			res(this);
		});
	}

	get publicKey() {
		return this.key.exportKey('pkcs8-public-pem');
	}

	async name() {
		return this.name;
	}
	
	async encrypt(...args) {
		return this.key.encrypt(...args);
	}
	async decrypt(...args) {
		return this.key.decrypt(...args);
	}

	toString() {
		return `[Identity ${this.name}]`;
	}
}