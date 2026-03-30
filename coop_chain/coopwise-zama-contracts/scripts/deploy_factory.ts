import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    // 1. Deploy RotationLogic (stateless, can be singleton)
    const RotationLogic = await ethers.getContractFactory("RotationLogic");
    const rotationLogic = await RotationLogic.deploy();
    await rotationLogic.waitForDeployment();
    console.log("RotationLogic:", await rotationLogic.getAddress());

    // 2. Deploy Factory
    const CoopGroupFactory = await ethers.getContractFactory("CoopGroupFactory");
    const factory = await CoopGroupFactory.deploy(
        await rotationLogic.getAddress()
    );
    await factory.waitForDeployment();
    console.log("Factory:", await factory.getAddress());

    // 3. Create test group
    const tx = await factory.createGroup(
        "Test Savings Group",
        10000000, // 10 USDT (6 decimals)
        7 * 24 * 60 * 60, // 7 days
        5 // 5 members max
    );
    const receipt = await tx.wait();
    console.log("Test group created");
    console.log("Group address:", receipt.logs[0].args[0]);
    console.log("Vault address:", receipt.logs[0].args[1]);
}

main().catch(console.error);