# CryptStore

Privacy-first purchase ledger built on FHEVM. CryptStore records buyer and product names in plaintext, while quantity and
price remain encrypted on-chain and can only be decrypted by the shop wallet.

## Overview
CryptStore is a simple, auditable store record system for blockchain environments where business-sensitive data must not
be publicly visible. It combines Zama FHEVM encrypted types with a React-based frontend so customers can submit purchases
while merchants retain exclusive decryption rights over the sensitive fields.

## Problems Solved
- Protects quantity and price from public chain observers.
- Eliminates reliance on a centralized database while preserving auditability.
- Keeps readable buyer/product context without exposing sensitive business metrics.
- Ensures only the store owner can decrypt encrypted values via FHEVM access controls.

## Key Advantages
- End-to-end confidentiality for numeric fields using FHEVM encrypted types.
- Clear access control model: the contract and shop are the only parties allowed to decrypt.
- On-chain event trail for purchase history with deterministic timestamps.
- Wallet-native UX for customers and merchants with no off-chain database requirement.
- Simple integration path for additional analytics and inventory logic later.

## How It Works (Data Flow)
1. Buyer connects a wallet and fills in buyer name, product name, quantity, and price.
2. The frontend encrypts quantity and price using the Zama relayer SDK.
3. The encrypted handles and proof are sent to the `recordPurchase` contract method.
4. The contract stores encrypted values and grants decryption permission to the shop address.
5. Anyone can read purchase metadata (buyer, buyer name, product name, timestamp).
6. Only the shop wallet can request decryption of quantity and price through the relayer flow.

## Smart Contract Design
Primary contract: `CryptStore`

Data model (`Purchase`):
- `buyer` (address): submitter address
- `buyerName` (string): plaintext buyer name
- `productName` (string): plaintext product name
- `quantity` (euint32): encrypted quantity
- `price` (euint32): encrypted price
- `timestamp` (uint256): block timestamp

Core methods:
- `recordPurchase(...)`: stores a purchase with encrypted quantity and price.
- `getPurchaseCount()`: returns the number of purchases.
- `getPurchase(purchaseId)`: returns a full purchase record (encrypted fields stay encrypted).
- `transferShop(newShop)`: updates the shop address (decryption authority).

Events:
- `PurchaseRecorded`: emitted on new purchase.
- `ShopTransferred`: emitted when shop authority changes.

Access control:
- `shop` is the only address authorized to decrypt `quantity` and `price`.
- The contract itself is also allowed access for future encrypted operations.

## Frontend Features
- Purchase form with client-side validation for uint32 quantity and price.
- Merchant dashboard that lists purchases, metadata, and encrypted handles.
- Decrypt button available only to the shop wallet.
- Wallet connection via RainbowKit and wagmi.
- Reads use viem (via wagmi), writes use ethers for encrypted submissions.

## Tech Stack
Smart contracts:
- Solidity 0.8.24
- Zama FHEVM (`@fhevm/solidity`)
- Hardhat + hardhat-deploy

Frontend:
- React + Vite
- wagmi + RainbowKit for wallet UX
- viem for reads
- ethers for writes
- Zama relayer SDK for encryption and decryption

Tooling:
- TypeScript
- ESLint + Prettier
- Hardhat test and coverage tools

## Repository Layout
- `contracts/`: Solidity contracts
- `deploy/`: deployment scripts
- `tasks/`: Hardhat tasks
- `test/`: tests
- `deployments/`: deployed contract artifacts by network
- `src/`: frontend application (Vite project)
- `docs/`: project and Zama references

## Prerequisites
- Node.js 20+
- npm 7+

## Local Development (Contracts)
1. Install dependencies
   ```bash
   npm install
   ```
2. Compile and test
   ```bash
   npm run compile
   npm run test
   ```
3. Run a local node and deploy
   ```bash
   npm run chain
   npm run deploy:localhost
   ```

## Sepolia Deployment
1. Ensure `.env` contains:
   - `INFURA_API_KEY`
   - `PRIVATE_KEY` (private key of the deployer wallet)
2. Deploy:
   ```bash
   npm run deploy:sepolia
   ```
3. Optional verification:
   ```bash
   npm run verify:sepolia -- <CONTRACT_ADDRESS>
   ```

## Frontend Setup
1. Go to the frontend folder:
   ```bash
   cd src
   npm install
   ```
2. Configure the contract:
   - Update `src/src/config/contracts.ts` with the deployed address.
   - Copy the ABI generated in `deployments/sepolia` into `src/src/config/contracts.ts`.
3. Run the app:
   ```bash
   npm run dev
   ```

## Usage Guide
- Buyer flow:
  - Connect wallet.
  - Enter buyer name, product name, quantity, and price.
  - Submit the transaction; encrypted fields are stored on-chain.
- Merchant flow:
  - Connect the shop wallet.
  - Open the Merchant Dashboard.
  - Decrypt quantity and price for any purchase as needed.

## Security and Privacy Notes
- Quantity and price are stored as encrypted `euint32` values on-chain.
- Buyer and product names are plaintext for easy indexing and audit.
- Only the shop address can decrypt encrypted values.
- All reads are public, but encrypted fields remain opaque without permission.

## Known Constraints
- Encrypted computations are more expensive than plaintext storage.
- Buyer/product names are not encrypted to keep usability simple.
- Only one shop address is authorized at a time.

## Future Roadmap
- Encrypted aggregates for sales totals and inventory forecasting.
- Multi-store support with role-based decryption rights.
- Optional SKU catalogs and product validation.
- Exportable audit summaries for accounting.
- Event-driven analytics dashboards with encrypted metrics.

## License
BSD-3-Clause-Clear. See `LICENSE`.
