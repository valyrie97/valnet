import Signale from 'signale';
import { execSync, spawn } from 'child_process';
import Datastore from 'nedb';
import { config } from '../src/lib/config/index.js';
import express from 'express';
import Volatile from 'volatile';

const logLock = new Volatile({});

(async () => {

const log = Signale.scope('SRVC');
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
let proc;
const logs = new Datastore({
	filename: 'svc.log',
	autoload: true
});
const app = express();


try {
	logp('Attempting yarn install...')
	appendLogs('yarn', execSync(`yarn`));
} catch (e) {
	logp('failed to yarn install...')
}

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
	proc = spawn('node', ['./relay/index.mjs'], {
		stdio: 'pipe'
	});
	appendLogs('relay', 'STARTED', 'event');

	proc.stdout.on('data', (data) => {
		process.stdout.write(data);
		appendLogs('relay', data.toString(), 'stdout');
	});
	
	proc.stderr.on('data', (data) => {
		process.stderr.write(data);
		appendLogs('relay', data.toString(), 'stderr');
	});

	proc.on('exit', () => {
		appendLogs('relay', 'STOPPED', 'event');
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
	logLock.lock(function(lock) {
		return new Promise(res => {
			logs.insert({
				message: data.toString(),
				type: type,
				src: source,
				timestamp: new Date().getTime()
			}, (err, doc) => {
				res(lock);
			})
		})
	})
}

function getSessions() {
	return new Promise(res => {
		logs.find({
			type: 'event',
			message: { $in: ['STARTED', 'STOPPED'] }
		}, {}, (err, docs) => {
			const sessions = [];
			let start = null;
			for(const event of docs) {
				if(event.message === 'STARTED') {
					if (start !== null) {
						sessions.push({
							started: start,
							stopped: event.timestamp
						});
					}
					start = event.timestamp;
				}
				if(event.message === 'STOPPED' && start !== null) {
					sessions.push({
						started: start,
						stopped: event.timestamp
					});
					start = null;
				}
			}
			sessions.sort((a, b) => a.started > b.started);
			res(sessions);
		});
	});
}

app.get('/', (req, res) => {
	res.end(`
		<a href="/logs">Logs</a><br>
		<a href="/api/sessions">Sessions</a><br>
		<a href="/restart">Restart</a>
	`);
})

app.get('/restart', async (req, res) => {
	proc.kill();
	res.redirect('/');
})

app.get('/api/sessions.json', async (req, res) => {
	res.json(await getSessions());
})

app.get('/logs', (req, res) => {
	res.redirect(`/logs/${Date.now() - (1000 * 60 * 60 * 24)}`)
})

app.get('/logs/:time', (req, res) => {
	
	logs.find({
		timestamp: { $gt: parseInt(req.params.time) }
	}, {}).sort({
		timestamp: -1
	}).limit(100).exec((err, docs) => {

		res.end(Template.logs(docs.reverse().map(v => v.message)));

		if(err) {
			res.end(err.toString());
			return;
		}
// ${new Date(logItem.timestamp).toLocaleString().padStart(40)}: 
		res.end();
	})
});

const Template = {
	logs(messages) {
		return `<html>
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
${messages.join('').replace(/\u001B\[.*?[A-Za-z]/g, '')}
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
		</html>`;
	},
	Json(obj) {
		return `<pre>
${JSON.stringify(obj, null, 2)}
		</pre>`
	}
};

app.listen(config.ports.service);




})();