(() => {
const log = require('signale').scope('service');
const { execSync, spawn } = require('child_process');
const branch = 'master';
let proc;

setInterval(function update() {
	const remoteHash = execSync('git ls-remote https://github.com/marcus13345/valnet.git').toString().split(/[\t\n]/g)[0].trim();
	const localHash = execSync(`git rev-parse ${branch}`).toString().trim();
	if(remoteHash !== localHash) {
		log.info('remote hash:', remoteHash);
		log.info('local hash: ', localHash);
		log.info('attempting to fetch new version');

		execSync(`git fetch`);
		execSync(`git pull`);
		execSync(`yarn`);
		
		log.info('killing relay...');
		try {
			proc.kill();
		} catch (e) {
			log.error('failed to kill active relay...');
			log.error(e);
		}
	}
}, 5000);

(function keepAlive() {
	proc = spawn('node', ['relay'], { stdio: "inherit" });

	proc.on('exit', () => {
		log.info('relay exitted, restarting...');
		setTimeout(() => {
			keepAlive();
		}, 1000);
	})
})();












})();