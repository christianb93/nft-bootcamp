// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


contract ERC721TokenReceiverImplementation {

    bytes4 internal constant magicValue = 0x150b7a02;
    bytes4 internal constant wrongMagicValue = 0x150b7a01;
    uint256 internal invocationCount;
    bool internal returnCorrectValue = true;

    function onERC721Received(address, address,  uint256, bytes memory) external payable returns(bytes4) {
        invocationCount++;
        if (returnCorrectValue) {
            return magicValue;
        }
        return wrongMagicValue;
    }

    function getInvocationCount() public view returns(uint256) {
        return invocationCount;
    }

    function setReturnCorrectValue(bool value) external {
        returnCorrectValue = value;
    }

}
