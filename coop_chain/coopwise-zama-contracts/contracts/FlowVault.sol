// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "fhevm/lib/TFHE.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FlowVault is ReentrancyGuard {
    address public coopGroup;
    
    // Encrypted accounting
    euint64 private totalLocked;           // Total Flow in vault (encrypted)
    mapping(address => euint64) private userBalances;  // Individual shares (encrypted)
    
    // Public metadata (non-sensitive)
    mapping(address => uint256) public depositCount;
    uint256 public totalDeposits;
    
    modifier onlyGroup() {
        require(msg.sender == coopGroup, "Only CoopGroup");
        _;
    }
    
    constructor() {
        // No token address needed for native currency
    }
    
    // Allow factory to set the coop group address
    function setCoopGroup(address _coopGroup) external {
        require(coopGroup == address(0), "CoopGroup already set");
        coopGroup = _coopGroup;
    }
    
    // Called when member contributes
    function deposit(
        address from, 
        uint256 amount, 
        euint64 encryptedAmount
    ) external onlyGroup nonReentrant payable {
        // Require exact Flow amount sent with transaction
        require(msg.value == amount, "Incorrect Flow amount sent");
        
        // Update encrypted accounting
        totalLocked = TFHE.add(totalLocked, encryptedAmount);
        userBalances[from] = TFHE.add(userBalances[from], encryptedAmount);
        
        depositCount[from]++;
        totalDeposits++;
    }
    
    // Called on payout
    function withdraw(
        address to, 
        uint256 amount, 
        euint64 encryptedAmount
    ) external onlyGroup nonReentrant {
        // Homomorphic subtraction
        totalLocked = TFHE.sub(totalLocked, encryptedAmount);
        userBalances[to] = TFHE.sub(userBalances[to], encryptedAmount);
        
        // Transfer Flow
        (bool success, ) = to.call{value: amount}("");
        require(success, "Flow transfer failed");
    }
    
    // View function: returns encrypted balance for owner decryption
    function getEncryptedBalance(address user) external view returns (euint64) {
        return userBalances[user];
    }
    
    // Emergency function: only callable by factory admin in extreme cases
    function emergencyWithdraw(address to) external onlyGroup {
        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        require(success, "Emergency transfer failed");
    }
}