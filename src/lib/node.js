const EventEmitter = require('events')
const stp = require('./STP');
const upnp = require('./upnp');
const md5 = require('md5');
const pkg = require('./../package.json');
const { config, write } = require('./config.js');
const log = require('signale').scope('NODE');
const bonjour = require('bonjour')();
const Gateway = require('./Gateway');
const { Identity } = require('./Identity');

class Node extends EventEmitter {
	clients = [];
	hash = null;
	name = null;
	readyPromise = null;
	port = null;
	identity;
	multicastAd = null;
	multicastBrowser = null;
	connected = false;
	multicastDevices = [];
	upnpEnabled = false;
	
	constructor() {
		super();

		this.readyPromise = this.setupIdentity()
			.then(this.negotiatePort.bind(this))
			.catch(this.serverStartupFailed.bind(this))
			.then(this.startServer.bind(this))
			.then(this.connectNetwork.bind(this))
	}

	async setupIdentity() {
		const identity = await new Identity('relay', 'default');
		this.identity = identity;
		this.hash = md5(identity.publicKey);
		this.name = `valnet-node-${identity.name}`;
	}

	async connectNetwork() {
		const gateway = new Gateway(this.identity, config.endpoints);
	}

	async serverStartupFailed(error) {
		log.warn('port negotiation failed, using config port: ' + config.ports.relay);
		log.warn('If This is meant to be a server, you\'ll');
		log.warn('need to manually forward the port.');
		log.warn('elsewise, this warning is safe to ignore.');
	}

	async startServer() {
		log.info('creating Valnet Node on port ' + this.port + '...');

		stp.createServer({
			identity: this.identity,
			port: this.port
		}, (connection) => {
			log.info('incomming connection from ' + connection.remoteName);
		});
		
		log.info('advertising node on multicast...')
		this.multicastAd = bonjour.publish({
			name: this.name,
			type: 'stp',
			port: this.port,
			protocol: 'tcp'
		});

		this.multicastBrowser = bonjour.find({type: 'stp'});

		this.multicastBrowser.on('up', this.serviceUp.bind(this));
		this.multicastBrowser.on('down', this.serviceDown.bind(this));

		// log.success('Node successfully registered!');
	}

	async serviceUp(device) {
		this.multicastDevices.push(device);
	}

	async serviceDown(device) {
		this.multicastDevices = this.multicastDevices.filter(testDevice => {
			return testDevice.host !== device.host
					|| testDevice.port !== device.port
		})
	}

	async negotiatePort() {
		const mappings = await upnp.mappings();
		const matchingMappings = mappings.filter(mapping => {
			return mapping.description === this.name
		});
		const alreadyMapped = matchingMappings.length > 0;
		const takenPorts = mappings.map(mapping => mapping.public.port);

		if(alreadyMapped) {
			this.port = matchingMappings[0].public.port;
			this.upnpEnabled = true;
			log.success(`upnp port ${this.port} already registered!`);
			return;
		}

		for(let port = config.ports.relay; port <= config.ports.relayEnd; port ++) {
			if(takenPorts.indexOf(port) === -1) {
				await upnp.mapIndefinite(port, this.name);
				this.port = port;
				this.upnpEnabled = true;
				log.success(`registered upnp port ${this.port}`);
				return;
			}
		}

		// console.log(mappings, this.hash);
	}

	static get Node() {
		return Node;
	}

	get ready() {
		return this.readyPromise;
	}
}


module.exports = Node;