import React, { useState } from 'react';


/**
 * A controlled form that allows a user to enter a new account
 */
function AccountInput(props){

    let [privateKey, setPrivateKey ] = useState("");


    const handleSubmit = (event) => {
        event.preventDefault();
        props.addItemCallback(privateKey);
        setPrivateKey("");
    }

    const handleChange = (event) => {
        event.preventDefault();
        setPrivateKey(event.target.value);
    }

    return <div>
        <b>Add additional accounts to the wallet</b>
        <form>
        <div className="input-group mb-2">
                <input 
                    type="text" 
                    className="form-control"  
                    placeholder="Private key" 
                    id="privateKey-input" 
                    value={privateKey} 
                    onChange={handleChange}>
                </input>
                <button 
                    className="btn btn-primary" 
                    id="addAccount-button" 
                    type="submit" 
                    onClick={handleSubmit}>Add account
                </button>
        </div> 
    </form>
    </div>
}


export default AccountInput;