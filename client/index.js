(async () => {
const { title } = require('../lib/title');
const net = require('net');
const os = require('os');
const log = require('signale');
const { config } = require('./../package.json');
const { hri } = require('human-readable-ids');
const { Profiles } = require('../lib/Profiles');
const profiles = new Profiles('client');
const yargs = require('yargs').argv;
const identity = yargs.profile ? 
                   await profiles.get(yargs.profile) :
                   await profiles.get((await profiles.all())[0]);

// const id = hri.random();

// console.log(id)

// title(id);
// title(identity.name.replace(/-/g, ' '));

// await profiles.create();
// log.debug(await profiles.all())
log.debug(await identity.name());



})();