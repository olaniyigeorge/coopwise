// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@fhevm/solidity/lib/FHE.sol";
import "./interfaces/ICoopGroup.sol";
import "./interfaces/IFlowVault.sol";
import "./RotationLogic.sol";
import "./PrivacyUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoopGroup is ICoopGroup, ReentrancyGuard, Ownable {
    using PrivacyUtils for *;
    
    // Group configuration
    string public name;
    uint256 public cycleDuration;
    uint256 public createdAt;
    uint256 public currentRound;
    uint256 public maxMembers;
    bool public isActive;
    
    // Encrypted core data
    euint64 public contributionAmount;     // Fixed amount each member pays
    euint64 public totalContributed;       // Running total (encrypted)
    
    // Rotation & membership
    address[] public members;
    address[] public rotationOrder;
    uint256 public rotationIndex;
    mapping(address => Member) public memberData;
    
    // Contracts
    IFlowVault public vault;
    RotationLogic public rotationLogic;
    
    // Round tracking (encrypted booleans)
    mapping(uint256 => mapping(address => ebool)) private roundPayments;
    mapping(uint256 => ebool) private roundCompleted;
    
    // Events
    event MemberJoined(address indexed member, uint256 timestamp);
    event ContributionReceived(address indexed member, bytes encryptedAmount, uint256 round);
    event PayoutExecuted(address indexed recipient, uint256 round, bytes encryptedAmount);
    event RoundAdvanced(uint256 newRound);
    
    modifier onlyMember() {
        require(memberData[msg.sender].isActive, "Not a member");
        _;
    }
    
    modifier groupActive() {
        require(isActive, "Group not active");
        _;
    }
    
    constructor(
        string memory _name,
        uint64 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers,
        address _vault,
        address _rotationLogic,
        address _owner
    ) Ownable(_owner) {
        name = _name;
        contributionAmount = FHE.asEuint64(_contributionAmount);
        cycleDuration = _cycleDuration;
        maxMembers = _maxMembers;
        createdAt = block.timestamp;
        currentRound = 1;
        isActive = true;
        
        vault = IFlowVault(_vault);
        rotationLogic = RotationLogic(_rotationLogic);
    }
    
    // Join group before it starts
    function joinGroup() external groupActive {
        require(members.length < maxMembers, "Group full");
        require(!memberData[msg.sender].isActive, "Already member");
        require(block.timestamp < createdAt + 1 days, "Registration closed"); // 1 day to join
        
        memberData[msg.sender] = Member({
            wallet: msg.sender,
            totalContributed: FHE.asEuint64(0),
            hasPaidCurrentRound: FHE.asEbool(false),
            joinTime: block.timestamp,
            lastPayoutRound: 0,
            isActive: true
        });
        
        members.push(msg.sender);
        emit MemberJoined(msg.sender, block.timestamp);
    }
    
    // Initialize rotation once group is full or time expires
    function initializeRotation() external onlyOwner groupActive {
        require(rotationOrder.length == 0, "Already initialized");
        require(members.length >= 2, "Need 2+ members");
        
        uint256 seed = uint256(keccak256(abi.encode(block.timestamp, block.number, address(this))));
        rotationOrder = rotationLogic.initializeRotation(members, seed);
        rotationIndex = 0;
        
        isActive = true;
    }
    
    // Member contributes Flow (encrypted amount proves they know amount without revealing)
    function contribute(bytes calldata encryptedAmount) external payable onlyMember groupActive nonReentrant {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        
        // Verify amount matches required contribution (encrypted comparison)
        ebool isCorrectAmount = PrivacyUtils.verifyExactAmount(amount, contributionAmount);
        require(FHE.decrypt(isCorrectAmount), "Incorrect contribution amount");
        
        // Check not already paid this round
        ebool alreadyPaid = roundPayments[currentRound][msg.sender];
        require(!FHE.decrypt(alreadyPaid), "Already paid this round");
        
        // Record payment (encrypted)
        roundPayments[currentRound][msg.sender] = FHE.asEbool(true);
        memberData[msg.sender].hasPaidCurrentRound = FHE.asEbool(true);
        memberData[msg.sender].totalContributed = FHE.add(
            memberData[msg.sender].totalContributed, 
            amount
        );
        totalContributed = FHE.add(totalContributed, amount);
        
        // Transfer Flow to vault (actual amount is public for gas, encrypted for logic)
        uint256 publicAmount = FHE.decrypt(amount); // Only decrypt for transfer
        vault.deposit{value: publicAmount}(msg.sender, publicAmount, amount);
        
        emit ContributionReceived(msg.sender, encryptedAmount, currentRound);
        
        // Auto-trigger payout if all paid
        tryAutoPayout();
    }
    
    // Internal: check if all paid and execute payout
    function tryAutoPayout() internal {
        // Collect all payment statuses
        ebool[] memory statuses = new ebool[](members.length);
        for (uint i = 0; i < members.length; i++) {
            statuses[i] = roundPayments[currentRound][members[i]];
        }
        
        ebool allPaid = rotationLogic.verifyRoundCompletion(statuses);
        
        // Only proceed if decrypted condition met
        if (FHE.decrypt(allPaid)) {
            executePayout();
        }
    }
    
    // Execute payout to next in rotation
    function executePayout() public groupActive nonReentrant {
        // Verify all paid (redundant check for external calls)
        ebool[] memory statuses = new ebool[](members.length);
        for (uint i = 0; i < members.length; i++) {
            statuses[i] = roundPayments[currentRound][members[i]];
        }
        require(FHE.decrypt(rotationLogic.verifyRoundCompletion(statuses)), "Not all paid");
        
        address recipient = rotationOrder[rotationIndex];
        require(memberData[recipient].isActive, "Recipient not active");
        
        // Calculate payout (full pot)
        euint64 payoutAmount = rotationLogic.calculatePayout(
            vault.getEncryptedBalance(address(this)), 
            members.length
        );
        
        // Update state
        memberData[recipient].lastPayoutRound = currentRound;
        rotationIndex++;
        
        // Reset round
        for (uint i = 0; i < members.length; i++) {
            roundPayments[currentRound][members[i]] = FHE.asEbool(false);
            memberData[members[i]].hasPaidCurrentRound = FHE.asEbool(false);
        }
        
        roundCompleted[currentRound] = FHE.asEbool(true);
        currentRound++;
        
        // Execute transfer from vault
        uint256 publicPayout = FHE.decrypt(payoutAmount);
        vault.withdraw(recipient, publicPayout, payoutAmount);
        
        emit PayoutExecuted(recipient, currentRound - 1, FHE.serialize(payoutAmount));
        emit RoundAdvanced(currentRound);
        
        // Close group if rotation complete
        if (rotationIndex >= members.length) {
            isActive = false;
        }
    }
    
    // View functions
    function getNextPayoutRecipient() external view returns (address) {
        return rotationLogic.peekNextRecipient(rotationOrder, rotationIndex);
    }
    
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }
    
    function getEncryptedContributionAmount() external view returns (bytes memory) {
        return FHE.serialize(contributionAmount);
    }
    
    function getMyEncryptedBalance() external view onlyMember returns (bytes memory) {
        return FHE.serialize(memberData[msg.sender].totalContributed);
    }

    function getEncryptedBalance() external view returns (bytes memory) {
        return FHE.serialize(vault.getEncryptedBalance(address(this)));
    }
    
    // Emergency: allow owner to return funds if group fails
    function emergencyRefund() external onlyOwner {
        require(!isActive || block.timestamp > createdAt + 365 days, "Too early");
        // Implementation: distribute vault pro-rata
    }
}