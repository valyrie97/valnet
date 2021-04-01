(async () => {
const log = require('signale').scope('SRVC');
const { execSync, spawn } = require('child_process');
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
let proc;
const Datastore = require('nedb');
const logs = new Datastore({
	filename: 'svc.log',
	autoload: true
});
const { config } = require('../package.json');
const express = require('express');
const app = express();

logp('==================================');
logp('Starting Valnet Node as a Service!');
logp('Syncing to branch: ' + branch);
logp('==================================');

setInterval(function update() {
	const remoteHash = execSync('git ls-remote https://github.com/marcus13345/valnet.git').toString()
		.split('\n')
		.filter(test => {
			return test.trim().endsWith(branch);
		})[0]
		.split('\t')[0]
		.trim();
	const localHash = execSync(`git rev-parse ${branch}`).toString().trim();
	if(remoteHash !== localHash) {
		logp(`remote hash: ${remoteHash}`);
		logp(`local hash: ${localHash}`);

		logp('killing relay...');
		try {
			proc.kill();
		} catch (e) {
			logp('failed to kill active relay...', 'error');
			logp(e, 'error');
		}
	}
}, 5000);

(function keepAlive() {
	proc = spawn('node', ['relay'], {
		stdio: 'pipe'
	});

	proc.stdout.on('data', (data) => {
		process.stdout.write(data);
		appendLogs('relay', data.toString(), 'stdout');
	});
	
	proc.stderr.on('data', (data) => {
		process.stderr.write(data);
		appendLogs('relay', data.toString(), 'stderr');
	});

	proc.on('exit', () => {
		logp('relay exitted');
		logp('attempting to fetch new version');

		appendLogs('fetch', execSync(`git fetch`));
		appendLogs('update', execSync(`git pull`));
		appendLogs('yarn', execSync(`yarn`));

		logp('restarting...')
		setTimeout(() => {
			keepAlive();
		}, 1000);
	})
})();

function logp(message, type = 'info') {
	log[type](message);
	appendLogs('service', message + '\n')
}

function appendLogs(source, data, type = 'output') {
	logs.insert({
		message: data.toString(),
		type: type,
		src: source,
		timestamp: new Date().getTime()
	})
}

app.get('/', (req, res) => {
	res.end('<a href="/logs">Logs</a>');
})

app.get('/logs', (req, res) => {
	res.redirect(`/logs/${Date.now() - (1000 * 60 * 60 * 24)}`)
})

app.get('/logs/:time', (req, res) => {
	
	logs.find({
		timestamp: { $gt: parseInt(req.params.time) }
	}, {}).sort({
		timestamp: 1
	}).exec((err, docs) => {


		if(err) {
			res.end(err.toString());
			return;
		}
// ${new Date(logItem.timestamp).toLocaleString().padStart(40)}: 
		res.end(`
		<html>
		<head>
		<meta charset="UTF-16">
		</head>
		<body>
			<style>
				table {
					border-spacing: 0px;
					font-size: 13px;
				}
				tr {
					vertical-align: top;
				}
				html {
					background: #0E1419;
					color: #F8F8F2;
				}
			</style>
			<pre>
${docs.map(logItem => logItem.message).join('').replace(/\u001B\[.*?[A-Za-z]/g, '')}
			</pre>
			<br><br><br><br><br><br>
			<script>
			// requestAnimationFrame(_ => {
			// 	requestAnimationFrame(_ => {
			// 		window.scrollTo(0,document.body.scrollHeight);
			// 	});
			// });
			// setTimeout(_ => {
			// 	location.reload();
			// }, 2000);
			</script>
		</body>
		</html>
		`);
	})
});

app.listen(config.ports.service);




})();