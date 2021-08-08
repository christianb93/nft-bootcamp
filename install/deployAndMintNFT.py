# Compile a Solidity source code 
import argparse
import web3
import os
import solcx
import binascii

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source",
                    type=str, 
                    default="contracts/NFT.sol",
                    help="Location of source file")
    parser.add_argument("--contract",
                    type=str, 
                    default="NFT",
                    help="Contract to deploy")
    parser.add_argument("--url",
                    type=str,
                    default="http://127.0.0.1:8545",
                    help="URL of RPC client" );
    parser.add_argument("--owner",
                    type=str,
                    default="0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D",
                    help="Address of contract owner");
    parser.add_argument("--key",
                    type=str,
                    default="0xc65f2e9b1c360d44070ede41d5e999d30c23657e2c5889d3d03cef39289cea7c",
                    help="Private key of contract owner"); 
    parser.add_argument("--baseURI",
                    type=str,
                    default="https://leftasexercise.fra1.digitaloceanspaces.com/nft/metadata/",
                    help="Base URI to be used by the contracts tokenURI method");
    parser.add_argument("--gas",
                    type=int,
                    default=3000000,
                    help="Gas limit for the deployment");                 
    args=parser.parse_args()
    return args


def connect(url):
    w3 = web3.Web3(web3.Web3.HTTPProvider(url));
    assert(w3.isConnected);
    w3.middleware_onion.inject(web3.middleware.geth_poa_middleware, layer=0);
    return w3;


def assemble_spec(source):
    # Assemble the specification
    # First we need to determine the actual file name
    _,file = os.path.split(source);
    # Now assemble the spec - see 
    # https://docs.soliditylang.org/en/develop/using-the-compiler.html#compiler-input-and-output-json-description
    spec = {
        "language": "Solidity",
        "sources": {
            file: {
                "urls": [
                    source
                ]
            }
        },
        "settings": {
            "optimizer": {
                "enabled": True
            },
            "outputSelection": {
                "*": {
                    "*": [
                        "metadata", "evm.bytecode", "abi"
                    ]
                }
            }
        }
    }
    return file, spec;

def deploy(abi, bytecode, w3, owner, key, gas, arg): 
    # First we construct a local representative of the contract
    # based on bytecode and ABI
    c = w3.eth.contract(abi=abi, bytecode=bytecode);
    # Build a skeleton transaction which still needs to be completed
    # and signed
    txn = c.constructor(arg).buildTransaction();
    # Add from and nonce
    txn["from"] = owner;
    txn_count = w3.eth.get_transaction_count(owner);
    txn["nonce"] = txn_count;
    txn['gas'] = gas;
    # Sign and submit
    signed_txn = w3.eth.account.sign_transaction(txn, key);
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction);
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash);
    if ((txn_receipt['contractAddress']=="")) :
        print("Error during deployment, full transaction receipt: ", txn_receipt);
        raise(RuntimeError);
    print("Gas used for deployment:", txn_receipt['gasUsed']);
    return txn_receipt['contractAddress'];

def sign_and_submit(txn, sender, key):
    txn["from"] = sender;
    txn_count = w3.eth.get_transaction_count(sender);
    txn["nonce"] = txn_count;
    # Sign and submit
    signed_txn = w3.eth.account.sign_transaction(txn, key);
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction);
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash);
    return txn_receipt;


args = get_args();
source = args.source;
print("Compiling from source file", source);

#  Connect
w3 = connect(args.url);

# Run the actual compile
file, spec = assemble_spec(source);
out = solcx.compile_standard(spec, allow_paths=".");
contracts = list(out["contracts"][file].keys());
contract_addresses=dict();
for contract in contracts:
    abi = out['contracts'][file][contract]['abi'];
    bytecode =  out['contracts'][file][contract]['evm']['bytecode']['object'];
    # First create a local contract object from bytecode and ABI
    if (contract == args.contract):
        contract_addresses[contract] = deploy(abi, bytecode, w3, args.owner, args.key, args.gas, args.baseURI);

contract = contract_addresses[args.contract]
print("Deployed NFT at", contract);
print("Let me now run some checks - I will try to get the token name and symbol");

#
# Get reference to contract
#
abi = out['contracts'][file][args.contract]['abi'];
c = w3.eth.contract(address=contract, abi=abi);

#
# Make a test call
#
print("Token name  : ", c.functions.name().call());
print("Token symbol: ", c.functions.symbol().call());

print("This worked, I will now mint a few token");
#
# Now mint five token
#
for i in range(1,6):
    txn = c.functions._mint(i).buildTransaction({"from": args.owner, "gas": 100000});
    txn_receipt = sign_and_submit(txn, args.owner, args.key);
    # Check that this worked
    ownerOf = c.functions.ownerOf(i).call();
    assert(ownerOf == args.owner);
    print("Successfully minted token", i, "with tokenURI", c.functions.tokenURI(i).call());


