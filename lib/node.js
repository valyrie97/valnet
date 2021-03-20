const EventEmitter = require('events')


class Node extends EventEmitter {
	constructor() {
		
	}

	static get Node() {
		return Node;
	}
}


module.exports = Node;