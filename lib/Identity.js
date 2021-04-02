const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const { hri } = require('human-readable-ids');
const os = require('os');
const NodeRSA = require('node-rsa');
let log = require('signale').scope('Identity(null)');
const appdata = require('./appdata');

module.exports.Identity = class Identity {
	kv;
	key;
	name;

	/// ASYNC CONSTRUCTOR
	constructor(module, id) {
		return new Promise(async (res, rej) => {

			const kv = new Keyv({
				store: new KeyvFile({
					filename: `${appdata}/valnet/${module}/${id}.json`
				})
			});

			log = log.scope(`Identity(${module}/${id})`);

			this.key = await new Promise(async (res) => {
				log.info(`Searching for identity`);
				
				if(! await kv.get('private-key')
					|| ! await kv.get('public-key')
					|| ! await kv.get('name')) {

					log.warn(`no keypair found, generating...`);
					const name = hri.random();
					const key = new NodeRSA({b: 512});
					key.generateKeyPair();
					await kv.set('name', name);
					await kv.set('private-key', key.exportKey('pkcs8-private-pem'));
					await kv.set('public-key', key.exportKey('pkcs8-public-pem'));
					log.success(`done!`);
				}

				const identity = new NodeRSA();
				identity.importKey(await kv.get('private-key'), 'pkcs8-private-pem');
				identity.importKey(await kv.get('public-key'), 'pkcs8-public-pem');
				log.info(`Identity imported.`);

				this.name = await kv.get('name');
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