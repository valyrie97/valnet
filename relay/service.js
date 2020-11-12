(() => {
const log = require('signale');
const { execSync } = require('child_process');
const branch = 'master';

function update() {
	const remoteHash = execSync('git ls-remote https://github.com/marcus13345/valnet.git').toString().split(/[\t\n]/g)[0].trim();
	const localHash = execSync(`git rev-parse ${branch}`).toString().trim();
	if(remoteHash !== localHash) {
		log.info('remote hash:', remoteHash);
		log.info('local hash: ', localHash);

		execSync(`git fetch`, { stdio: "inherit" });
		execSync(`git pull`, { stdio: "inherit" });
		process.exit(2);
	}
}




// require('./index.js');

setInterval(update, 5000);











})();