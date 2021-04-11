const { EventEmitter } = require('events');

module.exports.StreamJsonParser = class StreamJsonParser extends EventEmitter {

	buffer = '';

	data(evt) {
		// toString it, in case its a buffer!
		this.buffer += evt.toString();
		this.processBuffer();
	}

	processBuffer() {
		const parts = this.buffer.split(/(\x02[^\x02\x03]*\x03)/g);
		this.buffer = '';

		for(const message of parts) {
			if(message.endsWith('\x03')) {
				const obj = JSON.parse(message.substr(1, message.length - 2));
				this.emit('message', obj);
			} else {
				this.buffer += message;
			}
		}
	}
}