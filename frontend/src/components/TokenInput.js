import React, { useState } from 'react';


/**
 * A controlled form that allows a user to enter a new token
 * to be added to the watchlist
 */
function TokenInput(props){

    var [contract, setContract ] = useState("");
    var [tokenID, setTokenID ] = useState("");


    const handleSubmit = (event) => {
        event.preventDefault();
        props.addItemCallback(contract, tokenID);
        setTokenID("");
    }

    const handleChange = (event) => {
        event.preventDefault();
        switch (event.target.id) {
            case "contract-input":
                setContract(event.target.value);
                break;
            case "tokenID-input":
                setTokenID(event.target.value);
                break;
            default:
                break;
        }
    }

    return <div>
        <b>Add additional token to the watchlist</b>
        <form>
        <div className="input-group mb-3">
                <input 
                    type="text" 
                    className="form-control"  
                    placeholder="Contract address" 
                    id="contract-input" 
                    value={contract} 
                    onChange={handleChange}>
                </input>
                <input 
                    type="text" 
                    className="form-control"  
                    placeholder="Token ID" 
                    id="tokenID-input" 
                    value={tokenID} 
                    onChange={handleChange}>
                </input>
                <button 
                    className="btn btn-primary" 
                    id="addToken-button" 
                    type="submit" 
                    onClick={handleSubmit}>Add token
                </button>
        </div> 
    </form>
    </div>
}


export default TokenInput;