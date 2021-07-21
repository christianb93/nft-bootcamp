import web3

def connect(url):
    w3 = web3.Web3(web3.Web3.IPCProvider(url));
    assert(w3.isConnected);
    w3.middleware_onion.inject(web3.middleware.geth_poa_middleware, layer=0);
    return w3;

# Connect
w3 = connect("~/.ethereum/geth.ipc");
# Get dev account
dev = w3.eth.get_accounts()[0];
print("Discovered development account", dev);

targetBalance = w3.toWei(10000, "ether");
print("Using target balance of", targetBalance, "wei");
accounts = [
    # A custom account
    {
        "address": "0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D",
        "private_key": "0xc65f2e9b1c360d44070ede41d5e999d30c23657e2c5889d3d03cef39289cea7c",
    },
    # Some accounts from ethnode
    {
        "address": "0x9575eB2a7804c43F68dC7998EB0f250832DF9f10",
        "private_key": "0x2d7bdb58c65480ac5aee00b20d3558fb18a916810d298ed97174cc01bb809cdd",
    },
    {
        "address": "0x6E387779Ed9d4578943556e4D58bF37a8DCEfA88",
        "private_key": "0xf4bb8c9f5a48e2890d02e65acc10bf7ab03c96d7b32cf7c06c00473119aeb18e",
    },
    {
        "address": "0x358A8A6F2277eA74943F31bF5DfA68BCAFa99064",
        "private_key": "0x6858fb0de541c071c08d178d49dc36771cfa7b84332c114c4733c29525c17d65",
    },
    {
        "address": "0xb338661BAf7c6BFfc14cFeB9b2F40f7dcfEe16Ec",
        "private_key": "0xe47ea908c1863f78646b2f2c2bf00482bfcdfd18d280df73411693d41b98ddc9",
    },
    {
        "address": "0xFF66aDab56EeAafABcd7EE03F50B8e3c17E6A57B",
        "private_key": "0x158941b78df8aa5f0f64e43f92a4a088a64eebf7d1dd9f641df550ec5ac98251",
    },
]


for account in accounts:
    currentBalance = w3.eth.get_balance(account['address']);
    if (currentBalance >= targetBalance):
        print("Skipping adress", account['address'], "as it has already sufficient funding");
    else:
        txn_hash = w3.eth.send_transaction({
            "from": dev,
            "to": account['address'],
            "value": targetBalance - currentBalance
        });
        txn_receipt = w3.eth.waitForTransactionReceipt(txn_hash);
        print("Transferred", targetBalance - currentBalance, "wei to account", account['address']);

