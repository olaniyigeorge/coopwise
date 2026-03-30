import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployRotationLogic = await deploy("RotationLogic", {from: deployer, log: true})

  const deployedCoopGroupFactory = await deploy("CoopGroupFactory", {
    args: [deployRotationLogic.address],
    from: deployer,
    log: true,
  });

  console.log(`Rotation Logic: ${deployRotationLogic.address}`)
  console.log(`Coop Group Factory contract: ${deployedCoopGroupFactory.address}`);
};
export default func;
func.id = "deploy_rotationLogic, deploy_coopGroupFactory"; // id required to prevent reexecution
func.tags = ["RotationLogic", "CoopGroupFactory"];
