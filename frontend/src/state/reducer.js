import { combineReducers } from 'redux';
import actions  from './actions';

const initialState = {
    url: "http://127.0.0.1:8545",
    accounts: [],
    primaryAccount: "",
    credentials: {
        haveSecret: false,
        password: ""
    },
    tokenWatchlist: [],
    transactions: [],
    chainEvents: 0, // a counter used to push updates to all components that depend on the chain state
    error: "",
    walletLoaded: false,
    watchlistLoaded: false
}

function urlReducer(url = initialState.url, action) {
    switch (action.type) {
        case actions.types.STORE_URL: 
            return action.payload;
        default: 
            return url;
    }
}

function walletLoadedReducer(walletLoaded = initialState.walletLoaded, action) {
    switch (action.type) {
        case actions.types.SET_WALLET_LOADED:
            return action.payload;
        default: 
            return walletLoaded;
    }
}

function watchlistLoadedReducer(watchlistLoaded = initialState.watchlistLoaded, action) {
    switch (action.type) {
        case actions.types.SET_WATCHLIST_LOADED:
            return action.payload;
        default: 
            return watchlistLoaded;
    }
}


function tokenWatchlistReducer(tokenWatchlist=initialState.tokenWatchlist, action) {
    var _tokenWatchlist;
    switch (action.type) {
        case actions.types.REMOVE_FROM_WATCHLIST:
            _tokenWatchlist = tokenWatchlist.filter((token) => (
                (token.contract !== action.payload.contract) 
                || (token.tokenID !== action.payload.tokenID)));
            return _tokenWatchlist;
        case actions.types.ADD_TO_WATCHLIST:
            _tokenWatchlist = tokenWatchlist.filter((token) => (
                (token.contract !== action.payload.contract) 
                || (token.tokenID !== action.payload.tokenID)));
            _tokenWatchlist.push(action.payload);
            return _tokenWatchlist;
        case actions.types.SET_WATCHLIST:
            return action.payload;
        default:
            return tokenWatchlist;
    }
}
function accountsReducer(accounts = initialState.accounts, action) {
    switch (action.type) {
        case actions.types.STORE_ACCOUNTS: 
            return action.payload;
        default: 
            return accounts;
    }
}

function primaryAccountReducer(primaryAccount = initialState.primaryAccount, action) {
    switch (action.type) {
        case actions.types.SET_PRIMARY_ACCOUNT:
            return action.payload;
        default: 
            return primaryAccount;
    }
}


function credentialsReducer(credentials = initialState.credentials, action) {
    switch (action.type) {
        case actions.types.STORE_CREDENTIALS: 
            return { haveSecret: true, password: action.payload };
        default: 
            return credentials;
    }
}


function transactionsReducer(transactions=initialState.transactions, action)  {
    var _transactions = [];
    switch (action.type) {
        case actions.types.ADD_TRANSACTION:
            _transactions = transactions.map((txn) => (txn));
            _transactions.push(action.payload);
            return _transactions;
        case actions.types.UPDATE_TRANSACTION:
            _transactions = transactions.map((txn) => ((txn.hash === action.payload.hash) ? action.payload : txn));
            return _transactions; 
        case actions.types.DELETE_TRANSACTION:
            return transactions.filter((item) => (item.hash !== action.payload));
        default:
            return transactions;
    }
    
}

function chainEventsReducer(chainEvents=initialState.chainEvents, action) {
    switch (action.type) {
        case actions.types.CHAIN_EVENT_NOTIFICATION:
            return chainEvents + 1;
        default:
            return chainEvents;
    }    
}

function errorReducer(error=initialState.error, action) {
    switch (action.type) {
        case actions.types.SET_ERROR:
            return action.payload;
        case actions.types.CLEAR_ERROR:
            return "";
        default:
            return error;
    }    
}

const rootReducer = combineReducers({
    accounts: accountsReducer,
    credentials: credentialsReducer,
    primaryAccount: primaryAccountReducer,
    transactions: transactionsReducer,
    chainEvents: chainEventsReducer,
    error: errorReducer,
    url: urlReducer,
    tokenWatchlist: tokenWatchlistReducer,
    walletLoaded: walletLoadedReducer,
    watchlistLoaded: watchlistLoadedReducer
});

export default  rootReducer;

