import React, { useState } from 'react';
import constants from '../utils/constants';

function LoginScreen(props) {

    let [secret, setSecret] = useState("");
    let [newSecret, setNewSecret] = useState("");
    var _url = window.localStorage.getItem(constants.storageKeys.URL);
    let [url, setUrl] = useState(_url || "http://127.0.0.1:8545");


    const handleSubmit = (event) => {
        event.preventDefault();
        switch (event.target.id) {
            case "login-button":
                props.loginCallback(secret, url, false);
                break;
            case "refresh-button":
                props.loginCallback(newSecret, url, true);                
                break;
            default:
                break;  
        }
        
    }

    const handleChange = (event) => {
        event.preventDefault();
        switch (event.target.id) {
            case "password":
                setSecret(event.target.value);
                break;
            case "new-password":
                setNewSecret(event.target.value);
                break;    
            case "url":
                setUrl(event.target.value);
                break;
            default:
                break;  
        }
    }


    return <div className="container">
        <form>
            <div className="form-group">
                <label htmlFor="url" className="mt-3">URL of the Ethereum node to connect to (overwrite if needed)</label>
                <input type="text" className="form-control" id="url" placeholder="Enter URL of RPC client to use" value={url} onChange={handleChange}/>
            </div>
            <div className="form-group">
                <label htmlFor="password">When you have already used the application in this browser, your wallet has been encrypted and saved. Please enter the password that you have provided below to allow
                the application to access the wallet and hit "Login"</label>
                <input type="text" className="form-control" id="password"  placeholder="Enter password to store wallet" value={secret} onChange={handleChange} />
            </div>
            <button 
                  className="form-control btn btn-primary" 
                    id="login-button" 
                    type="submit" 
                    onClick={handleSubmit}>Login
            </button>
            <div className="form-group">
                <label htmlFor="new-password">When this is the first time that you use the application or if you have already used it but want to start over with a new wallet and a new password, please enter a new password 
                below and hit "Reset". Note that this will delete any account data (i.e. the wallet) that the application has stored for you! A new wallet with the new password will be created instead</label>
                <input type="text" className="form-control" id="new-password"  placeholder="Enter new password to refresh" value={newSecret} onChange={handleChange} />
            </div>
            <button 
                  className="form-control btn btn-primary" 
                    id="refresh-button" 
                    type="submit" 
                    onClick={handleSubmit}>Refresh
            </button>
        </form>
    </div>
}


export default LoginScreen;