import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import actions from '../state/actions';


function TransactionList(props) {

    const transactions = useSelector((state) => state.transactions);
    const dispatch = useDispatch();

    const removeTransaction = (hash) => {
        dispatch(actions.deleteTransaction(hash));
    }
    
    return <div className="container-fluid">
        <div className="row border">
            <div className="col"/>
                <b>Transaction history</b>
                <table className="table table-striped table-bordered" >
                    <thead id='transactions-head'>
                        <tr>
                            <th className="text-left align-middle">Hash</th>
                            <th className="text-left align-middle">Status</th>
                            <th className="text-left align-middle">Remove from list</th>
                        </tr>
                    </thead>
                    <tbody id='transactions-body'>
                    {transactions.map(item => 
                        <tr key={item.hash}>
                            <td className="align-middle">{item.hash}</td>
                            <td className="align-middle">{item.status}</td>
                            <td className="align-middle"><button className="btn btn-secondary" onClick={(event) => removeTransaction(item.hash)}>Remove</button></td>
                        </tr>
                    )}
                    </tbody>
                </table>   
            </div>
        </div>
}


export default TransactionList;