const { readFileSync, writeFileSync, existsSync } = require('fs');
const { ensureDirSync } = require('fs-extra');
const config = require('./defaults.js');
const deepmerge = require('deepmerge');

const appdata = require('../appdata');
ensureDirSync(`${appdata}/valnet/relay`);
const filepath = `${appdata}/valnet/relay/config.json`;

const configObject = {};

module.exports.config = configObject;

function loadObject(obj) {
	for(const key in obj) {
		configObject[key] = obj[key];
	}
}

try {
	if(!existsSync(filepath))
		writeFileSync(filepath, JSON.stringify({}, null, 2));

	const json = readFileSync(filepath);
	const data = JSON.parse(json);

	
	loadObject(deepmerge(config, data, {
		arrayMerge: (_, sourceArray, __) => sourceArray
	}));

} catch(e) {
	
}