import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CryptStore, CryptStore__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture(shop: string) {
  const factory = (await ethers.getContractFactory("CryptStore")) as CryptStore__factory;
  const cryptStore = (await factory.deploy(shop)) as CryptStore;
  const cryptStoreAddress = await cryptStore.getAddress();
  return { cryptStore, cryptStoreAddress };
}

describe("CryptStore", function () {
  let signers: Signers;
  let cryptStore: CryptStore;
  let cryptStoreAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ cryptStore, cryptStoreAddress } = await deployFixture(signers.deployer.address));
  });

  it("records purchases and only the shop can decrypt", async function () {
    expect(await cryptStore.getPurchaseCount()).to.eq(0);

    const clearQuantity = 2;
    const clearPrice = 10;

    const encryptedInput = await fhevm
      .createEncryptedInput(cryptStoreAddress, signers.alice.address)
      .add32(clearQuantity)
      .add32(clearPrice)
      .encrypt();

    const tx = await cryptStore
      .connect(signers.alice)
      .recordPurchase("Alice", "Apple", encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    await tx.wait();

    expect(await cryptStore.getPurchaseCount()).to.eq(1);

    const purchase = await cryptStore.getPurchase(0);
    expect(purchase.buyer).to.eq(signers.alice.address);
    expect(purchase.buyerName).to.eq("Alice");
    expect(purchase.productName).to.eq("Apple");

    let aliceCanDecrypt = true;
    try {
      await fhevm.userDecryptEuint(FhevmType.euint32, purchase.quantity, cryptStoreAddress, signers.alice);
    } catch {
      aliceCanDecrypt = false;
    }
    expect(aliceCanDecrypt).to.eq(false);

    const shopQuantity = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      purchase.quantity,
      cryptStoreAddress,
      signers.deployer,
    );
    const shopPrice = await fhevm.userDecryptEuint(FhevmType.euint32, purchase.price, cryptStoreAddress, signers.deployer);

    expect(shopQuantity).to.eq(clearQuantity);
    expect(shopPrice).to.eq(clearPrice);
  });
});

