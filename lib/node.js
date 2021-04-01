const EventEmitter = require('events')
const stp = require('./STP');
const upnp = require('./upnp');
const md5 = require('md5');
const pkg = require('./../package.json');
const { config, write } = require('./config.js');

class Node extends EventEmitter {
	clients = [];
	hash = null;
	name = null;
	readyPromise = null;
	
	constructor(identity) {
		super();
		this.hash = md5(identity.publicKey);
		this.name = `valnet node - ${this.hash}`;
		// stp.createServer({
		// 	identity,
		// 	port
		// }, socket => {
		// 	log.info('secured connection from ' + socket.remoteAddress);
		// 	this.clients.push(socket);
		// });
		this.readyPromise = this.negotiatePort();
	}

	async negotiatePort() {
		// await upnp.map(5600, 60 * 5, 'other application');

		const mappings = await upnp.mappings();

		const alreadyMapped = mappings.filter(mapping => {
			return mapping.description === this.name
		}).length > 0;

		if(alreadyMapped) {
			console.log('already mapped!');
			return;
		}

		const takenPorts = mappings.map(mapping => mapping.public.port);

		for(let port = config.ports.relay; port <= config.ports.relayEnd; port ++) {
			if(takenPorts.indexOf(port) === -1) {
				console.log('registering to port ' + port);
				await upnp.mapIndefinite(port, 10, this.name);
				break;
			} else {
				console.log('port ' + port + ' is taken...');
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