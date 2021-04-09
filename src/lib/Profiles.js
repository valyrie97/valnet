const os = require('os');
const Datastore = require('nedb');
const { Identity } = require('./Identity');

module.exports.Profiles = class Profiles {
	_module;

	constructor(_module) {
		this._module = _module;

		this.db = new Datastore({
			filename: `${os.tmpdir()}/valnet/${_module}/profiles.json`,
			autoload: true
		});

		(async () => {
			if((await this.all()).length === 0) {
				await this.create();
			}
		})();
	}

	async all() {
		return await new Promise(res => {
			this.db.find({}, (err, docs) => {
				res(docs.map(v => v._id));
			})
		});
	}

	async create() {
		this.db.insert({}, (err, doc) => {
			const id = doc._id;
			new Identity(this._module, id);
		})
	}

	async clear() {
		return await new Promise(res => {
			this.db.remove({}, (err, docs) => {
				res(docs.map(v => v._id));
			})
		});
	}

	async get(id) {
		return await new Promise(res => {
			this.db.findOne({
				_id: id
			}, (err, doc) => {
				const identity = new Identity(this._module);
				res(identity);
			})
		});
	}

	toString() {
		return `[Profiles(${this.module})]`;
	}
}