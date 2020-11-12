const net = require('net');
const EventEmitter = require('events');
const NodeRSA = require('node-rsa');
const log = require('signale');

module.exports.createServer = function(keys, onConnect) {
	const server = new Server(keys);
	server.on('connect', onConnect);
	return server;
	// return 5;
}

module.exports.connect = function(port, ip) {
	const client = new Client(port, ip);
}

class Client extends EventEmitter {
	port;
	ip;
	tcpClient

	constructor(port, ip) {
		super();
		this.ip = ip;
		this.port = port;
		this.tcpClient = net.createConnection(port, ip);
		this.tcpClient.on('connect', this.connect.bind(this));
		this.tcpClient.on('error', this.error.bind(this));
	}

	connect(e) {
		log.debug('connect', e);
	}

	error(e) {
		log.debug('error', e);
	}
}

class Server extends EventEmitter {
	tcpServer;
	key;
	publicKey;
	privateKey;

	Client = class Client extends EventEmitter {
		tcpClient;

		get remoteAddress() { return this.tcpClient.remoteAddress };

		constructor(tcpClient) {
			super();
			this.tcpClient = tcpClient;
			this.tcpClient.on('error', (e) => {
				this.emit('error', e)
			});
		}

		write(...args) {
			this.tcpClient.write(...args);
		}
	};

	constructor(keys) {
		super();
		this.tcpServer = net.createServer(this.tcpConnectClient.bind(this));
		this.key = new NodeRSA();
		this.key.importKey(keys.privateKey, 'pkcs8-private-pem');
		this.key.importKey(keys.publicKey, 'pkcs8-public-pem');
		this.publicKey = keys.publicKey;
		this.privateKey = keys.privateKey;
	}

	tcpConnectClient(tcpClient) {
		const client = new this.Client(tcpClient);
		client.write(this.publicKey);
		this.emit('connect', client);
		// return client;
	}

	listen(...args) {
		log.success('STP Server created on port', args[0]);
		this.tcpServer.listen(...args);
	}
}
