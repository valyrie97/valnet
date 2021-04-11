const ipc = require('node-ipc');
const { EventEmitter } = require('events');
const uuid = require('uuid');
ipc.config.silent = true;

class IpcServer extends EventEmitter {

	functions = new Map();

	constructor(name) {
		super();
		ipc.serve('/tmp/app.' + name, () => {
			ipc.server.on('connect', this.newClient.bind(this));
		})
		ipc.server.start();
	}

	registerFunction(name, fn) {
		if(!fn) return this.registerFunction(name.name, name);

		const sanitizedName = name.replace('bound ', '');

		this.functions.set(sanitizedName, fn);
	}

	newClient(socket) {

		ipc.server.on('req', (evt, incommingSocket) => {
			if (incommingSocket !== socket) return;

			console.log('req -', evt);

			const [
				name,
				...args
			] = evt;

			if(!this.functions.has(name)) {
				console.log('fn not in here boos')
				socket.emit('data', undefined);
				return;
			}

			const fn = this.functions.get(name);
			const result = fn(...args);
			ipc.server.emit(socket, 'res', result);
		});
		
	}
}

function IpcClient(name) {
	this.currentCb = _ => _;
	const handler = {
		get(target, fnName) {
			if(fnName === 'then') {
				return undefined;
			} else if (fnName === 'ready') {
				return this.name;
			}
			return function(...args) {
				return new Promise(res => {
					this.currentCb = (result) => {
						res(result);
					}
					ipc.of[name].emit('req', [fnName, ...args]);
				})
			}
		}
	};
	this.proxy = new Proxy(this, handler);
	this.name = name;
	this.ready = new Promise(res => {
		ipc.connectTo(name, () => {
			ipc.of[name].on('connect', _ => res());
			ipc.of[name].on('res', result => {
				this.currentCb(result);
			});
		});
	});

	return this.proxy;

}
if(!!module.exports) {
	module.exports.IpcServer = IpcServer;
	module.exports.IpcClient = IpcClient;
}

export {
	IpcServer,
	IpcClient
}