import React from 'react';
import styles from './style.module.css';
import { apiRoot } from '../lib/constants.js';

class ActiveConnections extends React.Component {
	
	state = {
		connections: []
	}

	constructor(props) {
		super(props);
		this.refreshData();
	}

	async refreshData() {
		const req = await fetch(`${apiRoot}/clients`);
		const res = await req.json();
		console.log(res);
	}

	render() {
		return (
			<div>
				<div>active connections!</div>
				{this.state.connections.map(connection => {
					return (<div>
						{connection.toLocaleString()};
					</div>)
				})}
				<br />
				<button onClick={() => this.addConnection.bind(this)()}>
					Add Connection
				</button>
			</div>
		);
	}

	addConnection() {
		this.state.connections.push(new Date());
		this.forceUpdate();
	}
}

export default ActiveConnections;