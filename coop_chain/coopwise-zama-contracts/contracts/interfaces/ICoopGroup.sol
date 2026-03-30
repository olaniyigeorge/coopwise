// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint32, externalEuint32, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

interface ICoopGroup {
    struct GroupConfig {
        string name;
        euint64 contributionAmount;      // Encrypted: fixed amount per cycle
        uint256 cycleDuration;           // In seconds
        uint256 maxMembers;
        uint256 payoutOrderSeed;         // For deterministic rotation
    }
    
    struct Member {
        address wallet;
        euint64 totalContributed;        // Encrypted lifetime contribution
        ebool hasPaidCurrentRound;       // Encrypted payment status
        uint256 joinTime;
        uint256 lastPayoutRound;
        bool isActive;
    }
    
    event MemberJoined(address indexed groupId, address indexed member, uint256 timestamp);
    event ContributionReceived(address indexed groupId, address indexed member, bytes encryptedAmount);
    event PayoutExecuted(address indexed groupId, address indexed recipient, uint256 roundNumber);
    event RoundCompleted(address indexed groupId, uint256 roundNumber);
    
    function contribute(externalEuint64 encryptedAmount, bytes calldata inputProof, uint256 publicAmount) external payable;
    function executePayout(uint256 publicPayoutAmount) external;
    function getEncryptedBalance() external view returns (bytes32);
    function getNextPayoutRecipient() external view returns (address);
}