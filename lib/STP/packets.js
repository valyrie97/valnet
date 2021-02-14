

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

module.exports.STPPacket = STPPacket;
module.exports.KeyExchangePacket = KeyExchangePacket;
module.exports.AckPacket = basicPacket('ACK')
module.exports.GetClientsPacket = basicPacket('NODES')
