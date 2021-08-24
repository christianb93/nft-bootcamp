# Compile, deploy and run a sample set of
# contracts to create a non-trivial call tree
import argparse
import web3
import os
import solcx
import binascii
import json

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url",
                    type=str,
                    default="http://127.0.0.1:8545",
                    help="URL of RPC client" );
    parser.add_argument("--owner",
                    type=str,
                    # This is the geth default coinbase address
                    default="0xd489f87665ed713E602290BE7c01269Fc129f4Ea",
                    help="Address of contract owner (needs to be a node-managed account");
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
    # https://docs.soliditylang.org/en/develop/using-the-compiler.html#compiler-input-and-output-json-description
    spec = {
        "language": "Solidity",
        "sources": {
            "CallTrace": {
                "content": source
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
    return spec;

def deploy(abi, bytecode, w3, owner, gas, constructorArg = ""): 
    # First we construct a local representative of the contract
    # based on bytecode and ABI
    c = w3.eth.contract(abi=abi, bytecode=bytecode);
    # Build a skeleton transaction which still needs to be completed
    # and signed
    txn = c.constructor(constructorArg).buildTransaction();
    # Add from and nonce
    txn["from"] = owner;
    txn_count = w3.eth.get_transaction_count(owner);
    txn["nonce"] = txn_count;
    txn['gas'] = gas;
    # Submit
    txn_hash = w3.eth.send_transaction(txn);
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash);
    if ((txn_receipt['contractAddress']=="")) :
        print("Error during deployment, full transaction receipt: ", txn_receipt);
        raise(RuntimeError);
    return txn_receipt['contractAddress'];


args = get_args();

# The source code for the test contracts. The following contracts are involved
# Echo - this contract has a single method that simply returns its own argument
# Child - this contract invokes the Echo contract in its constructor
# Root - this contract starts the call chain. It first invokes the Echo contract directly. 
#        It then creates a copy of the Child contract which in its constructor should again call 
#        the Echo contract
#
source = """
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
contract Echo {
    function echo(uint256 _value) public returns(uint256) {
        return _value;
    }
}
contract Root {
    Echo echoInstance;
    Child childInstance;
    address owner;
    constructor(address _echo) {
        echoInstance = Echo(_echo);
        owner = msg.sender;
    }
    function run(uint256 _value) public {
        // Make a direct echo call
        echoInstance.echo(_value);
        // Now create a copy of the Child contract
        childInstance = new Child(echoInstance);
        // and call it 
        childInstance.run(_value+1);
        // finally self-destruct
        selfdestruct(payable(owner));
    }
}
contract Child {
    event ChildCreated();

    Echo echoInstance;
    constructor(Echo _echo) {
        require(_echo.echo(5) == 5, "Echo did not return expected value");
        echoInstance = _echo;
        emit ChildCreated();
    }
    function run(uint256 _value) public returns (uint256) {
        return(echoInstance.echo(_value));
    }
}
"""

#  Connect
w3 = connect(args.url);

# Run the actual compile
spec = assemble_spec(source);
out = solcx.compile_standard(spec, allow_paths=".");
contracts = list(out["contracts"]["CallTrace"].keys());
contract_addresses=dict();

# First we deploy the Echo contract
abi = out['contracts']["CallTrace"]["Echo"]['abi'];
bytecode =  out['contracts']["CallTrace"]["Echo"]['evm']['bytecode']['object'];
contract_addresses["Echo"] = deploy(abi, bytecode, w3, args.owner,  args.gas);

print("Deployed Echo contract at address", contract_addresses['Echo']);

#
# Now run a test to see that this works
#
echo = w3.eth.contract(address=contract_addresses['Echo'], abi=abi);
assert(100 ==  echo.functions.echo(100).call());

#
# Deploy the root contract
#
abi = out['contracts']["CallTrace"]["Root"]['abi'];
bytecode =  out['contracts']["CallTrace"]["Root"]['evm']['bytecode']['object'];
contract_addresses["Root"] = deploy(abi, bytecode, w3, args.owner, args.gas, echo.address);

print("Deployed Root contract at address", contract_addresses['Root']);



#
# Run a transaction
#
print("Now invoking the run() method as a transaction");
root = w3.eth.contract(address=contract_addresses['Root'], abi=abi);
txn_hash = root.functions.run(100).transact({"from": args.owner});
txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash);
if (txn_receipt['status'] == 1):
    print("Done, transaction hash is ", w3.toHex(txn_hash), "in block", txn_receipt['blockNumber']);
else:
    print("Something went wrong, full receipt: ", txn_receipt);
    exit(1);

#
# Figure out the address of the child
#
print("Child has been created at", txn_receipt['logs'][0]['address']);

#
# Now let us get a trace
#
block_number =txn_receipt['blockNumber'];
response = w3.manager.request_blocking(method="debug_traceBlockByNumber", 
                                        params=[hex(block_number), {"Tracer": "callTracer"}]);
print(json.dumps(response, indent=4));