// CryptStore contract deployed on Sepolia (replace after deployment)
export const CONTRACT_ADDRESS = '0x95A4C14155d43D29dE0b5A799e26cc3C5259EeC7' as const;
export const IS_CONTRACT_CONFIGURED = true
// ABI generated from the CryptStore contract
export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'initialShop', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'address', name: 'newShop', type: 'address' }],
    name: 'InvalidShop',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'caller', type: 'address' }],
    name: 'NotShop',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'purchaseId', type: 'uint256' }],
    name: 'PurchaseIndexOutOfBounds',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZamaProtocolUnsupported',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'purchaseId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: false, internalType: 'string', name: 'buyerName', type: 'string' },
      { indexed: false, internalType: 'string', name: 'productName', type: 'string' },
    ],
    name: 'PurchaseRecorded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousShop', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newShop', type: 'address' },
    ],
    name: 'ShopTransferred',
    type: 'event',
  },
  {
    inputs: [],
    name: 'confidentialProtocolId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPurchaseCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'purchaseId', type: 'uint256' }],
    name: 'getPurchase',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'buyer', type: 'address' },
          { internalType: 'string', name: 'buyerName', type: 'string' },
          { internalType: 'string', name: 'productName', type: 'string' },
          { internalType: 'euint32', name: 'quantity', type: 'bytes32' },
          { internalType: 'euint32', name: 'price', type: 'bytes32' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct CryptStore.Purchase',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'buyerName', type: 'string' },
      { internalType: 'string', name: 'productName', type: 'string' },
      { internalType: 'externalEuint32', name: 'quantityExt', type: 'bytes32' },
      { internalType: 'externalEuint32', name: 'priceExt', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'recordPurchase',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'shop',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newShop', type: 'address' }],
    name: 'transferShop',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
