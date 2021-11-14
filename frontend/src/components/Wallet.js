import React, { useEffect  } from 'react';
import AccountInput from './AccountInput';
import web3Connection from '../utils/Web3Connection';
import { useDispatch, useSelector } from 'react-redux';
import actions from '../state/actions';
import constants from '../utils/constants';


function Wallet(props) {

    const accounts = useSelector((state) => state.accounts);
    const password = useSelector((state) => state.credentials.password);
    const primaryAccount = useSelector((state) => state.primaryAccount);
    const walletLoaded = useSelector((state) => state.walletLoaded);

    const dispatch = useDispatch();


    const setAccountsFromWallet = (wallet) => {
        var _accounts = [];
        for (var i = 0; i < wallet.length; i++) { 
           _accounts.push(wallet[i]);                
        }
        dispatch(actions.storeAccounts(_accounts));
    }


    const addAccount = (privateKey) => {
        var wallet = web3Connection.web3.eth.accounts.wallet;
        wallet.add(privateKey);
        wallet.save(password, constants.storageKeys.WALLET);
        setAccountsFromWallet(web3Connection.web3.eth.accounts.wallet);
    }

    const removeAccount = (address) => {
        if (!window.confirm("Do you really want to delete the account" + address + "? This cannot be undone, and you will loose access to all holdings in the account unless you have a copy of the private key somewhere.")) {
            return;
        }
        var wallet = web3Connection.web3.eth.accounts.wallet;
        wallet.remove(address);
        wallet.save(password, constants.storageKeys.WALLET);
        // Somehow iterating through the wallet after removing an account seems 
        // to be dangerous, so instead of calling setAccountsFromWallet, we
        // remove the account manually (this happens because the web3 implementation of
        // a wallet calls delete on the underlying array, see the code in 
        // web3.js/packages/web3-eth-accounts/src/index.js, in the function Wallet)
        var _accounts = accounts.filter((item) => (item.address !== address));
        dispatch(actions.storeAccounts(_accounts));
        // If the account that we have removed is the primary account, reset the corresponding
        // field of the state
        if (primaryAccount === address) {
            dispatch(actions.setPrimaryAccount(""));
        }
    }

    const handleSelection = (event) => {
        dispatch(actions.setPrimaryAccount(event.target.value));
    }

    // Load wallet upon initial rendering - skip this if there is already a wallet in the
    // local state
    useEffect(() => {
        if (walletLoaded) {
            return;
        }
        dispatch(actions.setWalletLoaded(true));
        try {
            web3Connection.web3.eth.accounts.wallet.load(password, constants.storageKeys.WALLET);
            setAccountsFromWallet(web3Connection.web3.eth.accounts.wallet);
            dispatch(actions.clearError());
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletLoaded]);


    return <div className="container-fluid">
            <div className="row">
                <div className="col border">
                    <table className="table table-striped table-bordered table-sm">
                        <thead id='wallet-head'>
                            <tr>
                                <th className="text-left align-middle">Primary</th>
                                <th className="text-left align-middle">Address</th>
                                <th className="text-left align-middle">Remove from wallet</th>
                            </tr>
                        </thead>
                        <tbody id='wallet-body'>
                            {accounts.map(item => 
                            <tr key={item.address}>
                                <td>
                                    <input type="radio" id={`${item.address}-selected`} name="primary-account" value={item.address} onChange={handleSelection} checked={primaryAccount === item.address ? true : false}/>
                                </td>
                                <td className="align-middle">{item.address}</td>
                                <td className="align-middle">
                                    <button type="button" id={`${item.address}-remove`} className="btn btn-primary" onClick={(event) => {removeAccount(item.address)}}>Remove</button>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>   
                </div>
            </div>
            <div className="row">
                <div className="col border">
                    <AccountInput addItemCallback={addAccount}/>
                </div>
            </div>
        </div> 

}


export default Wallet;