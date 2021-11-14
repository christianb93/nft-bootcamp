import { useDispatch, useSelector} from 'react-redux';
import TokenInput from './TokenInput';
import  actions  from '../state/actions';
import  constants  from '../utils/constants';
import web3Connection from '../utils/Web3Connection';
import { ERC721ABI } from '../utils/ERC721ABI';
import { useHistory } from 'react-router-dom';
import {  useEffect } from 'react';
import TransactionList from './TransactionList';

function TokenWatchlist(props) {

    const tokenWatchlist = useSelector((state) => state.tokenWatchlist);
    const tokenWatchlistLoaded = useSelector((state) => state.watchlistLoaded);
    const chainEvents = useSelector((state) => state.chainEvents);
    const dispatch = useDispatch();
    const history = useHistory();


    // Hook to load the watchlist when the page is rendered for the first time
    useEffect(()=> {
        // Only load if there is no watchlist in the local state - this avoids
        // reloading when we navigate back to the page from another page
        if (tokenWatchlistLoaded) {
            return;
        }
        dispatch(actions.setWatchlistLoaded(true));
        try { 
            var _tokenWatchlist = JSON.parse(window.localStorage.getItem(constants.storageKeys.WATCHLIST));
            if ((undefined === _tokenWatchlist)  || ("" === _tokenWatchlist) || (null === _tokenWatchlist)) {
                _tokenWatchlist = [];
            }
            // For each entry, retrieve current owner and add entry to
            // watchlist in Redux store
            _tokenWatchlist.forEach((token) => {
                try {
                    var w3 = web3Connection.web3;
                    var nft = new w3.eth.Contract(ERC721ABI, token.contract);
                    nft.methods.ownerOf(token.tokenID).call().then((value) => {
                        token['owner'] = value; 
                        dispatch(actions.addToWatchlist(token));
                    }).catch((err) =>  {
                        console.log(err);
                        dispatch(actions.setError(err.message));    
                    });
                }
                catch (err) {
                    console.log(err);
                    dispatch(actions.setError(err.message));
                }
            });                
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));    
        }
    }, [tokenWatchlistLoaded, dispatch]);

    // Hook to load the watchlist when we see a chain event
    useEffect(()=> {
        try { 
            var _tokenWatchlist = tokenWatchlist.map((item) => (item));
            _tokenWatchlist.forEach((token) => {
                try {
                    var w3 = web3Connection.web3;
                    var nft = new w3.eth.Contract(ERC721ABI, token.contract);
                    nft.methods.ownerOf(token.tokenID).call().then((value) => {
                        token['owner'] = value; 
                        dispatch(actions.addToWatchlist(token));
                    }).catch((err) =>  {
                        console.log(err);
                        dispatch(actions.setError(err.message));    
                    });
                }
                catch (err) {
                    console.log(err);
                    dispatch(actions.setError(err.message));
                }
            });                
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));    
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainEvents, dispatch]);    

    // Hook to store the watchlist whenever it has changed
    // This needs to go after the first effect, as otherwise we overwrite a saved watchlist with
    // the empty value
    useEffect(() => {
        try {
            window.localStorage.setItem(constants.storageKeys.WATCHLIST, JSON.stringify(tokenWatchlist));
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));    
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenWatchlist, dispatch]);

    const removeToken = (contract, tokenID) => {
        dispatch(actions.removeFromWatchlist({contract, tokenID}));
    };


    const addItem = (contract, tokenID) => {
        var token = {contract, tokenID};
        var w3 = web3Connection.web3;
        var nft = new w3.eth.Contract(ERC721ABI, contract);
        try {
            nft.methods.ownerOf(tokenID).call().then((value) => {
                token['owner'] = value; 
                dispatch(actions.addToWatchlist(token));
                dispatch(actions.clearError());
            }).catch((err) =>  {
                console.log(err);
                dispatch(actions.setError(err.message));    
            });
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));
        }
    }

    return <div className="container-fluid">
        <div className="row border">
            <div className="col"/>
                <b>Your token watchlist</b>
                <table className="table table-striped table-bordered" >
                    <thead id='tokenWatchlist-head'>
                        <tr>
                            <th className="text-left align-middle">Contract</th>
                            <th className="text-left align-middle">TokenID</th>
                            <th className="text-left align-middle">Owner</th>
                            <th className="text-left align-middle">Remove from list</th>
                            <th className="text-left align-middle">View details</th>
                        </tr>
                    </thead>
                    <tbody id='tokenWatchlist-body'>
                    {tokenWatchlist.map(item => 
                        <tr key={item.contract + item.tokenID}>
                            <td className="align-middle">{item.contract}</td>
                            <td className="align-middle">{item.tokenID}</td>
                            <td className="align-middle">{item.owner}</td>
                            <td className="align-middle"><button className="btn btn-secondary" onClick={(event) => removeToken(item.contract, item.tokenID)}>Remove</button></td>
                            <td className="align-middle"><button className="btn btn-secondary" onClick={(event) => history.push("/tokenDetails/"+item.contract+"/"+item.tokenID)}>Details</button></td>
                        </tr>
                    )}
                    </tbody>
                </table>   
            </div>
            <div className="row border">
                <TokenInput addItemCallback={addItem}/>
            </div>
            <div className="row border">
                <TransactionList/>
            </div>                        
        </div>
}


export default TokenWatchlist;