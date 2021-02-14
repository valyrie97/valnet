const natUpnp = require('nat-upnp');
const client = natUpnp.createClient();
module.exports.map = function(port) {
	return new Promise((res, rej) => {
		client.portMapping({
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
module.exports.mapIndefinite = function(port) {
	return new Promise((res, rej) => {
		client.portMapping({
			private: port,
			public: port,
			ttl: 0,
			description: 'valnet'
		}, (err) => {
			if(err) rej(err);
			res();
		});
	});
}
module.exports.unmap = function(port) {
	return new Promise((res, rej) => {
		client.portUnmapping({
			private: port,
			public: port
		}, (err) => {
			if(err) rej(err);
			res();
		});
	});
}
module.exports.mappings = function() {
	return new Promise((res, rej) => {
		client.getMappings((err, mappings) => {
			if(err) rej(err);
			res(mappings);
		});
	});
}


/*
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
*/