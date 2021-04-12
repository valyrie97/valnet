import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import icon from '../assets/icon.svg';
import './App.global.css';
import { IpcClient } from './lib/ipc.js';


class Hello extends React.Component {
  api = new IpcClient('valnet');
  constructor(props: {} | Readonly<{}>) {
    super(props);
    this.getData();
  }
  
  async getData() {
    console.log(await this.api.getClients())
  }

  async killApp() {
    // alert(this);
    await this.api.kill(1);
  }

  render() {
    return (
      <div>
        <div className="Hello">
          <img width="200px" alt="icon" src={icon} />
        </div>
        <h1>electron-react-boilerplate</h1>
        <div className="Hello">
          <a
            href="#"
            rel="noreferrer"
            onClick={this.killApp.bind(this)}
          >
            <button type="button">
              <span role="img" aria-label="books">
                📚
              </span>
              Kill App
            </button>
          </a>
          <a
            target="#"
            rel="noreferrer"
          >
            <button type="button">
              <span role="img" aria-label="books">
                🙏
              </span>
              Donate
            </button>
          </a>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
