import Web3 from 'web3';

var web3 = new Web3(
    new Web3.providers.HttpProvider('http://127.0.0.1:8545')
);

var web3Connection = {
    web3,
}

function switchUrl(url) {
    web3Connection.web3 = new Web3(
        new Web3.providers.HttpProvider(url)
    );
}

export default web3Connection;
export { switchUrl};