const net = require('net');
const EventEmitter = require('events');
const NodeRSA = require('node-rsa');
const log = require('signale').scope('stp');
const {
	KeyExchangePacket,
	AckPacket
} = require('./packets');
const { rejects } = require('assert');

module.exports.createServer = function({identity = {}, port = 5000} = {}, cb = _ => _) {
	const server = new Server(identity, port);
	server.on('connection', connection => {
		cb(connection);
	});
	// return 5;
}

module.exports.connect = function({
	identity,
	port,
	ip
}) {
	return new STPSocket(net.connect(port, ip), identity);
}

class Server extends EventEmitter {
	tcpServer;
	identity;
	port;

	constructor(identity, port) {
		super();
		this.identity = identity;
		this.port = port;
		this.openServer();
	}

	openServer() {
		log.info(`opening STP server on ${this.port}`);
		this.tcpServer = net.createServer(this.tcpConnectClient.bind(this));
		this.tcpServer.on('error', e => {
			log.warn(e)
			setTimeout(this.openServer.bind(this), 5000);
		})
		this.tcpServer.listen(this.port);
	}

	tcpConnectClient(tcpSocket) {
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
	externalKey;
	identity;

	get loopback() {
		return this.identity.publicKey ===
			this.externalKey.exportKey('pkcs8-public-pem');
	}

	get remoteAddress() {
		return this.tcpSocket.remoteAddress;
	}

	get remoteIdentity() {
		return this.externalKey.exportKey('pkcs8-public-pem');
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
					log.info('registering external key');
					this.externalKey = new NodeRSA();
					this.externalKey.importKey(obj.data.key, 'pkcs8-public-pem');
					this.tcpSocket.write(new AckPacket().toBuffer());
					this.readyState = 1;
				}
				break;
			}
			case 'ACK': {
				if(this.readyState === 1) {
					this.readyState = 2;
					log.success('internal key acknowledged');
					this.emit('ready');
				}
				break;
			}
		}
	}

	handshake() {
		const pk = this.identity.publicKey;
		const packet = new KeyExchangePacket(pk);
		const buffer = packet.toBuffer();
		this.tcpSocket.write(buffer);
	}
}
