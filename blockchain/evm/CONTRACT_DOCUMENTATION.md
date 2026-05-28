# Coopwise Smart Contracts Documentation

## Overview

The Coopwise protocol is a privacy-preserving Rotating Savings and Credit Association (ROSCA) built on Ethereum using fully homomorphic encryption (FHE) through the Zama fhEVM. The system allows groups of members to contribute fixed amounts periodically and receive lump sum payouts in a rotating order, while keeping all financial amounts encrypted on-chain. The protocol now uses Flow native currency instead of USDT tokens.

## Architecture

The protocol consists of 5 main contracts:

1. **CoopGroupFactory** - Factory contract for creating new cooperative groups
2. **CoopGroup** - Main group contract managing members, contributions, and payouts
3. **FlowVault** - Secure vault for holding Flow tokens with encrypted accounting
4. **RotationLogic** - Handles rotation order and payout calculations
5. **PrivacyUtils** - Library for encrypted operations and privacy-preserving functions

---

## 1. CoopGroupFactory

### Purpose
Factory contract responsible for deploying new CoopGroup instances and their associated FlowVault contracts.

### State Variables

- `address public rotationLogic` - RotationLogic contract address
- `address public owner` - Factory owner address
- `address[] public allGroups` - Array of all created group addresses
- `mapping(address => address[]) public userGroups` - Maps users to their created groups

### Events

```solidity
event GroupCreated(
    address indexed groupAddress, 
    address indexed vaultAddress,
    string name, 
    address creator,
    uint256 timestamp
);
```

### Functions

#### `constructor(address _rotationLogic)`
- **Purpose**: Initialize factory with RotationLogic address
- **Parameters**:
  - `_rotationLogic`: RotationLogic contract address
- **Visibility**: Public
- **Modifiers**: None

#### `createGroup(string calldata name, uint64 contributionAmount, uint256 cycleDuration, uint256 maxMembers)`
- **Purpose**: Deploy a new CoopGroup and FlowVault
- **Parameters**:
  - `name`: Human-readable group name
  - `contributionAmount`: Fixed Flow contribution per cycle
  - `cycleDuration`: Seconds between payout rounds (1-90 days)
  - `maxMembers`: Maximum number of members (2-50)
- **Returns**: `(address groupAddress, address vaultAddress)`
- **Visibility**: External
- **Requirements**:
  - `maxMembers` must be between 2 and 50
  - `cycleDuration` must be between 1 day and 90 days
  - `contributionAmount` must be greater than 0
- **Side Effects**:
  - Deploys new FlowVault contract
  - Deploys new CoopGroup contract
  - Adds group to tracking arrays
  - Emits GroupCreated event

#### `getGroupsByUser(address user)`
- **Purpose**: Get all groups created by a specific user
- **Parameters**: `user` - User address to query
- **Returns**: `address[] memory` - Array of group addresses
- **Visibility**: External view

#### `getAllGroups()`
- **Purpose**: Get all groups created through the factory
- **Returns**: `address[] memory` - Array of all group addresses
- **Visibility**: External view

---

## 2. CoopGroup

### Purpose
Main contract managing cooperative group operations including member management, contribution collection, and payout execution with privacy-preserving encryption.

### State Variables

#### Group Configuration
- `string public name` - Group name
- `uint256 public cycleDuration` - Duration of each cycle in seconds
- `uint256 public createdAt` - Contract deployment timestamp
- `uint256 public currentRound` - Current payout round number
- `uint256 public maxMembers` - Maximum allowed members
- `bool public isActive` - Whether group is currently active

#### Encrypted Core Data
- `euint64 public contributionAmount` - Fixed contribution amount (encrypted)
- `euint64 public totalContributed` - Total contributions received (encrypted)

#### Rotation & Membership
- `address[] public members` - Array of member addresses
- `address[] public rotationOrder` - Payout rotation order
- `uint256 public rotationIndex` - Current position in rotation
- `mapping(address => Member) public memberData` - Member information mapping

#### Contract References
- `IUSDTVault public vault` - USDT vault contract
- `RotationLogic public rotationLogic` - Rotation logic contract

#### Round Tracking (Encrypted)
- `mapping(uint256 => mapping(address => ebool)) private roundPayments` - Payment status per round/member
- `mapping(uint256 => ebool) private roundCompleted` - Round completion status

