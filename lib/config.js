const pkg = require('./../package.json');
const { readFileSync, writeFileSync } = require('fs');

const appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")
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