import { useDispatch, useSelector } from 'react-redux';

import "bootstrap/dist/css/bootstrap.css";
import LoginScreen from "./components/LoginScreen";
import Error from "./components/Error";
import actions from './state/actions';
import constants from "./utils/constants";
import { switchUrl } from "./utils/Web3Connection";
import Navigation from './components/Navigation';
import TokenWatchlist from './components/TokenWatchlist';
import {BrowserRouter as Router} from 'react-router-dom';
import { Switch, Route, Redirect } from 'react-router';
import Wallet from './components/Wallet';
import TokenDetails from './components/TokenDetails';


function App() {

  const haveSecret = useSelector((state) => (state.credentials.haveSecret));
  const dispatch = useDispatch();

  const doLogin = (password, url, refresh) => {
    dispatch(actions.storeCredentials(password));
    dispatch(actions.setUrl(url));
    window.localStorage.setItem(constants.storageKeys.URL, url);
    // If a refresh has been requested, remove any existing wallet
    // and saved token
    if (refresh) {
      window.localStorage.removeItem(constants.storageKeys.WALLET);
      window.localStorage.removeItem(constants.storageKeys.URL); 
    }
    switchUrl(url);
  }

  return (
      <div>
        { 
           (haveSecret ?  <Router>
                            <div className="container-fluid">
                              <div className="row">
                                <div className="column"><Error/></div>
                              </div>
                              <div className="row">
                                <Navigation/>
                              </div>
                               <div className="row">
                                <Switch>
                                    <Route path="/wallet">
                                      <Wallet/>
                                    </Route>
                                    <Route path="/tokenWatchlist">
                                      <TokenWatchlist/>
                                    </Route>                                 
                                    <Route path="/tokenDetails/:contract/:tokenID">
                                      <TokenDetails/>
                                    </Route>
                                    <Route path="/tokenDetails">
                                      <TokenDetails/>
                                    </Route>
                                    <Route path="/">
                                      <Redirect to="/wallet"/>
                                    </Route>
                                </Switch>
                              </div>
                            </div>
                          </Router> : <LoginScreen loginCallback = {doLogin}/>)
        }
      </div>
  );
}

export default App;
