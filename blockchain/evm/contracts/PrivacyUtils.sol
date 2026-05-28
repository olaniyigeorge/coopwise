// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@fhevm/solidity/lib/FHE.sol";

library PrivacyUtils {
    // Encrypt a plaintext amount for contract storage
    function encryptAmount(uint64 amount) internal returns (euint64) {
        return FHE.asEuint64(amount);
    }
    
    // Verify encrypted payment matches expected amount without revealing
    function verifyExactAmount(
        euint64 encryptedPayment, 
        euint64 expectedAmount
    ) internal returns (ebool) {
        return FHE.eq(encryptedPayment, expectedAmount);
    }
    
    // Check if payment is >= minimum (for variable contributions, not used in fixed ROSCA)
    function verifyMinimumAmount(
        euint64 encryptedPayment, 
        euint64 minimumAmount
    ) internal returns (ebool) {
        return FHE.ge(encryptedPayment, minimumAmount);
    }
    
    // Aggregate encrypted amounts (homomorphic addition)
    function aggregate(
        euint64 total, 
        euint64 addition
    ) internal returns (euint64) {
        return FHE.add(total, addition);
    }
    
    // Generate public proof that sum of contributions equals vault balance
    // Without revealing individual amounts
    function generateSolvencyProof(
        euint64[] calldata contributions,
        euint64 vaultBalance
    ) internal returns (ebool) {
        euint64 sum = FHE.asEuint64(0);
        for (uint i = 0; i < contributions.length; i++) {
            sum = FHE.add(sum, contributions[i]);
        }
        return FHE.eq(sum, vaultBalance);
    }
}