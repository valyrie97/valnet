// imports that arent installed...
import { execSync, spawn } from 'child_process';
import { config } from '../src/lib/config/index.js';
import http from 'http';
import os from 'os';
import EventEmitter from 'events';

let external = {};
async function doExternalImports() {
	external.Signale = (await import('signale')).default;
	external.Datastore = (await import('nedb')).default;
	external.express = (await import('express')).default;
	external.Volatile = (await import('volatile')).default;
	external.expressWs = (await import('express-ws')).default;
}

(async function bootloader() {
	let yarnOutput = "";
	try {
		// sanity install packages...
		// happens if a package is installed
		// and used in this script, without
		// restarting the service entirely
		// between updates from github.
		// this is also why we dynamically
		// load the dependencies...
		yarnOutput += execSync(`yarn`);
	} catch {
		enterRecoveryMode(yarnOutput);
		return;
	}
	try {
		await doExternalImports();
	} catch (e) {
		enterRecoveryMode(e.toString());
		return;
	}
	startService();
})();


async function startService() {
	const logLock = new external.Volatile({});
	const log = external.Signale.scope('SRVC');
	const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
	let proc;
	const logs = new external.Datastore({
		filename: 'svc.log',
		autoload: true
	});
	const app = external.express();
	external.expressWs(app);
	const logEvents = new EventEmitter();

	logp('==================================');
	logp('Starting Valnet Node as a Service!');
	logp('Syncing to branch: ' + branch);
	logp('===================================');
	logp('= = = = = = = = = = = = = = = = = =');
	logp('=  =  =  =  =  =  =  =  =  =  =  = ');
	logp('=   =   =   =   =   =   =   =   =  ');
	logp('=    =    =    =    =    =    =    ');
	logp('=     =     =     =     =     =    ');

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
			stdio: 'pipe',
			env: {
				FORCE_COLOR: true
			}
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
			const newDoc = {
				message: data.toString(),
				type: type,
				src: source,
				timestamp: new Date().getTime()
			};
			logEvents.emit('all', [newDoc]);
			return new Promise(res => {
				logs.insert(newDoc, (err, doc) => {
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

	app.get('/logs', (req, res) => {
		// res.redirect(`/logs/${Date.now() - (1000 * 60 * 60 * 24)}`)
		res.end(Template.realtimeLogs());
	})

	app.get('/logs/:start/:end', (req, res) => {
		
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


	app.get('/api/sessions', async (req, res) => {
		res.json(await getSessions());
	})

	app.ws('/api/logs', async (ws) => {
		logEvents.on('all', broadcast);
		function broadcast(docs) {
			for(const doc of docs)
				ws.send(doc.message);
		}
		ws.on('close', _ => {
			logEvents.off('all', broadcast);
		})
	});

	app.listen(config.ports.service);
};

function enterRecoveryMode(message) {
	http.createServer((req, res) => {
		res.end(Template.recoveryMode(message));
	}).listen(config.ports.service);
}



const Template = {
	logs(messages) {
		return `
		<style> html { background: #0E1419; color: #F8F8F2; } </style>
		<pre>
${messages.join('').replace(/\u001B\[.*?[A-Za-z]/g, '')}
		</pre>
		<br><br><br><br><br><br>
		`;
	},
	realtimeLogs() {
		return `
		<style> html { background: #0E1419; color: #F8F8F2; } </style>
		<pre></pre>
		<br><br><br><br><br><br>
		<script>
		setInterval(_ => {
			window.scrollTo(0,document.body.scrollHeight);
		}, 100);

		function connect() {
			const pipe = new WebSocket(\`ws://\${location.host}/api/logs\`);
			pipe.onclose = _ => {
				setTimeout(connect, 100);
			};
			pipe.onmessage = evt => {
				document.querySelector('pre').innerHTML += evt.data;
			};
		}
		connect();

		</script>`;
	},
	Json(obj) {
		return `<pre>
${JSON.stringify(obj, null, 2)}
		</pre>`
	},
	recoveryMode(message) {
		return `<h1>${os.hostname()} has entered recovery mode...</h1>
		<h3>Last words:</h3>
		<pre>${message}</pre>`
	}
};