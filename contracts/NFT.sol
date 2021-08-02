// SPDX-License-Identifier: GPL-3.0


/**
 * We want to ensure that we use at least v0.8 of the Solidity compiler
 * where overflows are checked by default, so we no longer need a SafeMath
 * library - see https://docs.soliditylang.org/en/v0.8.6/control-structures.html#checked-or-unchecked-arithmetic
 */
pragma solidity >=0.8.0 <0.9.0;


/** 
 * @title NFT
 * @dev Implements an ERC721 token, see https://eips.ethereum.org/EIPS/eip-721
 */

contract NFT {

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenID
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 indexed tokenID
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /// magic value returned by a contract
    /// implement ERC721Receiver
    bytes4 internal constant magicValue = 0x150b7a02;

    /// The owner of the contract
    address internal _contractOwner;

    /// Name and symbol of the contract
    string internal constant _name = "Non-fungible token";
    string internal constant _symbol = "MNFT";

    /// The base URI
    string internal  _baseURI = "";

    /// The owner of each token
    mapping (uint256 => address) _ownerOf;

    /// The balance of NFT for each address
    mapping (address => uint256) _balances;

    /// Keep track of approvals per tokenID
    mapping (uint256 => address) _approvals; 

    /// Keep track of operators
    mapping (address => mapping(address => bool)) _isOperatorFor;

    /// Interface IDs
    bytes4 internal constant erc165InterfaceID = 0x01ffc9a7;
    bytes4 internal constant erc721InterfaceID = 0x80ac58cd;
    bytes4 internal constant erc721metadataID = 0x5b5e139f;

    ///
    /// Constructor - remember who the contract owner is and assign initial balance
    /// Also set the baseURI
    ///
    constructor(string memory baseURI)  {
        _baseURI = baseURI;
        _contractOwner = msg.sender;
    }


    /// Return the count of all NFTs assigned to an owner. Throw
    /// if the queried address is 0
    /// @param owner An address for whom to query the balance
    /// @return The number of NFTs owned by `owner`, possibly zero
    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Address 0 is not valid");
        return _balances[owner];
    }

    /// Return the owner of an NFT. If the result is the zero address,
    /// the token is considered invalid and we throw
    /// @param tokenID The identifier for an NFT
    /// @return The address of the owner of the NFT
    function ownerOf(uint256 tokenID) external view returns (address) {
        address owner = _ownerOf[tokenID];
        require(owner != address(0), "This token does not exist");
        return owner;
    }

    /// Mint a token. This is a non-standard extension.
    function _mint(uint256 tokenID) external {
        require(_ownerOf[tokenID]==address(0), "Token already exists");
        require(msg.sender == _contractOwner, "Only owner can mint");
        _balances[_contractOwner] +=1;
        _ownerOf[tokenID] = _contractOwner;
        /// Emit event
        emit Transfer(address(0), _contractOwner, tokenID);
    }

    // Burn a token
    function _burn(uint256 tokenID) external {
        require(msg.sender == _contractOwner, "Only owner can burn token");
        address owner = _ownerOf[tokenID];
        if (owner == address(0)) {
            return;
        }
        _balances[owner] -=1;
        _ownerOf[tokenID] = address(0);
        _approvals[tokenID] = address(0);
        /// Emit event
        emit Transfer(owner, address(0), tokenID);
    }


    /// Transfer ownership of an NFT. Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `from` is
    ///  not the current owner. Throws if `to` is the zero address. Throws if
    ///  `tokenId` is not a valid NFT.
    /// @param from The current owner of the NFT
    /// @param to The new owner
    /// @param tokenID The NFT to transfer
    function transferFrom(address from, address to, uint256 tokenID) external payable {
        doTransferFrom(from, to, tokenID);
    }

    function doTransferFrom(address from, address to, uint256 tokenID) internal {
        address currentOwner = _ownerOf[tokenID];
        require(currentOwner != address(0), "Invalid token ID");
        require(to != address(0), "Cannot send to zero address");
        require(from == currentOwner, "From not current owner");
        bool authorized = (msg.sender == from) 
                            || (_approvals[tokenID] == msg.sender) 
                            || (_isOperatorFor[currentOwner][msg.sender]);
        require(authorized, "Sender not authorized");
        _balances[currentOwner]-=1;
        _balances[to]+=1;
        _ownerOf[tokenID] = to;
        _approvals[tokenID] = address(0);
        /// Emit transfer event. My interpretation of the standard is that this event
        /// is sufficient to also indicate that the approval has been reset. This is in line
        /// with the 0xcert implementation (https://github.com/0xcert/ethereum-erc721/blob/master/src/contracts/tokens/nf-token.sol)
        /// but deviates from the OpenZeppelin implementation, see, however, also this issue
        /// https://github.com/OpenZeppelin/openzeppelin-contracts/issues/1038
        /// which seems to support this point of view
        emit Transfer(from, to, tokenID);
    }

    function isContract(address addr) private view returns (bool){
        uint32 size;
        assembly {
            size := extcodesize(addr)
        }
        return (size > 0);
    }


    function invokeOnERC721Received(address to, address operator, address from, uint256 tokenID, bytes memory data) private {
        if (isContract(to)) {
            ERC721TokenReceiver erc721Receiver = ERC721TokenReceiver(to);
            bytes4 retval = erc721Receiver.onERC721Received(operator, from, tokenID, data);
            require(retval == magicValue, "onERC721Received did not return expected value");
        }
    }

    /// Transfers the ownership of an NFT from one address to another address
    /// Throws if the sender is not authorized or if from is not the current owner
    ///  Throws if `to` is the zero address. Throws if
    ///  `tokenID` is not a valid NFT. When a transfer is complete, this function
    ///  checks if `to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
    /// @param from The current owner of the NFT
    /// @param to The new owner
    /// @param tokenID The NFT to transfer
    /// @param data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(address from, address to, uint256 tokenID, bytes memory data) external payable {
        doTransferFrom(from, to, tokenID);
        invokeOnERC721Received(to, msg.sender, from, tokenID, data);
    }

    /// This works identically to the other function with an extra data parameter,
    /// except this function just sets data to "".
    /// @param from The current owner of the NFT
    /// @param to The new owner
    /// @param tokenID The NFT to transfer
    function safeTransferFrom(address from, address to, uint256 tokenID) external payable {
        doTransferFrom(from, to, tokenID);
        invokeOnERC721Received(to, msg.sender, from, tokenID, bytes(""));
    }

    /// Change or reaffirm the approved address for an NFT
    /// The zero address indicates there is no approved address.
    /// Throws unless `msg.sender` is the current NFT owner, or an authorized
    /// operator of the current owner.
    /// @param approved The new approved NFT controller
    /// @param tokenID The NFT to approve
    function approve(address approved, uint256 tokenID) external payable {
        address currentOwner = _ownerOf[tokenID];
        require(currentOwner != address(0), "Invalid tokenID");
        bool authorized = (msg.sender == currentOwner) 
                           || (_isOperatorFor[currentOwner][msg.sender]);
        require(authorized, "Sender not authorized");
        _approvals[tokenID] = approved;
        emit Approval(_ownerOf[tokenID], approved, tokenID);
    }

    /// Get the approved address for a single NFT
    /// Throws if `tokenID` is not a valid NFT.
    /// @param tokenID The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 tokenID) external view returns (address) {
        require(_ownerOf[tokenID] != address(0), "Invalid tokenID");
        return _approvals[tokenID];
    }

    /// Enable or disable approval for a third party ("operator") to manage
    /// all of `msg.sender`'s assets
    /// Emits the ApprovalForAll event. The contract MUST allow
    /// multiple operators per owner.
    /// @param operator Address to add to the set of authorized operators
    /// @param approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address operator, bool approved) external {
        _isOperatorFor[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /// Query if an address is an authorized operator for another address
    /// @param owner The address that owns the NFTs
    /// @param operator The address that acts on behalf of the owner
    /// @return True if `operator` is an approved operator for `owner`, false otherwise
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _isOperatorFor[owner][operator];
    }

    /// ERC165 - supportsInterface implementation
    /// see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return (interfaceID == erc165InterfaceID) 
                || (interfaceID == erc721InterfaceID)
                || (interfaceID == erc721metadataID);
    }

    /// A descriptive name for a collection of NFTs in this contract
    /// part of the ERC721 Metadata extension
    function name() external pure returns (string memory) {
        return _name;
    }

    /// An abbreviated name for NFTs in this contract
    /// part of the ERC721 Metadata extension
    function symbol() external pure returns (string memory) {
        return _symbol;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        /// taken from OpenZeppelin 
        /// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Strings.sol
        /// MIT licensed
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }    

    /// A distinct Uniform Resource Identifier (URI) for a given asset.
    /// Throws if `tokenID` is not a valid NFT. 
    function tokenURI(uint256 tokenID) external view returns (string memory) {
        require(_ownerOf[tokenID] != address(0), "Not a valid token ID");
        return string(abi.encodePacked(_baseURI, toString(tokenID)));
    }

    /// A non-standard function to retrieve the baseURI
    function _getBaseURI() external view returns (string memory) {
        return _baseURI;
    }
}
/**
 * ERC-721 interface for accepting safe transfers.
 * See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md.
 */
interface ERC721TokenReceiver
{

  function onERC721Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes calldata _data
  )
    external
    returns(bytes4);

}
