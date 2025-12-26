// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CryptStore
/// @notice A simple store purchase ledger where quantity and price are stored encrypted (FHEVM).
/// @dev Only the shop address is granted decryption permissions for encrypted fields.
contract CryptStore is ZamaEthereumConfig {
    struct Purchase {
        address buyer;
        string buyerName;
        string productName;
        euint32 quantity;
        euint32 price;
        uint256 timestamp;
    }

    /// @notice Address allowed to decrypt purchase quantity and price.
    address public shop;

    Purchase[] private _purchases;

    event PurchaseRecorded(uint256 indexed purchaseId, address indexed buyer, string buyerName, string productName);
    event ShopTransferred(address indexed previousShop, address indexed newShop);

    error NotShop(address caller);
    error InvalidShop(address newShop);
    error PurchaseIndexOutOfBounds(uint256 purchaseId);

    constructor(address initialShop) {
        if (initialShop == address(0)) revert InvalidShop(initialShop);
        shop = initialShop;
    }

    modifier onlyShop() {
        if (msg.sender != shop) revert NotShop(msg.sender);
        _;
    }

    /// @notice Records a purchase with encrypted quantity and price.
    /// @param buyerName Buyer name in plaintext.
    /// @param productName Product name in plaintext.
    /// @param quantityExt Encrypted quantity (external handle).
    /// @param priceExt Encrypted price (external handle).
    /// @param inputProof Zama input proof for the encrypted inputs.
    function recordPurchase(
        string calldata buyerName,
        string calldata productName,
        externalEuint32 quantityExt,
        externalEuint32 priceExt,
        bytes calldata inputProof
    ) external {
        euint32 quantity = FHE.fromExternal(quantityExt, inputProof);
        euint32 price = FHE.fromExternal(priceExt, inputProof);

        _purchases.push(
            Purchase({
                buyer: msg.sender,
                buyerName: buyerName,
                productName: productName,
                quantity: quantity,
                price: price,
                timestamp: block.timestamp
            })
        );

        // The contract must keep access to operate on ciphertexts later if needed.
        FHE.allowThis(quantity);
        FHE.allowThis(price);

        // Only the shop is allowed to decrypt.
        FHE.allow(quantity, shop);
        FHE.allow(price, shop);

        emit PurchaseRecorded(_purchases.length - 1, msg.sender, buyerName, productName);
    }

    /// @notice Returns the total number of recorded purchases.
    function getPurchaseCount() external view returns (uint256) {
        return _purchases.length;
    }

    /// @notice Returns the purchase record at the specified index.
    /// @dev Encrypted fields can only be decrypted by accounts granted access via ACL (the shop).
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        if (purchaseId >= _purchases.length) revert PurchaseIndexOutOfBounds(purchaseId);
        return _purchases[purchaseId];
    }

    /// @notice Updates the shop address (decryption authority).
    function transferShop(address newShop) external onlyShop {
        if (newShop == address(0)) revert InvalidShop(newShop);
        address previousShop = shop;
        shop = newShop;
        emit ShopTransferred(previousShop, newShop);
    }
}

