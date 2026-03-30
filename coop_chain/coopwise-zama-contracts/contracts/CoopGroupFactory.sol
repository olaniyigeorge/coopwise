// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint32, externalEuint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import "./CoopGroup.sol";
import "./FlowVault.sol";
import "./RotationLogic.sol";

contract CoopGroupFactory {
    address public rotationLogic;
    address public owner;
    
    address[] public allGroups;
    mapping(address => address[]) public userGroups;
    
    event GroupCreated(
        address indexed groupAddress, 
        address indexed vaultAddress,
        string name, 
        address creator,
        uint256 timestamp
    );
    
    constructor(address _rotationLogic) {
        rotationLogic = _rotationLogic;
        owner = msg.sender;
    }
    
    function createGroup(
        string calldata name,
        uint64 contributionAmount,        // In Flow smallest unit
        uint256 cycleDuration,            // Seconds between payouts
        uint256 maxMembers
    ) external returns (address groupAddress, address vaultAddress) {
        require(maxMembers >= 2 && maxMembers <= 50, "Members: 2-50");
        require(cycleDuration >= 1 days && cycleDuration <= 90 days, "Duration: 1-90 days");
        require(contributionAmount > 0, "Amount must be > 0");
        
        // Deploy vault first
        FlowVault vault = new FlowVault();
        vaultAddress = address(vault);
        
        // Deploy group
        CoopGroup group = new CoopGroup(
            name,
            contributionAmount,
            cycleDuration,
            maxMembers,
            vaultAddress,
            rotationLogic,
            msg.sender  // Group owner/creator
        );
        groupAddress = address(group);
        
        // Set group as vault owner
        vault.setCoopGroup(groupAddress);
        
        allGroups.push(groupAddress);
        userGroups[msg.sender].push(groupAddress);
        
        emit GroupCreated(groupAddress, vaultAddress, name, msg.sender, block.timestamp);
        
        return (groupAddress, vaultAddress);
    }
    
    function getGroupsByUser(address user) external view returns (address[] memory) {
        return userGroups[user];
    }
    
    function getAllGroups() external view returns (address[] memory) {
        return allGroups;
    }
}