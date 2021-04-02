const md5 = require('md5');

// #region === [ private lib functions ] ===

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

function basicPacket(commandName) {
	return class extends STPPacket {
		constructor() {
			super();
			this.cmd = commandName;
		}
	}
}

// #endregion

// #region === [ exotic packet classes ] ===

class KeyExchangePacket extends STPPacket {
	constructor(key, {
		type = 'pkcs8-pem',
		name = 'anonymous'
	} = {}) {
		super();
		this.cmd = 'KEY';
		this.data.key = key;
		this.meta.name = name;
		this.meta.type = type;
	}
}

class ClientsPacket extends STPPacket {
	constructor(clients) {
		super();
		this.cmd = 'NODES'
		this.data.clients = clients;
	}
}

class PingPacket extends STPPacket {
	constructor() {
		super();
		this.cmd = 'PING';
		this.data.id = md5(Date());
	}
}

class PongPacket extends STPPacket {
	constructor(id) {
		super();
		this.cmd = 'PONG';
		this.data.id = id;
	}
}

// #endregion

// #region === [ ordinary packet classes ] ===

const AckPacket = basicPacket('ACK');
const GetClientsPacket = basicPacket('QNODES');

// #endregion

// #region === [ public lib functions ] ===

function reconstructPacket(packet) {

	if(packet.startsWith('\02'))
		return reconstructPacket(packet.substr(1));
	if(packet.endsWith('\x03'))
		return reconstructPacket(packet.substr(0, packet.length - 1));

	const obj = JSON.parse(packet);

	switch(obj.cmd) {
		case 'KEY': return new KeyExchangePacket(obj.data.key, obj.meta);
		case 'NODES': return new ClientsPacket(obj.data.clients);
		case 'QNODES': return new GetClientsPacket();
		case 'ACK': return new AckPacket();

		case 'NOOP': return new STPPacket();
		default: throw new TypeError(`Unknown command ${obj.cmd}`);
	}

}

// #endregion

// #region === [ exports ] ===

module.exports.KeyExchangePacket = KeyExchangePacket;
module.exports.ClientsPacket = ClientsPacket;
module.exports.PingPacket = PingPacket;
module.exports.PongPacket = PongPacket;

module.exports.AckPacket = AckPacket;
module.exports.GetClientsPacket = GetClientsPacket;

module.exports.reconstructPacket = reconstructPacket;

// #endregion