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

function basicPacket(commandName) {
	return class extends STPPacket {
		constructor() {
			super();
			this.cmd = commandName;
		}
	}
}

class ClientsPacket extends STPPacket {
	constructor(clients) {
		super();
		this.cmd = 'NODES'
		this.data.clients = clients;
	}
}

const AckPacket = basicPacket('ACK');
const GetClientsPacket = basicPacket('QNODES');

function reconstructPacket(packet) {

	if(packet.startsWith('\02'))
		return reconstructPacket(packet.substr(1));
	if(packet.endsWith('\x03'))
		return reconstructPacket(packet.substr(0, packet.length - 1));

	const obj = JSON.parse(packet);

	switch(obj.cmd) {
		case 'KEY': return new KeyExchangePacket(obj.data.key, obj.meta.type);
		case 'NODES': return new ClientsPacket(obj.data.clients);
		case 'QNODES': return new GetClientsPacket();
		case 'ACK': return new AckPacket();

		case 'NOOP': return new STPPacket();
		default: throw new TypeError(`Unknown command ${obj.cmd}`);
	}

}

// module.exports.STPPacket = STPPacket;
module.exports.KeyExchangePacket = KeyExchangePacket;
module.exports.ClientsPacket = ClientsPacket;

module.exports.AckPacket = AckPacket;
module.exports.GetClientsPacket = GetClientsPacket;

module.exports.reconstructPacket = reconstructPacket;