### Structs

#### Member
```solidity
struct Member {
    address wallet;                 // Member wallet address
    euint64 totalContributed;      // Total lifetime contributions (encrypted)
    ebool hasPaidCurrentRound;     // Current round payment status (encrypted)
    uint256 joinTime;              // When member joined
    uint256 lastPayoutRound;       // Last round member received payout
    bool isActive;                 // Whether member is active
}
```

### Events

```solidity
event MemberJoined(address indexed member, uint256 timestamp);
event ContributionReceived(address indexed member, bytes encryptedAmount, uint256 round);
event PayoutExecuted(address indexed recipient, uint256 round, bytes encryptedAmount);
event RoundAdvanced(uint256 newRound);
```

### Modifiers

#### `onlyMember`
- **Purpose**: Restrict function access to active members only
- **Check**: `memberData[msg.sender].isActive`

#### `groupActive`
- **Purpose**: Ensure group is currently active
- **Check**: `isActive`

### Functions

#### `constructor(string memory _name, uint64 _contributionAmount, uint256 _cycleDuration, uint256 _maxMembers, address _vault, address _rotationLogic, address _owner)`
- **Purpose**: Initialize new cooperative group
- **Parameters**:
  - `_name`: Group name
  - `_contributionAmount`: Fixed contribution amount
  - `_cycleDuration`: Cycle duration in seconds
  - `_maxMembers`: Maximum members allowed
  - `_vault`: USDTVault contract address
  - `_rotationLogic`: RotationLogic contract address
  - `_owner`: Group owner address
- **Visibility**: Public
- **Side Effects**:
  - Sets all configuration parameters
  - Initializes encrypted contribution amount
  - Sets group as active

#### `joinGroup()`
- **Purpose**: Allow new members to join the group
- **Visibility**: External
- **Modifiers**: `groupActive`
- **Requirements**:
  - Group not full (`members.length < maxMembers`)
  - Caller not already a member
  - Registration period not closed (`block.timestamp < createdAt + 1 days`)
- **Side Effects**:
  - Creates new Member struct with encrypted values
  - Adds member to members array
  - Emits MemberJoined event

#### `initializeRotation()`
- **Purpose**: Initialize payout rotation order after group formation
- **Visibility**: External
- **Modifiers**: `onlyOwner`, `groupActive`
- **Requirements**:
  - Rotation not already initialized
  - At least 2 members in group
- **Side Effects**:
  - Generates deterministic random rotation order
  - Sets rotation index to 0
  - Uses block timestamp, number, and contract address as seed

#### `contribute(bytes calldata encryptedAmount)`
- **Purpose**: Member contributes their USDT payment for current round
- **Visibility**: External
- **Modifiers**: `onlyMember`, `groupActive`, `nonReentrant`
- **Parameters**: `encryptedAmount` - Encrypted contribution amount
- **Requirements**:
  - Encrypted amount matches expected contribution
  - Member hasn't already paid current round
- **Side Effects**:
  - Updates encrypted payment status
  - Updates member's total contributions
  - Transfers USDT to vault
  - Triggers auto-payout check
  - Emits ContributionReceived event

#### `tryAutoPayout()` (Internal)
- **Purpose**: Check if all members have paid and trigger payout if complete
- **Visibility**: Internal
- **Logic**:
  - Collects all payment statuses
  - Verifies all members paid using RotationLogic
  - Calls executePayout() if conditions met

#### `executePayout()`
- **Purpose**: Execute payout to next member in rotation
- **Visibility**: Public
- **Modifiers**: `groupActive`, `nonReentrant`
- **Requirements**:
  - All members have paid current round
  - Recipient is active member
- **Side Effects**:
  - Calculates payout amount (full pot)
  - Updates recipient's last payout round
  - Advances rotation index
  - Resets round payment statuses
  - Transfers USDT from vault to recipient
  - Advances to next round
  - Deactivates group if rotation complete
  - Emits PayoutExecuted and RoundAdvanced events

#### `getNextPayoutRecipient()`
- **Purpose**: Get address of next payout recipient
- **Returns**: `address` - Next recipient address
- **Visibility**: External view

