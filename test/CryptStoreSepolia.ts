import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployments, ethers, fhevm } from "hardhat";
import { CryptStore } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  shop: HardhatEthersSigner;
};

describe("CryptStoreSepolia", function () {
  let signers: Signers;
  let cryptStore: CryptStore;
  let cryptStoreAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("CryptStore");
      cryptStoreAddress = deployment.address;
      cryptStore = await ethers.getContractAt("CryptStore", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { shop: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("records and decrypts a purchase", async function () {
    steps = 8;
    this.timeout(4 * 40000);

    progress(`Read getPurchaseCount()...`);
    const countBefore = await cryptStore.getPurchaseCount();

    progress(`Encrypting inputs...`);
    const encryptedInput = await fhevm
      .createEncryptedInput(cryptStoreAddress, signers.shop.address)
      .add32(3)
      .add32(25)
      .encrypt();

    progress(`Call recordPurchase()...`);
    const tx = await cryptStore
      .connect(signers.shop)
      .recordPurchase("ShopBuyer", "Orange", encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    await tx.wait();

    progress(`Read getPurchaseCount()...`);
    const countAfter = await cryptStore.getPurchaseCount();
    expect(countAfter).to.eq(countBefore + 1n);

    const purchaseId = countBefore;

    progress(`Read getPurchase(${purchaseId})...`);
    const purchase = await cryptStore.getPurchase(purchaseId);

    progress(`Decrypting quantity and price...`);
    const quantityClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      purchase.quantity,
      cryptStoreAddress,
      signers.shop,
    );
    const priceClear = await fhevm.userDecryptEuint(FhevmType.euint32, purchase.price, cryptStoreAddress, signers.shop);

    progress(`quantity=${quantityClear} price=${priceClear}`);
    expect(quantityClear).to.eq(3);
    expect(priceClear).to.eq(25);
  });
});

