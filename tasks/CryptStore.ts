import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Example:
 *   - npx hardhat --network localhost cryptstore:address
 *   - npx hardhat --network sepolia cryptstore:address
 */
task("cryptstore:address", "Prints the CryptStore address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;
  const cryptStore = await deployments.get("CryptStore");
  console.log("CryptStore address is " + cryptStore.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost cryptstore:record --buyer \"Alice\" --product \"Apple\" --quantity 2 --price 10
 *   - npx hardhat --network sepolia cryptstore:record --buyer \"Alice\" --product \"Apple\" --quantity 2 --price 10
 */
task("cryptstore:record", "Records a purchase in CryptStore")
  .addOptionalParam("address", "Optionally specify the CryptStore contract address")
  .addParam("buyer", "Buyer name (plaintext string)")
  .addParam("product", "Product name (plaintext string)")
  .addParam("quantity", "Quantity (integer, encrypted)")
  .addParam("price", "Price (integer, encrypted)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const quantity = parseInt(taskArguments.quantity);
    const price = parseInt(taskArguments.price);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Argument --quantity must be a non-negative integer`);
    if (!Number.isInteger(price) || price < 0) throw new Error(`Argument --price must be a non-negative integer`);

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("CryptStore");
    console.log(`CryptStore: ${deployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const cryptStore = await ethers.getContractAt("CryptStore", deployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add32(quantity)
      .add32(price)
      .encrypt();

    const tx = await cryptStore
      .connect(signer)
      .recordPurchase(taskArguments.buyer, taskArguments.product, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost cryptstore:decrypt --id 0
 *   - npx hardhat --network sepolia cryptstore:decrypt --id 0
 */
task("cryptstore:decrypt", "Decrypts a purchase (shop only)")
  .addOptionalParam("address", "Optionally specify the CryptStore contract address")
  .addParam("id", "Purchase id (uint256 index)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("CryptStore");
    console.log(`CryptStore: ${deployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const cryptStore = await ethers.getContractAt("CryptStore", deployment.address);
    const purchaseId = BigInt(taskArguments.id);

    const purchase = await cryptStore.getPurchase(purchaseId);
    console.log(`buyer=${purchase.buyer} buyerName="${purchase.buyerName}" productName="${purchase.productName}" timestamp=${purchase.timestamp}`);

    const quantityClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      purchase.quantity,
      deployment.address,
      signer,
    );
    const priceClear = await fhevm.userDecryptEuint(FhevmType.euint32, purchase.price, deployment.address, signer);

    console.log(`quantity=${quantityClear} price=${priceClear}`);
  });