#### `getMemberCount()`
- **Purpose**: Get current number of members
- **Returns**: `uint256` - Member count
- **Visibility**: External view

#### `getEncryptedContributionAmount()`
- **Purpose**: Get serialized encrypted contribution amount
- **Returns**: `bytes memory` - Serialized encrypted amount
- **Visibility**: External view

#### `getMyEncryptedBalance()`
- **Purpose**: Get caller's encrypted total contribution balance
- **Returns**: `bytes memory` - Serialized encrypted balance
- **Visibility**: External view
- **Modifiers**: `onlyMember`

#### `emergencyRefund()`
- **Purpose**: Emergency refund function for failed groups
- **Visibility**: External
- **Modifiers**: `onlyOwner`
- **Requirements**:
  - Group inactive or 365+ days old
- **Note**: Implementation placeholder for pro-rata distribution

---

## 3. FlowVault

### Purpose
Secure vault contract for holding Flow native currency with encrypted accounting to maintain privacy of member balances while enabling transparent token transfers.

### State Variables

- `address public coopGroup` - CoopGroup contract address
- `euint64 private totalLocked` - Total Flow locked (encrypted)
- `mapping(address => euint64) private userBalances` - Individual encrypted balances
- `mapping(address => uint256) public depositCount` - Public deposit count per user
- `uint256 public totalDeposits` - Total number of deposits

### Modifiers

#### `onlyGroup`
- **Purpose**: Restrict access to CoopGroup contract only
- **Check**: `msg.sender == coopGroup`

### Functions

#### `constructor()`
- **Purpose**: Initialize vault for native Flow currency
- **Visibility**: Public
- **Note**: No token address needed for native currency

#### `setCoopGroup(address _coopGroup)`
- **Purpose**: Allow factory to set the associated CoopGroup address
- **Parameters**: `_coopGroup` - CoopGroup contract address
- **Visibility**: External
- **Requirements**: CoopGroup not previously set

#### `deposit(address from, uint256 amount, euint64 encryptedAmount)`
- **Purpose**: Handle member deposits from CoopGroup
- **Visibility**: External
- **Modifiers**: `onlyGroup`, `nonReentrant`, `payable`
- **Parameters**:
  - `from` - Member address depositing
  - `amount` - Public amount for validation
  - `encryptedAmount` - Encrypted amount for accounting
- **Requirements**: `msg.value == amount`
- **Side Effects**:
  - Receives Flow tokens via `payable`
  - Updates encrypted total and user balances
  - Increments deposit counters

#### `withdraw(address to, uint256 amount, euint64 encryptedAmount)`
- **Purpose**: Handle withdrawals for payouts
- **Visibility**: External
- **Modifiers**: `onlyGroup`, `nonReentrant`
- **Parameters**:
  - `to` - Recipient address
  - `amount` - Public amount for transfer
  - `encryptedAmount` - Encrypted amount for accounting
- **Side Effects**:
  - Updates encrypted balances using homomorphic subtraction
  - Transfers Flow to recipient using `call{value: amount}`

#### `getEncryptedBalance(address user)`
- **Purpose**: Get user's encrypted balance for owner decryption
- **Returns**: `euint64` - Encrypted balance
- **Visibility**: External view
- **Parameters**: `user` - Address to query

#### `emergencyWithdraw(address to)`
- **Purpose**: Emergency withdrawal of all vault funds
- **Visibility**: External
- **Modifiers**: `onlyGroup`
- **Parameters**: `to` - Recipient address
- **Side Effects**: Transfers entire vault balance to recipient using native currency transfer

---

## 4. RotationLogic

### Purpose
Utility contract handling rotation order generation, round completion verification, and payout calculations using encrypted operations.

### State Variables

#### RotationState Struct (Internal)
```solidity
struct RotationState {
    address[] members;           // Group members
    uint256 currentIndex;       // Current rotation position
    uint256 seed;              // Randomness seed
    uint256 roundNumber;       // Current round
    mapping(address => bool) hasReceivedPayout;  // Payout tracking
}
```

### Functions

#### `initializeRotation(address[] calldata members, uint256 seed)`
- **Purpose**: Generate deterministic random rotation order
- **Visibility**: External pure
- **Parameters**:
  - `members` - Array of member addresses
  - `seed` - Randomness seed
