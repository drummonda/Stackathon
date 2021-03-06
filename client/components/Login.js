import React, { Component } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import {Button} from 'semantic-ui-react'

let web3 = null; // Will hold the web3 instance

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false // Loading button state
    };

    this.handleAuthenticate = this.handleAuthenticate.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleSignMessage = this.handleSignMessage.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
  }

  async handleAuthenticate({ publicAddress, signature }) {
    const {data} = await axios.post('/auth/web3', { publicAddress, signature });
    return data;
  }

  async handleClick() {
    const { onLoggedIn, userType, setUser } = this.props;

    if (!window.web3) {
      window.alert('Please install MetaMask first.');
      return;
    }
    if (!web3) {
      // We don't know window.web3 version, so we use our own instance of web3
      // with provider given by window.web3
      web3 = new Web3(window.web3.currentProvider);
    }
    const coinbase = await web3.eth.getCoinbase((err, coinbase) => {
      return coinbase || err;
    })
    if (!coinbase) {
      window.alert('Please activate MetaMask first.');
      return;
    }
    const publicAddress = coinbase;
    this.setState({ loading: true });

    try {
      // Look if user with current publicAddress is already present on backend
      const {data} = await axios.get(`/api/users?publicAddress=${publicAddress}`)


      const addr = await (data.length ? data[0] : this.handleSignup(publicAddress));


      const signed = await this.handleSignMessage(addr);
      const auth = await this.handleAuthenticate(signed);


      setUser(userType);
      localStorage.setItem('user', userType);
      onLoggedIn(auth);

    } catch (err) {
      console.error(err);
      this.setState({ loading: false });
    }
  }

  handleSignMessage({ publicAddress, nonce }) {
    return new Promise((resolve, reject) =>
      web3.eth.personal.sign(
        web3.utils.fromUtf8(`I am signing my one-time nonce: ${nonce}`),
        publicAddress,
        (err, signature) => {
          if (err) return reject(err);
          return resolve({ publicAddress, signature });
        }
      )
    );
  };

  handleSignup(publicAddress) {
    const {data} = axios.post('/api/users', {publicAddress: publicAddress});
    return data;
  }

  render() {
    const { loading } = this.state;
    const { userType } = this.props;
    return (
      <div className="login">
        {userType === "User" ?
          <Button primary className="Login-button Login-mm" onClick={this.handleClick}>
            {loading ? 'Loading...' : 'Login as a User with MetaMask'}
          </Button>
          :
          <Button secondary className="Login-button Login-mm" onClick={this.handleClick}>
            {loading ? 'Loading...' : 'Login as a Venue with MetaMask'}
          </Button>
        }
      </div>
    );
  }
}

export default Login;
