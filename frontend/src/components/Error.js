import React, { useEffect } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import actions from '../state/actions';

/**
 * Display error 
 */
function Error(props){

    const error = useSelector((state) => (state.error));
    const dispatch = useDispatch();

    const dismiss = (event) => {
        event.preventDefault();
        dispatch(actions.clearError());
    }

    useEffect(() => {
        // Make sure that the error message is visible
        if (error !== "") {
            window.scrollTo(0, 0);
        }
    }, [error]);

    if (error === "") {
        return <div></div>
    }
    return <div className="container-fluid">
            <table style={{width: "100%"}}>
                <tbody>
                    <tr>
                        <td style={{"textAlign": "left"}}>
                            <span className="text-danger">{error}</span>
                        </td>
                        <td style={{"textAlign": "right"}}>
                            <button className="btn btn-light" onClick={dismiss}>Dismiss</button>
                        </td>
                    </tr>
                </tbody>
            </table>
       </div>
}


export default Error;