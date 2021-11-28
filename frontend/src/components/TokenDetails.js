import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import web3Connection from '../utils/Web3Connection';
import { ERC721ABI } from '../utils/ERC721ABI';
import actions from '../state/actions';
import axios from 'axios';
import constants from '../utils/constants';
import TransactionList from './TransactionList';

function TokenDetails(props) {

    const  { contract, tokenID } = useParams();
    const [ name, setName ] = useState("");
    const [ image, setImage ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ owner, setOwner ] = useState("");
    const [ toAddress, setToAddress ] = useState("");
    const primaryAccount = useSelector((state) => (state.primaryAccount));
    const chainEvents = useSelector((state) => state.chainEvents);
    const dispatch = useDispatch();

    // If the token ID changes or we get a chain event, get tokenURI and owner
    // from the server
    useEffect(() =>  {
        try {
            var w3 = web3Connection.web3;
            var nft = new w3.eth.Contract(ERC721ABI, contract);
            // Get token URI
            nft.methods.tokenURI(tokenID).call().then((uri) => {
                // Now try to read data from the URI
                // using Axios
                axios.get(uri).then((response) => { 
                    setDescription(response.data.description);
                    setImage(response.data.image);
                    setName(response.data.name);
                }).catch((err) => {
                    console.log(err);
                    dispatch(actions.setError(err.message));        
                });    
            }).catch((err) =>  {
                console.log(err);
                dispatch(actions.setError(err.message));    
            });   
            // Similary get token owner
            nft.methods.ownerOf(tokenID).call().then((value) => {
                setOwner(value);
            }).catch((err) => {
                console.log(err);
                dispatch(actions.setError(err.message));        
            });    
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));
        }
    },[tokenID, chainEvents, contract, dispatch]);

    var canSell = true;
    var reason = "";
    if ("" === primaryAccount) {
        canSell = false;
        reason = "You have not selected a primary account in the wallet. To sell, you first need to select a primary account";
    }
    else {
        if ((primaryAccount !== owner) && (toAddress !== "")) {
            canSell = false;
            reason = "You have selected a primary account, but this account is not currently owning the token, so you cannot sell it"
        }
    }

    const sellToken = () => {
        try {
            var w3 = web3Connection.web3;
            var nft = new w3.eth.Contract(ERC721ABI, contract);
            nft.methods.safeTransferFrom(primaryAccount, toAddress, tokenID).estimateGas({from: primaryAccount}).then((gas) => {
                nft.methods.safeTransferFrom(primaryAccount, toAddress, tokenID).send({from: primaryAccount, gas: gas})
                .on("transactionHash", (hash) => {
                    var transaction = {
                        hash,
                        status: constants.txnStatus.PENDING
                    }
                    dispatch(actions.addTransaction(transaction));
                    dispatch(actions.clearError());
                })
                .on("receipt", (receipt) => {
                    var _transaction = {
                        hash: receipt.transactionHash,
                        status: (receipt.status ? constants.txnStatus.MINED : constants.txnStatus.ERROR),
                    }
                    dispatch(actions.updateTransaction(_transaction));                    
                    // raise a chain event so that other components can re-render
                    dispatch(actions.chainEvent());
                    dispatch(actions.clearError());
                })
                .then(() => { 
                    setToAddress("");
                    dispatch(actions.clearError());
                })
                .catch((err) => {
                    console.log("Error during transfer");
                    console.log(err);
                    dispatch(actions.setError(err.message));
                });
            }).catch((err) => {
                console.log("Error during gas estimation");
                console.log(err.message);
                dispatch(actions.setError(err.message));
            })
        }
        catch (err) {
            console.log(err);
            dispatch(actions.setError(err.message));
        }
    }

    const onChange = (event) => {
        event.preventDefault();
        setToAddress(event.target.value);
    }

    return <div className="container-fluid">
            { (tokenID === undefined) ? 
            <p>You have not selected a token yet, go the token watchlist and pick a token</p> : 
        <div>
            <div className="row border">
                <table className="table table-striped table-bordered">
                    <tbody>
                        <tr key="row">
                            <td>
                                <table className="table table-striped table-bordered">
                                    <tbody>
                                        <tr key="tokenID">
                                            <td>Token ID:</td>
                                            <td>{tokenID}</td>
                                        </tr>
                                        <tr key="name">
                                            <td>Name:</td>
                                            <td>{name}</td>
                                        </tr>
                                        <tr key="description">
                                            <td>Description:</td>
                                            <td>{description}</td>
                                        </tr>
                                        <tr key="image">
                                            <td>Image URL:</td>
                                            <td>{image}</td>
                                        </tr>
                                        <tr key="owner">
                                            <td>Current owner:</td>
                                            <td>{owner}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td className="align-middle text-center">
                                { ((image !== "") ? <img src={image} alt="Token representation" width="200" height="350"/> : <div></div>) }
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="input-group mb-2">
                    <button 
                        type="button" 
                        id="sell-token" 
                        className="btn btn-primary" 
                        onClick={sellToken}
                        disabled={!canSell || (toAddress === "")}>
                            Sell token
                    </button>
                    <input 
                        type="text" 
                        className="form-control"  
                        placeholder="Adress to which to send the token" 
                        id="to-input" 
                        onChange={onChange}
                        value={toAddress}>
                    </input>
                </div>
                { (!canSell ? <div>{reason}</div> : "")}
            </div>
            <div className="row border">
                    <TransactionList/>
            </div>
        </div>
        }
    </div>

}

export default TokenDetails;