- **Returns**: `address[] memory` - Shuffled rotation order
- **Algorithm**: Fisher-Yates shuffle with keccak256 hashing
- **Requirements**: At least 2 members

#### `peekNextRecipient(address[] calldata rotationOrder, uint256 currentIndex)`
- **Purpose**: Get next payout recipient without modifying state
- **Visibility**: External pure
- **Parameters**:
  - `rotationOrder` - Current rotation order array
  - `currentIndex` - Current position index
- **Returns**: `address` - Next recipient address
- **Requirements**: Current index within bounds

#### `verifyRoundCompletion(ebool[] calldata paymentStatuses)`
- **Purpose**: Verify all members have paid using encrypted boolean operations
- **Visibility**: External pure
- **Parameters**: `paymentStatuses` - Array of encrypted payment statuses
- **Returns**: `ebool` - Encrypted result (true if all paid)
- **Logic**: Uses homomorphic AND operation on all payment statuses

#### `calculatePayout(euint64 totalVaultBalance, uint256 memberCount)`
- **Purpose**: Calculate payout amount for recipient
- **Visibility**: External pure
- **Parameters**:
  - `totalVaultBalance` - Total encrypted vault balance
  - `memberCount` - Number of members (not used in current implementation)
- **Returns**: `euint64` - Encrypted payout amount
- **Logic**: Returns full vault balance (standard ROSCA model)

---

## 5. PrivacyUtils

### Purpose
Library providing privacy-preserving utility functions for encrypted operations, amount verification, and proof generation.

### Functions

#### `encryptAmount(uint64 amount)`
- **Purpose**: Encrypt plaintext amount for contract storage
- **Visibility**: Internal pure
- **Parameters**: `amount` - Plaintext amount
- **Returns**: `euint64` - Encrypted amount

#### `verifyExactAmount(euint64 encryptedPayment, euint64 expectedAmount)`
- **Purpose**: Verify encrypted payment matches expected amount without revealing
- **Visibility**: Internal pure
- **Parameters**:
  - `encryptedPayment` - Encrypted payment amount
  - `expectedAmount` - Expected encrypted amount
- **Returns**: `ebool` - Encrypted boolean result

#### `verifyMinimumAmount(euint64 encryptedPayment, euint64 minimumAmount)`
- **Purpose**: Verify payment meets minimum threshold (for variable contributions)
- **Visibility**: Internal pure
- **Parameters**:
  - `encryptedPayment` - Encrypted payment amount
  - `minimumAmount` - Minimum encrypted amount
- **Returns**: `ebool` - Encrypted boolean result

#### `aggregate(euint64 total, euint64 addition)`
- **Purpose**: Homomorphic addition of encrypted amounts
- **Visibility**: Internal pure
- **Parameters**:
  - `total` - Current encrypted total
  - `addition` - Amount to add (encrypted)
- **Returns**: `euint64` - New encrypted total

#### `decryptForOwner(euint64 encryptedValue)`
- **Purpose**: Decrypt encrypted value for owner viewing
- **Visibility**: Internal view
- **Parameters**: `encryptedValue` - Encrypted value to decrypt
- **Returns**: `uint64` - Decrypted plaintext value
- **Note**: Requires Zama KMS access

#### `generateSolvencyProof(euint64[] calldata contributions, euint64 vaultBalance)`
- **Purpose**: Generate proof that sum of contributions equals vault balance
- **Visibility**: Internal pure
- **Parameters**:
  - `contributions` - Array of encrypted contributions
  - `vaultBalance` - Encrypted vault balance
- **Returns**: `ebool` - Encrypted proof result
- **Logic**: Sums all contributions and compares to vault balance

---

## 6. Interface Contracts

### IFlowVault
Interface defining FlowVault contract functions and events.

**Functions**:
- `setCoopGroup(address _coopGroup)` - Set associated CoopGroup
- `deposit(address from, uint256 amount, euint64 encryptedAmount)` - Make deposit
- `withdraw(address to, uint256 amount, euint64 encryptedAmount)` - Withdraw funds
- `getEncryptedBalance(address user)` - Get encrypted balance
- `emergencyWithdraw(address to)` - Emergency withdrawal

### ICoopGroup
Interface defining core CoopGroup functions and events.

