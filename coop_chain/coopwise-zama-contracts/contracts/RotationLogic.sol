// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, ebool, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract RotationLogic {
    struct RotationState {
        address[] members;
        uint256 currentIndex;
        uint256 seed;
        uint256 roundNumber;
        mapping(address => bool) hasReceivedPayout;
    }
    
    // Deterministic shuffle using Fisher-Yates + blockhash seed
    function initializeRotation(
        address[] calldata members,
        uint256 seed
    ) external pure returns (address[] memory) {
        require(members.length > 1, "Need 2+ members");
        
        address[] memory shuffled = new address[](members.length);
        for (uint i = 0; i < members.length; i++) {
            shuffled[i] = members[i];
        }
        
        // Fisher-Yates shuffle with on-chain randomness
        for (uint i = shuffled.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(seed, i))) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }
        
        return shuffled;
    }
    
    // Get next recipient without modifying state (view)
    function peekNextRecipient(
        address[] calldata rotationOrder,
        uint256 currentIndex
    ) external pure returns (address) {
        require(currentIndex < rotationOrder.length, "Rotation complete");
        return rotationOrder[currentIndex];
    }
    
    // Verify all members paid before allowing payout
    function verifyRoundCompletion(
        ebool[] calldata paymentStatuses
    ) external returns (ebool) {
        ebool allPaid = FHE.asEbool(true);
        for (uint i = 0; i < paymentStatuses.length; i++) {
            allPaid = FHE.and(allPaid, paymentStatuses[i]);
        }
        return allPaid;
    }
    
    // Calculate recipient's encrypted entitlement (total pot / 1 in ROSCA)
    function calculatePayout(
        euint64 totalVaultBalance,
        uint256 memberCount
    ) external pure returns (euint64) {
        // In standard ROSCA, recipient gets full pot
        // Encrypted division: total / 1 (since one person gets all)
        return totalVaultBalance;
    }
}