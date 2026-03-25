// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "fhevm/lib/TFHE.sol";

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
    
    function contribute(bytes calldata encryptedAmount) external;
    function executePayout() external;
    function getEncryptedBalance() external view returns (bytes memory);
    function getNextPayoutRecipient() external view returns (address);
}