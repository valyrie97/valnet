const net = require('net');
const EventEmitter = require('events');
const NodeRSA = require('node-rsa');
const log = require('signale').scope('_STP');
const debug = require('debug')('xyz:valnet:stp');
const {
	KeyExchangePacket,
	AckPacket,
	PingPacket,
	PongPacket
} = require('./packets');

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
		// log.info(`opening STP server on ${this.port}`);
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
	buffer = '';
	externalKey;
	identity;
	externalName;

	CONNECTING = Symbol('connecting');
	EXCHANGE = Symbol('exchange');
	SECURED = Symbol('secured');
	readyState = this.CONNECTING;

	pingCallbacks = new Map();

	get loopback() {
		return this.identity.publicKey ===
			this.externalKey.exportKey('pkcs8-public-pem');
	}

	get remoteAddress() {
		return this.tcpSocket.remoteAddress;
	}

	get remoteName() {
		return this.externalName;
	}

	get remoteIdentity() {
		return this.externalKey.exportKey('pkcs8-public-pem');
	}

	get open() {
		return this.tcpSocket.readyState === 'open';
	}

	get secured() {
		return this.readyState;
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

		if(this.readyState === this.CONNECTING && obj.cmd === 'KEY') {
			debug('received remote public key...');
			this.externalKey = new NodeRSA();
			this.externalKey.importKey(obj.data.key, 'pkcs8-public-pem');
			this.externalName = obj.meta.name;
			this.tcpSocket.write(new AckPacket().toBuffer());
			this.readyState = this.EXCHANGE;
			debug('sent acknowledgement...');
			return;
		}

		if(this.readyState === this.EXCHANGE && obj.cmd === 'ACK') {
			debug('received acknowledgement...');
			this.readyState = this.SECURED;
			this.emit('ready');
			return;
		}

		if (this.readyState === this.SECURED && obj.cmd === 'PING') {
			this.tcpSocket.write(new PongPacket(obj.data.id).toBuffer());
			return;
		}

		if (this.readyState === this.SECURED && obj.cmd === 'PONG') {
			if (this.pingCallbacks.has(obj.data.id)) {
				this.pingCallbacks.get(obj.data.id)();
			}
			return;
		}

	}

	handshake() {
		debug('connected')
		const pk = this.identity.publicKey;
		const packet = new KeyExchangePacket(pk, {
			name: this.identity.name
		});
		const buffer = packet.toBuffer();
		this.tcpSocket.write(buffer);
		debug('sent public key...')
	}

	async ping() {
		const startTime = new Date().getTime();
		return await new Promise(async (res) => {
			const packet = new PingPacket();
			this.pingCallbacks.set(packet.data.id, _ => {
				res(new Date().getTime() - startTime);
				this.pingCallbacks.delete(packet.data.id);
			});
			this.tcpSocket.write(packet.toBuffer());
			debug('ping sent...');
		})

	}
}
