const constants = {
    txnStatus: {
        PENDING: "pending", // the transaction has been validated by the local node and has received a transaction hash
        MINED: "mined", // a transaction receipt with ok status has been received, indicating that the transaction has been mined
        ERROR: "error" // a transaction receipt has been received with status "not ok" or the transaction has not been validated by the local node
    },
    storageKeys: {
        WALLET: "web3js_wallet_key",
        TOKEN: "web3js_token_key",
        URL: "web3js_url_key",
        WATCHLIST: "web3js_watchlist_key"
    }
}

export default constants;