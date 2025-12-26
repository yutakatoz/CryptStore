import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployerSigner] = await hre.ethers.getSigners();
  if (!deployerSigner) {
    throw new Error("No deployer signer available. For Sepolia, set PRIVATE_KEY in .env.");
  }
  const deployer = await deployerSigner.getAddress();
  const { deploy } = hre.deployments;

  const deployedCryptStore = await deploy("CryptStore", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log(`CryptStore contract: `, deployedCryptStore.address);
};

export default func;
func.id = "deploy_cryptStore"; // id required to prevent reexecution
func.tags = ["CryptStore"];
