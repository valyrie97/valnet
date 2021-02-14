(async () => {
const { config } = require('./../package.json');
const net = require('net');
const dns = require('dns');
const stp = require('../lib/STP');
const os = require('os');
const { title } = require('../lib/title');
const { hri } = require('human-readable-ids');
const log = require('signale');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const kv = new Keyv({
	store: new KeyvFile({
		filename: `${os.tmpdir()}/valnet/name-server/data.json`
	})
});
const { Identity } = require('./../lib/Identity');
title('Name Server');

const identity = new Identity('name-server', 'default');






})();