**Structs**:
- `GroupConfig` - Group configuration parameters
- `Member` - Member information structure

**Events**:
- `MemberJoined` - Member joined group
- `ContributionReceived` - Contribution made
- `PayoutExecuted` - Payout completed
- `RoundCompleted` - Round finished

**Functions**:
- `contribute(bytes calldata encryptedAmount)` - Make contribution
- `executePayout()` - Execute payout
- `getEncryptedBalance()` - Get encrypted balance
- `getNextPayoutRecipient()` - Get next recipient

---

## Security Features

### Privacy Preservation
- All financial amounts stored as encrypted values using fhEVM
- Homomorphic operations allow calculations without decryption
- Only token transfers use public amounts for gas efficiency

### Access Control
- Role-based access through modifiers (`onlyMember`, `onlyOwner`, `onlyGroup`)
- Reentrancy protection on critical functions
- Factory pattern for controlled contract deployment

### Economic Security
- Fixed contribution amounts prevent manipulation
- Time-based registration windows
- Emergency refund mechanisms
- Round completion verification before payouts

### Randomness
- Deterministic rotation using block hash and timestamp
- Fisher-Yates shuffle for fair ordering
- Seed generation from multiple entropy sources

---

## Gas Optimization

### Encrypted Operations
- Minimal decryption (only for token transfers)
- Batch operations where possible
- Efficient homomorphic computations

### Storage Patterns
- Packed structs where applicable
- Event-based logging for historical data
- Lazy evaluation of complex operations

---

## Integration Notes

### Deployment Sequence
1. Deploy RotationLogic (singleton)
2. Deploy FlowVault for each group
3. Deploy CoopGroupFactory
4. Create groups through factory

### External Dependencies
- Zama fhEVM for encrypted operations
- Flow native currency for payments
- OpenZeppelin for standard utilities

### Upgrade Considerations
- Factory pattern allows proxy upgrades
- Immutable configuration after deployment
- Emergency functions for migration scenarios

---

## Error Codes Reference

| Error Message | Context | Resolution |
|---------------|---------|------------|
| "Not a member" | `onlyMember` modifier | User must join group first |
| "Group not active" | `groupActive` modifier | Group may be completed or paused |
| "Group full" | `joinGroup()` | Maximum member limit reached |
| "Already member" | `joinGroup()` | User already in group |
| "Registration closed" | `joinGroup()` | 24-hour registration window expired |
| "Already initialized" | `initializeRotation()` | Rotation already set up |
| "Need 2+ members" | Multiple functions | Minimum member requirement not met |
| "Incorrect contribution amount" | `contribute()` | Encrypted amount doesn't match expected |
| "Already paid this round" | `contribute()` | Member already contributed for current round |
| "Not all paid" | `executePayout()` | Some members haven't contributed |
| "Rotation complete" | `peekNextRecipient()` | All members have received payouts |
| "Members: 2-50" | `createGroup()` | Invalid member count |
| "Duration: 1-90 days" | `createGroup()` | Invalid cycle duration |
| "Amount must be > 0" | `createGroup()` | Invalid contribution amount |
| "Transfer failed" | Vault operations | Flow transfer rejected |

---

## Usage Examples

### Creating a New Group
```solidity
// Deploy factory first
CoopGroupFactory factory = new CoopGroupFactory(rotationLogicAddress);

// Create group
(address group, address vault) = factory.createGroup(
    "Savings Circle",
    1000000,  // 1 Flow (smallest unit)
    7 days,   // Weekly cycles
    10        // 10 members max
);
```

### Joining and Contributing
```solidity
// Join group
CoopGroup(group).joinGroup();

// Contribute (encrypted amount generated off-chain)
bytes encryptedAmount = encryptAmount(1000000);
CoopGroup(group).contribute{value: 1000000}(encryptedAmount);
```

### Checking Status
```solidity
// Get next recipient
address nextRecipient = CoopGroup(group).getNextPayoutRecipient();

// Get member count
uint256 memberCount = CoopGroup(group).getMemberCount();

// Get encrypted contribution amount
bytes encryptedContribution = CoopGroup(group).getEncryptedContributionAmount();
```

This documentation covers all functions, modifiers, events, and structural aspects of the Coopwise smart contract system.
