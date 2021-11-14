export const ERC721ABI = [
    {
        "constant": true,
        "inputs": [
            { 
                "name": "tokenID", 
                "type": "uint256" 
            }
        ], 
        "name": "ownerOf", 
        "outputs": [
            { 
                "name": "", 
                "type": "address" 
            }
        ], 
        "payable": false, 
        "stateMutability": "view", 
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { 
                "name": "tokenID", 
                "type": "uint256" 
            }
        ], 
        "name": "tokenURI", 
        "outputs": [
            { 
                "name": "", 
                "type": "string" 
            }
        ], 
        "payable": false, 
        "stateMutability": "view", 
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { 
                "name": "from", 
                "type": "address" 
            },
            { 
                "name": "to", 
                "type": "address" 
            },
            { 
                "name": "tokenID", 
                "type": "uint256" 
            }
        ], 
        "name": "safeTransferFrom", 
        "outputs": [],
        "payable": true, 
        "type": "function"
    },
] 
