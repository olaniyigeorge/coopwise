// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@fhevm/solidity/lib/FHE.sol";

interface IFlowVault {
    function setCoopGroup(address _coopGroup) external;
    
    function deposit(
        address from, 
        uint256 amount, 
        euint64 encryptedAmount
    ) external payable;
    
    function withdraw(
        address to, 
        uint256 amount, 
        euint64 encryptedAmount
    ) external;
    
    function getEncryptedBalance(address user) external view returns (euint64);
    
    function emergencyWithdraw(address to) external;
}