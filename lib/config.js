const pkg = require('./../package.json');
const { readFileSync, writeFileSync } = require('fs');
const { ensureDirSync } = require('fs-extra');

const appdata = require('./appdata');
ensureDirSync(`${appdata}/valnet/relay`);
const filepath = `${appdata}/valnet/relay/config.json`;

const configObject = {}

module.exports.config = configObject;

module.exports.write = write;

function write() {
	writeFileSync(filepath, JSON.stringify(configObject, null, 2));
}

function importFromPackage() {
	loadObject(pkg.config);
}

function loadObject(obj) {
	for(const key in obj) {
		configObject[key] = obj[key];
	}

	write();
}

try {
	const json = readFileSync(filepath);
	const data = JSON.parse(json);

	loadObject(data);

} catch(e) {
	importFromPackage();
}