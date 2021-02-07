const net = require('net');
const EventEmitter = require('events');
const NodeRSA = require('node-rsa');
const log = require('signale').scope('stp');
const natUpnp = require('nat-upnp');
const client = natUpnp.createClient();
client.map = function(port) {
	return new Promise((res, rej) => {
		this.portMapping({
			private: port,
			public: port,
			ttl: 10,
			description: 'valnet'
		}, (err) => {
			if(err) rej(err);
			res();
		});
	});
}
client.unmap = function(port) {
	return new Promise((res, rej) => {
		this.portUnmapping({
			private: port,
			public: port
		}, (err) => {
			if(err) rej(err);
			res();
		});
	});
}
client.mappings = function() {
	return new Promise((res, rej) => {
		this.getMappings((err, mappings) => {
			if(err) rej(err);
			res(mappings);
		});
	});
}
const { config } = require('./../package.json');


module.exports.createServer = function(keys, port) {
	const server = new Server(keys, port);
	// server.on('connection');
	return server;
	// return 5;
}

module.exports.connect = function(identity, port, ip) {
	const client = net.connect(port, ip);
	return new STPSocket(client, identity);
}

class Server extends EventEmitter {
	tcpServer;
	identity;
	port;

	constructor(identity, port) {
		super();
		this.identity = identity;
		this.port = port;

		(async () => {
			try {
				log.debug('first upnp mapping attempt...');
				await client.map(this.port);
				this.openServer();
			} catch (e) {
				log.warn(`Could not open upnp port ${this.port}`);
				log.warn('Check your router is configured to allow upnp.');
				log.warn('Valnet will continue to operate, but incomming')
				log.warn('peer connections will not be possible.')
			}
		})();
	}

	openServer() {
		log.success(`opened upnp port ${this.port}`);
		this.tcpServer = net.createServer(this.tcpConnectClient.bind(this));
		this.tcpServer.listen(this.port);
	}

	tcpConnectClient(tcpSocket) {
		log.debug('incomming TCP connection! ' + tcpSocket.remoteAddress);
		const socket = new STPSocket(tcpSocket, this.identity);
		socket.on('ready', () => {
			this.emit('connection', socket);
		})
	}
}

class STPSocket extends EventEmitter {
	tcpSocket;
	readyState = 0;
	buffer = '';
	externalIdentity;

	get remoteAddress() {
		return this.tcpSocket.remoteAddress;
	}

	get remoteIdentity() {
		return this.externalIdentity.exportKey('pkcs8-public-pem');
	}

	get open() {
		return this.tcpSocket.readyState === 'open'
	}

	constructor(tcpSocket, identity) {
		super();
		this.tcpSocket = tcpSocket;
		this.identity = identity;
		if(this.open) this.handshake();
		else this.tcpSocket.on('connect', this.handshake.bind(this));

		this.tcpSocket.on('data', this.data.bind(this));
		this.tcpSocket.on('error', (...args) => this.emit('error', ...args));
		this.tcpSocket.on('close', (...args) => this.emit('close', ...args));
	}

	data(evt) {
		// log.debug(evt.toString());
		this.buffer += evt.toString();
		this.processBuffer();
	}

	processBuffer() {
		const parts = this.buffer.split(/(\x02[^\x02\x03]*\x03)/g);
		this.buffer = '';
		for(const message of parts) {
			if(message.endsWith('\x03')) {
				const obj = JSON.parse(message.substr(1, message.length - 2));
				this.processMessage(obj);
			} else {
				this.buffer += message;
			}
		}
	}

	processMessage(obj) {
		switch(obj.cmd) {
			case 'KEY': {
				if(this.readyState === 0) {
					// log.debug('registering external key');
					this.externalIdentity = new NodeRSA();
					this.externalIdentity.importKey(obj.data.key, 'pkcs8-public-pem');
					this.tcpSocket.write(new AckPacket().toBuffer());
					this.readyState = 1;
				}
				break;
			}
			case 'ACK': {
				if(this.readyState === 1) {
					this.readyState = 2;
					// log.debug('socket ready!');
					this.emit('ready');
				}
				break;
			}
		}
	}

	handshake() {
		// log.debug('begin handshake on socket');
		const pk = this.identity.publicKey;
		const packet = new KeyExchangePacket(pk);
		const buffer = packet.toBuffer();
		this.tcpSocket.write(buffer);
	}
}

class STPPacket {
	cmd = 'NOOP';
	data = {};
	meta = {};

	toBuffer() {
		return Buffer.from(`\x02${JSON.stringify({
			cmd: this.cmd,
			data: this.data,
			meta: this.meta
		})}\x03`);
	}
}

class KeyExchangePacket extends STPPacket {
	constructor(key, type = 'pkcs8-pem') {
		super();
		this.cmd = 'KEY';
		this.data.key = key;
		this.meta.type = type;
	}
}

class AckPacket extends STPPacket {
	constructor() {
		super();
		this.cmd = 'ACK';
	}
}

 
// client.getMappings(function(err, results) {
// });

// client.getMappings({ local: true }, function(err, results) {
// });

// client.externalIp(function(err, ip) {
// });