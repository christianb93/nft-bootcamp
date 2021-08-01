## Installing and running geth

For many situations, geth in Docker as provided by the [ethnode](https://github.com/vrde/ethnode) is just about perfect - you can start the node with one command, do not have to install anything upfront and have a defined starting point with every test. However, sometimes it is more useful to have a "plain" geth that you can configure yourself and that stores its chain in a location on your hard drive where it is persisted across runs. So let us now try to understand how to install and run geth from scratch.

Geth is writting in Go, and, as all Go programs, therefore comes as one executable which you can download from the [Geth download page](https://geth.ethereum.org/downloads/). For these notes, I have used Geth 1.10.5, for 64 bit Linux platforms. The download is a gzipped tar archive which contains two files - the license (geth is under the GPL) and the binary. All you have to do to install it is to copy the binary into a location which is on your path and mark it as executable. 

When you run geth unconditionally, it will try to connect to mainnet. As we do not want to do this for now, we start geth with the `--dev` flag. We will also use the `--datadir` flag to tell geth where to store its data (the directory will be created if it does not yet exist, default seems to be tmp)

```
geth --dev --datadir=~/.ethereum
```

If you now look for the directory `~/.ethereum`, you will find that geth has created it and has added a few directories and files, like a directory for the actual chain data, a directory to store keys and a Unix socket which can be used to connect to the server and access its RPC API.

Now geth is happily running, but if you look at its output, you will find that the only endpoint that is running by default is the IPC endpoint. To talk to geth and to inspect our blockchain, we will now use the built-in console and start a second instance of geth, telling it to attach to our first instance and to open a console.

```
geth attach ~/.ethereum/geth.ipc
```

The built-in JavaScript console should now open, and we can start to use it. The console comes with an instance of a `web3` object that seems to follow the standard web3 API, and you can display a list of its methods and properties by just typing `web3`. We can see that geth has created one account (the so-called developer account) for us that we can use. 


First, let us inspect the state of the blockchain. We can get the number of the latest block using `web3.eth.blocknumber`, or, alternatively, the shortcut `eth.blocknumber` (it appears that the namespaces like `eth` are made available directly to save us some typing). This should give zero, so there is exactly one block. This block is called the **genesis block** and, if we use development mode, is [created on the fly](https://github.com/ethereum/go-ethereum/blob/5441a8fa47249a9165ece43a2924efe2c7bcdba0/cmd/utils/flags.go#L1665) by geth at startup. Among other things, the genesis block contains the **allocations**, i.e. the initial assignment of ether to some addresses before any blocks are mined. 


Let us now take a look at the accounts. If you take a look at the [source code](https://github.com/ethereum/go-ethereum/blob/5441a8fa47249a9165ece43a2924efe2c7bcdba0/cmd/utils/flags.go#L1631) behind the `dev` flag, then you will see that, upon first start, geth creates a so-called **developer** account and dynamically creates a genesis block that allocates a huge amount of ether to this account. This account is added to the keystore of the node, so we should be able to retrieve it using the eth API.

```
dev = web3.eth.accounts[0];
balance = web3.eth.getBalance(dev);
```

That is a huge amount. It is actually 2^256 - 9 wei. The [same genesis block allocation](https://github.com/ethereum/go-ethereum/blob/5441a8fa47249a9165ece43a2924efe2c7bcdba0/core/genesis.go#L430) contains 9 additional addresses to each of which 1 ether is allocated (these accounts represent the so-called precompiled contracts, these are contracts at defined addresses with - via the yellow paper - standardized functionality that are not actually deployed to the blockchain, but are handled by the EVM if the specified address is invoked, see [the source code here](https://github.com/ethereum/go-ethereum/blob/master/core/vm/contracts.go)), so that the total amount of wei is 2^256. We can verify this as follows.

```
balance = web3.eth.getBalance(dev);
balance.toFixed();
balance.toString(2); // print binary representation
check = web3.toBigNumber(2).pow(256)
balance.add(9).sub(check);
for (var i = 1; i < 10; i++) { console.log(eth.getBalance("0x000000000000000000000000000000000000000"+i))};
```

The developer address also serves as the **etherbase address** for the built-in miner. Recall that on the Ethereum block chain, a miner is rewarded with 2 ETH base fee for mining a block, plus the gas price for the transactions in the block. The reward is booked to the etherbase (which, thus, ends up being the **coinbase** of the new block).

Let us try to add a new account and transfer some ether to that account. There are different ways to do this. Of course, you could use the `web3.personal` API to add an account that is then added to the nodes keystore, but sometimes you might want to add an account which is not controlled by the node. To see how this works, let us try to different options.

First, we will create an account, i.e. a private / public key pair, using Brownie. When we start the brownie console, it will still bring up its own ganache RPC node, as for the time being, our geth is not yet listening on a TCP/IP port, so we can safely do this without interfering with our blockchain. So in a separate window, run

```
brownie console
a = accounts.add();
a.address;
a.private_key;
```

This will print a (random) key and address pair, for instance address "0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D" and with private key "0xc65f2e9b1c360d44070ede41d5e999d30c23657e2c5889d3d03cef39289cea7c". We can now transfer a few ether, say 10000 ether, to this address

```
to = "0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D";
web3.eth.sendTransaction({"from": dev, "to": to, "value": web3.toWei(10000, "ether")});
web3.eth.getBalance(to);
web3.eth.getBalance(to).toFixed();
```

Similarly, we could now transfer ether to any other account. To simplify testing and be able to use the same set of accounts that we use with ethnode, we could now, for instance, go through the accounts used by ethnode, add them and provide some initial ether.

It is also interesting to look at the block number and the balance of the dev account after sending the ether. The balance of the dev account will decrease by a bit more than what we have transferred, as he has to pay the gas for the transfer (and is not rewarded for the block, as in development mode, mining does not seem to generate any rewards), and each transaction will be included in a new block. 

Finally, let us briefly discuss locking and unlocking of an account. If an account in the keystore is unlocked, everybody who has access to the eth API (which is typically made available via HTTP) can run transactions on behalf of this account. Locking refers to the process of encrypting the account (still stored in the keystore of the node) and thus forbidding its usage over the eth API, and unlocking reverts this. Locking and unlocking can only be done using the personal API, and you could configure geth (see below) such that it offers this API only over IPC (so that only someone who has access to the node can do this), while offering the eth API over HTTP.

To see how this works, let us lock the dev account and then try to run the transfer above again.

```
personal.lockAccount(dev);
to = "0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D";
web3.eth.sendTransaction({"from": dev, "to": to, "value": web3.toWei(10000, "ether")});
```

This will raise an error as the account needs to be unlocked (or, alternatively, the *sendTransaction* call in the personal API needs to be used, supplying the password). To unlock the account, we need the passphrase provided when the account was created. A quick look at the source code reveals that in development mode, the default is the empty string, which can be overwritten using the `--password` flag to geth (pointing to a file with the passphrase). So let us try

```
personal.unlockAccount(dev, "");
to = "0xFC2a2b9A68514E3315f0Bd2a29e900DC1a815a1D";
web3.eth.sendTransaction({"from": dev, "to": to, "value": web3.toWei(10000, "ether")});
```

This should now work again. I tend to lock the dev account unless I plan a transfer, just to make sure that tests using only HTTP cannot be accident access the account. An easy way to do this is to use the `--exec` flag of geth. I have written a little Python script that sets up a set of accounts with a minimum balance, so to unlock, run the script and lock, you could do something like

```
geth attach ~/.ethereum/geth.ipc --exec 'personal.unlockAccount(eth.accounts[0], "")'
python3 python/GethSetup.py
geth attach ~/.ethereum/geth.ipc --exec 'personal.lockAccount(eth.accounts[0])'
```

Note that by default, geth does not allow you to unlock a previously locked account while the HTTP API is active (which is not yet the case in our setup), as an additional safeguard.

So far we have used the IPC endpoint only. For most applications, however, we want to enable the HTTP endpoint. We also need to enable CORS and might want to restrict to only the eth API, so that in particular the personal API and the admin API are not enabled. Here is the command to do this.

```
geth --dev --datadir=~/.ethereum \
    --http \
    --http.api="eth" \
    --http.addr=0.0.0.0 \
    --http.vhosts="*" \
    --http.corsdomain="*"
```

Once our server is up and the HTTP API enabled, we can start to connect to it using the methods already discussed, for instance to deploy a contract. A notable difference is that our accounts are now no longer controlled by the node, so we need to manage them locally, i.e. within the framework. In Brownie, this is called a **local account** - Brownie is aware of the private key of this account and is able to use it to sign transactions, but the account is not stored on the node. For instance,

```
brownie console
me = accounts.add("0xc65f2e9b1c360d44070ede41d5e999d30c23657e2c5889d3d03cef39289cea7c");
accounts
```

will show the dev account as `Account` and the newly added account as `LocalAccount`. This account is not stored on the node (as we can check using either the geth console which does not know this account, inspection of the files in the geth keystore or a check with `web3.eth.accounts` in Brownie).     

We can now work with Brownie as usual, but there are a few things that are different when compared to the Ganache instance that Brownie usually brings up. Specifically, we need to set the gas price - which by default is zero - to "auto" and the same for the gas limit, otherwise our transactions end up being stuck in the transaction pool and not mined. So in the console, run

```
network.gas_price("auto");
network.gas_limit("auto")
```

before making any transactions or deploying any contract. 

Alternatively, we can of course use a Python script and web3 to deploy the contract. To deploy our sample NFT, for instance, I have created a script *ERC721/scripts/deployAndMintNFT.py*. So in order to do the deployment, make sure that you are in the root directory of the repository and simply do

```
python3 ERC721/scripts/deployAndMintNFT.py
```

This will compile the contract, deploy (using the account from above as the owner) and mint five token, and then run a few checks to see that this worked. Note that this only works if you have created a sufficient balance in ether for this account.


## Running geth at startup

Let us now see how we can make sure that geth is running at startup. From now on, we will assume that geth is running under a dedicated user, which is more secure and makes the setup a bit easier. Let us first create this user

```
sudo adduser --system --group --disabled-login geth
```

We now prepare the account of this user. First, it makes sense to place a copy of the `geth` binary in the home directory of this user, say in a newly created directory */home/geth/bin*. We then need to create a **systemd unit description** which tells the systemd startup service that we want to run systemd. I have prepared a file that we can use [here](../install/geth.service).

We now need to copy this file to */lib/systemd/system* so that it is picked up by the systemd service, and can then start geth using

```
systemctl start geth
```

Once this works, we can enable the service so that it is automatically started at boot time. This amounts to creating a symlink, but is done automatically by *systemctl* if you run

```
systemctl enable geth
```

Finally, we can run the initial preparations as above, i.e. setting up users with sufficient balance, locking the dev account and installing the contract. Note, however, that we will now have to re-install some of the libraries (py-solc, the solidity compiler itself and web3) as we are now using a different user.

To summarize, here is what we need to do to install geth from scratch, set up accounts, deploy our NFT and mint a few token. 

```
# Create new user
sudo adduser --system --group --disabled-login geth
cd /home/geth
sudo -s -u geth
# Download and install geth binary
cd
wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.10.5-33ca98ec.tar.gz
gzip -d geth-linux-amd64-1.10.5-33ca98ec.tar.gz
tar -xvf  geth-linux-amd64-1.10.5-33ca98ec.tar
mkdir bin
cp geth-linux-amd64-1.10.5-33ca98ec/geth ~/bin/
chmod 700 bin/geth
# Clone this repository
git clone https://github.com/christianb93/nft-bootcamp.git
cd nft-bootcamp
# Create systemd configuration - need to become root again for this
exit
sudo cp nft-bootcamp/install/geth.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl start geth
sudo systemctl status geth
# Inspect log output. If everything looks good, enable so that it is restarted and proceed
sudo systemctl enable geth
sudo -s -u geth
cd nft-bootcamp
pip3 install web3
pip3 install py-solc-x
python3 -m solcx.install v0.8.6
python3 python/GethSetup.py
geth attach ~/.ethereum/geth.ipc --exec 'personal.lockAccount(eth.accounts[0])'
```

## Running a geth testnet client in the cloud

So far, we have used the geth client to run our own, single-node development network. Let us now try to connect to a test network. Due to bandwith and storage requirements, I typically use a cloud-based virtual machine to do this. So head over to your favorite cloud provider, get a virtual machine and log in  (I used DigitalOcean, choosing a droplet with Ubuntu 20.04 installed, 16 GB memory, 8 CPU cores and 320 GB SSD disk). On this machine, go through the following steps (see above for details).

* Create a new user geth
* Download the geth binary and install it in the home directory of this user
* Clone my repository

Next we have to modify the systemd service definition supplied in the *install* subdirectory of the repository. Make the following changes
* remove the flag *--dev*
* instead, add the flag *--rinkeby** to connect to the Rinkeby test network
* remove all *http* options, unless you want to start the HTTP API (this would make the API accessible for everybody on the public internet, at least if you do not set up a firewall rule to avoid this)

Then save the updated file, copy it to */lib/systemd/system*, reload the definitions and start the service. If you watch the outputs using *systemctl status geth*, you will see that the client is starting and is looking for peers to connect to. Now start the JS console (i.e. run geth attached to the daemon) and use `net`and `eth.syncing` to inspect the state of the chain. You should see that the client has found some peers after a few seconds, and that the synchronisation has started. You can follow the progress using

```
journalctl -f --unit=geth
```

Syncing can take some time. When I did this, the Rinkeby test network did contain a bit over 9 million blocks, and syncing took somewhere around 90 minutes and 76 GB of disk space in the geth data directory. While syncing, the geth client consumed roughly 20% of the available memory (i.e. roughly 3 GB) and between three and four hyperthreads. Once syncing is complete, the output of `eth.syncing` will be `false` and the output of `eth.blockNumber` will be the latest block number - you might want to compare this to the values you find on http://rinkeby.etherscan.io. When you look at the output of netstat during syncing, you will also realize that there are some connections that the client establishes to port 30303 of peers (i.e. outbound connections), but also some connections that are incoming and directed to port 30303 of your node, so if you are behind a firewall, syncing should still be possible but is probably faster if you have those ports open. 

Also note that with these settings, there are no predefined accounts managed by the node, no etherbase is set, and the node is not mining - which is obvious, as the Rinkeby test network has already done the switch to the POA consensus algorithm. Thus to make transactions, you will need an initial supply of ether. If you have a social media account, a faucet that you can use is https://faucet.rinkeby.io/. To do this, you obviously need an account first, so go ahead and create one, maybe using Brownie.

```
brownie console
me = accounts.add()
me.private_key
me.address
```

This will print out the private key and the address of your account. Store that data safely. Then follow the instructions on the [faucet side](https://faucet.rinkeby.io/) to create a tweet requesting Ether and copy the URL of that tweet (or post) into the input field. For me, it took only a couple of seconds until I got the funding. Once done, you can use MetaMask to easily verify that the deposit has been made, and inspect the transaction on Etherscan. Once your node has synced, you should be able to also locate this transaction from the JavaScript console. My Rinkeby testnet address is 0xdf91A172BBc64d4838c1a76d8982da0B70bea5CF, and the hash of the funding transaction is 0x5ccd428393264a81b647fb2eec2a65d43c887b9ea868fbc646f915ac9a76490b in block 9040305.

```
eth.getTransaction("0x5ccd428393264a81b647fb2eec2a65d43c887b9ea868fbc646f915ac9a76490b")
```

You can now deploy an NFT like in a local setup. If you want to use the [script](deployAndMintNFT.py) that I have provided for this, you will first have to start the HTTP API to be able to do this. You can do this temporarily using 

```
admin.startHTTP()
```

in the console. Then, install web3 and solc-x as described above, and run the script - do not forget to provide the owner and the key of the account that you want to own the NFT, this should be an account containing a sufficient amount of ether to run the deployment. I have deployed several versions of the NFT in the testnet, one is at address 0x1b739d9662981246292BAc0B0439D04E8718CFA7. 




