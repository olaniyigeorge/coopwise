from typing import Dict, Any, Optional, List
import json
from uuid import UUID
from decimal import Decimal
from enum import Enum
from app.utils.logger import logger
from config import AppConfig as config
import os


class NetworkType(Enum):
    """Supported blockchain networks"""
    FLOW = "flow"
    ZAMA = "zama"
    
    
class ContributionStatusOnChain(Enum):
    """Contribution status as tracked on chain"""
    INITIATED = 0
    PENDING = 1
    CONFIRMED = 2
    COMPLETED = 3
    FAILED = 4
    REFUNDED = 5


class ContractService:
    """
    Service for interacting with the CoopWise smart contracts on Flow & Zama.
    
    Handles:
    - Group creation and management (via CoopGroupFactory)
    - Member management (joining groups)
    - Contribution submissions with encrypted amounts
    - Payout execution with rotation logic
    - Balance queries for groups and individuals
    - Emergency refunds
    
    Security: All amount-related operations use encrypted amounts (euint64) via Zama FHE
    where applicable, with optional public amounts for non-sensitive operations.
    """

    def __init__(self):
        # Initialize connections
        self.flow_client = self._init_flow_client()
        self.zama_client = self._init_zama_client()
        
        # Contract addresses from environment
        self.rotation_logic_addr = os.getenv(
            "ROTATION_LOGIC", 
            "0x03597D130387702B29B21155fAA80C3A7d40FC3d"
        )
        self.factory_contract_addr = os.getenv(
            "COOP_GROUP_FACTORY_CONTRACT",
            "0x2dCe6F795565CeC6FeF0C29DdF4D0787b1d929eB"
        )
        
        # Default network
        self.default_network = NetworkType(os.getenv("DEFAULT_NETWORK", "flow").lower())

    def _init_flow_client(self):
        """Initialize Flow blockchain client"""
        # Will integrate with Flow SDK (flow-py or cadence-based)
        return None

    def _init_zama_client(self):
        """Initialize Zama confidential computing client"""
        # Will integrate with Zama fhEVM SDK for encrypted operations
        return None

    # ====================
    # GROUP MANAGEMENT
    # ====================
    
    async def create_group(
        self,
        name: str,
        contribution_amount: int,  # in smallest unit (e.g., cents)
        cycle_duration: int,  # in seconds
        max_members: int,
        creator_address: str,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new cooperative group via the factory contract.
        
        Args:
            name: Group name
            contribution_amount: Amount members must contribute per cycle (uint64)
            cycle_duration: Duration of each cycle in seconds (uint256)
            max_members: Maximum group size (uint256)
            creator_address: Address of group creator (member of verification)
            network: Network to deploy on (flow/zama)
            
        Returns:
            Dictionary with group_address, vault_address, tx_hash
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "name": name,
                "contributionAmount": contribution_amount,
                "cycleDuration": cycle_duration,
                "maxMembers": max_members,
                "creatorAddress": creator_address
            }
            
            if network == "flow":
                result = await self._call_flow_contract("createGroup", call_data)
                group_addr = result.get("groupAddress")
                vault_addr = result.get("vaultAddress")
            elif network == "zama":
                result = await self._call_zama_contract("createGroup", call_data)
                group_addr = result.get("groupAddress")
                vault_addr = result.get("vaultAddress")
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            logger.info(
                f"Group created: {name} at {group_addr}, vault: {vault_addr}, tx: {result.get('tx_hash')}"
            )
            
            return {
                "success": True,
                "group_address": group_addr,
                "vault_address": vault_addr,
                "tx_hash": result.get("tx_hash"),
                "network": network
            }
        except Exception as e:
            logger.error(f"Failed to create group: {e}")
            return {
                "success": False,
                "error": str(e),
                "network": network
            }

    async def get_group_info(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch comprehensive group information from contract.
        Returns: name, cycleDuration, createdAt, currentRound, maxMembers, isActive, memberCount
        """
        network = network or self.default_network.value
        try:
            if network == "flow":
                result = await self._query_flow_contract("getGroupInfo", group_address)
            elif network == "zama":
                result = await self._query_zama_contract("getGroupInfo", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            if result:
                return {
                    "name": result.get("name"),
                    "cycle_duration": result.get("cycleDuration"),
                    "created_at": result.get("createdAt"),
                    "current_round": result.get("currentRound"),
                    "max_members": result.get("maxMembers"),
                    "is_active": result.get("isActive"),
                    "member_count": result.get("memberCount"),
                    "network": network
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get group info: {e}")
            return None

    # ====================
    # MEMBER MANAGEMENT
    # ====================
    
    async def join_group(
        self,
        group_address: str,
        user_address: str,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Allow a user to join a cooperative group.
        Emits MemberJoined event on success.
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "userAddress": user_address
            }
            
            if network == "flow":
                result = await self._call_flow_contract("joinGroup", call_data)
            elif network == "zama":
                result = await self._call_zama_contract("joinGroup", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            logger.info(f"User {user_address} joined group {group_address}")
            
            return {
                "success": True,
                "tx_hash": result.get("tx_hash"),
                "group_address": group_address,
                "user_address": user_address,
                "network": network
            }
        except Exception as e:
            logger.error(f"Failed to join group: {e}")
            return {
                "success": False,
                "error": str(e),
                "group_address": group_address,
                "user_address": user_address
            }

    async def get_member_info(
        self,
        group_address: str,
        member_address: str,
        network: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get member information: wallet, joinTime, lastPayoutRound, isActive
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "memberAddress": member_address
            }
            
            if network == "flow":
                result = await self._query_flow_contract("getMemberInfo", call_data)
            elif network == "zama":
                result = await self._query_zama_contract("getMemberInfo", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            if result:
                return {
                    "wallet": result.get("wallet"),
                    "join_time": result.get("joinTime"),
                    "last_payout_round": result.get("lastPayoutRound"),
                    "is_active": result.get("isActive"),
                    "network": network
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get member info for {member_address}: {e}")
            return None

    async def get_member_count(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[int]:
        """Get total active members in a group"""
        network = network or self.default_network.value
        try:
            if network == "flow":
                result = await self._query_flow_contract("getMemberCount", group_address)
            elif network == "zama":
                result = await self._query_zama_contract("getMemberCount", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result if result else None
        except Exception as e:
            logger.error(f"Failed to get member count: {e}")
            return None

    async def is_member(
        self,
        group_address: str,
        user_address: str,
        network: Optional[str] = None
    ) -> Optional[bool]:
        """Check if user is a member of the group"""
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "userAddress": user_address
            }
            
            if network == "flow":
                result = await self._query_flow_contract("isMember", call_data)
            elif network == "zama":
                result = await self._query_zama_contract("isMember", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to check membership: {e}")
            return None

    # ====================
    # CONTRIBUTION MANAGEMENT
    # ====================
    
    async def submit_contribution(
        self,
        group_address: str,
        user_address: str,
        amount: Decimal,
        encrypted_amount: Optional[str] = None,
        proof: Optional[str] = None,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submit a contribution for the current round.
        
        Uses encrypted amounts (euint64) for privacy when available,
        with optional public amount for non-sensitive operations.
        
        Args:
            group_address: Target group contract address
            user_address: Contributing member's address
            amount: Contribution amount (Decimal)
            encrypted_amount: FHE encrypted amount (optional, for Zama)
            proof: ZK proof of contribution (optional)
            network: Chain to submit to
            
        Returns:
            TX hash and status
        """
        network = network or self.default_network.value
        try:
            # Convert amount to blockchain units (6 decimals assumed)
            amount_wei = int(amount * 10**6)
            
            call_data = {
                "groupAddress": group_address,
                "userAddress": user_address,
                "amount": amount_wei,
                "encryptedAmount": encrypted_amount or "",
                "proof": proof or ""
            }
            
            if network == "flow":
                result = await self._call_flow_contract("contribute", call_data)
            elif network == "zama":
                result = await self._call_zama_contract("contribute", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            logger.info(
                f"Contribution submitted: {user_address} -> {group_address}, "
                f"amount: {amount}, tx: {result.get('tx_hash')}"
            )
            
            return {
                "success": True,
                "tx_hash": result.get("tx_hash"),
                "group_address": group_address,
                "user_address": user_address,
                "amount": str(amount),
                "network": network
            }
        except Exception as e:
            logger.error(f"Failed to submit contribution: {e}")
            return {
                "success": False,
                "error": str(e),
                "group_address": group_address,
                "user_address": user_address
            }

    async def has_paid_current_round(
        self,
        group_address: str,
        member_address: str,
        network: Optional[str] = None
    ) -> Optional[bool]:
        """Check if member has already contributed for current round"""
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "memberAddress": member_address
            }
            
            if network == "flow":
                result = await self._query_flow_contract("hasPaidCurrentRound", call_data)
            elif network == "zama":
                result = await self._query_zama_contract("hasPaidCurrentRound", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to check if paid current round: {e}")
            return None

    # ====================
    # PAYOUT MANAGEMENT
    # ====================
    
    async def get_next_payout_recipient(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[str]:
        """Get the next member scheduled to receive payout (rotation logic)"""
        network = network or self.default_network.value
        try:
            if network == "flow":
                result = await self._query_flow_contract("getNextPayoutRecipient", group_address)
            elif network == "zama":
                result = await self._query_zama_contract("getNextPayoutRecipient", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to get next payout recipient: {e}")
            return None

    async def execute_payout(
        self,
        group_address: str,
        public_payout_amount: Optional[int] = None,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a payout to the next member in rotation.
        
        Args:
            group_address: Target group
            public_payout_amount: Optional public amount if known
            network: Chain to execute on
            
        Returns:
            TX hash and payout details
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "publicPayoutAmount": public_payout_amount or 0
            }

            if network == "flow":
                result = await self._call_flow_contract("executePayout", call_data)
            elif network == "zama":
                result = await self._call_zama_contract("executePayout", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")

            logger.info(f"Payout executed for group: {group_address}, tx: {result.get('tx_hash')}")

            return {
                "success": True,
                "tx_hash": result.get("tx_hash"),
                "group_address": group_address,
                "payout_recipient": result.get("payoutRecipient"),
                "round_number": result.get("roundNumber"),
                "network": network
            }

        except Exception as e:
            logger.error(f"Failed to execute payout: {e}")
            return {
                "success": False,
                "error": str(e),
                "group_address": group_address
            }

    # ====================
    # BALANCE & VAULT QUERIES
    # ====================
    
    async def get_group_balance(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[Decimal]:
        """Get total vault balance for a group"""
        network = network or self.default_network.value
        try:
            if network == "flow":
                balance_wei = await self._query_flow_contract("getGroupBalance", group_address)
            elif network == "zama":
                balance_wei = await self._query_zama_contract("getGroupBalance", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")

            if balance_wei is not None:
                return Decimal(balance_wei) / 10**6  # Convert from wei
            return None

        except Exception as e:
            logger.error(f"Failed to get group balance: {e}")
            return None

    async def get_encrypted_balance(
        self,
        group_address: str,
        user_address: str,
        network: Optional[str] = None
    ) -> Optional[str]:
        """
        Get encrypted balance for a user in a group (privacy-preserving).
        Returns encrypted bytes that can only be decrypted with user's private key.
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "userAddress": user_address
            }
            
            if network == "flow":
                result = await self._query_flow_contract("getEncryptedBalance", call_data)
            elif network == "zama":
                result = await self._query_zama_contract("getEncryptedBalance", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result  # Encrypted bytes32
        except Exception as e:
            logger.error(f"Failed to get encrypted balance: {e}")
            return None

    async def get_contribution_amount(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[int]:
        """Get the required contribution amount for the group (in smallest units)"""
        network = network or self.default_network.value
        try:
            if network == "flow":
                result = await self._query_flow_contract("getContributionAmount", group_address)
            elif network == "zama":
                result = await self._query_zama_contract("getContributionAmount", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to get contribution amount: {e}")
            return None

    # ====================
    # ROUND/CYCLE MANAGEMENT
    # ====================
    
    async def get_current_round(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Optional[int]:
        """Get current round/cycle number"""
        network = network or self.default_network.value
        try:
            if network == "flow":
                result = await self._query_flow_contract("getCurrentRound", group_address)
            elif network == "zama":
                result = await self._query_zama_contract("getCurrentRound", group_address)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            return result
        except Exception as e:
            logger.error(f"Failed to get current round: {e}")
            return None

    async def initialize_rotation(
        self,
        group_address: str,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initialize rotation order for payouts.
        Should be called once when group is first created or round starts.
        """
        network = network or self.default_network.value
        try:
            call_data = {"groupAddress": group_address}
            
            if network == "flow":
                result = await self._call_flow_contract("initializeRotation", call_data)
            elif network == "zama":
                result = await self._call_zama_contract("initializeRotation", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            logger.info(f"Rotation initialized for group: {group_address}")
            
            return {
                "success": True,
                "tx_hash": result.get("tx_hash"),
                "group_address": group_address,
                "rotation_order": result.get("rotationOrder", []),
                "network": network
            }
        except Exception as e:
            logger.error(f"Failed to initialize rotation: {e}")
            return {
                "success": False,
                "error": str(e),
                "group_address": group_address
            }

    # ====================
    # EMERGENCY & SAFETY
    # ====================
    
    async def emergency_refund(
        self,
        group_address: str,
        user_address: str,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Emergency refund for a user from the vault.
        Should only be callable in case of emergency or group dissolution.
        Emits security event for audit.
        """
        network = network or self.default_network.value
        try:
            call_data = {
                "groupAddress": group_address,
                "userAddress": user_address
            }
            
            if network == "flow":
                result = await self._call_flow_contract("emergencyRefund", call_data)
            elif network == "zama":
                result = await self._call_zama_contract("emergencyRefund", call_data)
            else:
                raise ValueError(f"Unsupported network: {network}")
            
            logger.warning(
                f"EMERGENCY REFUND triggered: {user_address} in group {group_address}"
            )
            
            return {
                "success": True,
                "tx_hash": result.get("tx_hash"),
                "group_address": group_address,
                "user_address": user_address,
                "refund_amount": result.get("refundAmount"),
                "network": network
            }
        except Exception as e:
            logger.error(f"Failed to execute emergency refund: {e}")
            return {
                "success": False,
                "error": str(e),
                "group_address": group_address,
                "user_address": user_address
            }

    # ====================
    # BLOCKCHAIN INTEGRATION LAYER
    # ====================
    # These methods abstract the actual SDK calls for Flow and Zama.
    # Replace implementations with actual SDK calls when integrating.

    async def _call_flow_contract(
        self,
        method: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a transaction on Flow blockchain.
        
        TODO: Integrate with Flow SDK
        - Use flow-sdk (flow-py or JS adapter)
        - Build transaction with contract method and arguments
        - Sign with backend signer account
        - Submit to Flow testnet/mainnet
        - Return tx_hash and wait for confirmation
        """
        logger.warning(
            f"Flow contract call NOT implemented - mock response: {method} with {list(data.keys())}"
        )
        
        # Mock response for development
        return {
            "success": True,
            "tx_hash": f"flow_tx_{method}_{data.get('userAddress', 'unknown')[:6]}",
            "groupAddress": data.get("groupAddress"),
            "vaultAddress": data.get("vaultAddress") or "0xvault0000000000",
            "userAddress": data.get("userAddress"),
            "payoutRecipient": data.get("userAddress"),
            "roundNumber": 1,
            "rotationOrder": [],
            "refundAmount": data.get("amount", 0)
        }

    async def _query_flow_contract(
        self,
        method: str,
        param: Any
    ) -> Any:
        """
        Query a read-only method on Flow contract.
        
        TODO: Integrate with Flow SDK
        - Build script call with contract method
        - Execute query against Flow network
        - Parse returned data based on method
        - Handle encrypted data if needed
        """
        logger.warning(
            f"Flow contract query NOT implemented - mock response: {method}"
        )
        
        # Mock responses by method
        mock_responses = {
            "getGroupInfo": {
                "name": "Test Group",
                "cycleDuration": 86400,
                "createdAt": 1640995200,
                "currentRound": 1,
                "maxMembers": 10,
                "isActive": True,
                "memberCount": 3
            },
            "getMemberInfo": {
                "wallet": param.get("userAddress") if isinstance(param, dict) else param,
                "joinTime": 1640995200,
                "lastPayoutRound": 0,
                "isActive": True
            },
            "getMemberCount": 3,
            "isMember": True,
            "hasPaidCurrentRound": False,
            "getNextPayoutRecipient": "0xnext_recipient_address",
            "getCurrentRound": 1,
            "getGroupBalance": 3000000,  # 3.0 in smallest units
            "getEncryptedBalance": "0xencrypted_balance_bytes",
            "getContributionAmount": 1000000  # 1.0 in smallest units
        }
        
        return mock_responses.get(method, None)

    async def _call_zama_contract(
        self,
        method: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a confidential transaction via Zama fhEVM.
        
        TODO: Integrate with Zama SDK
        - Use fhEVM SDK/library for encrypted execution
        - Build encrypted transaction payload
        - Submit to Zama network with encrypted inputs
        - Return tx_hash with confidentiality guarantees
        """
        logger.warning(
            f"Zama contract call NOT implemented - mock response: {method}"
        )
        
        # Mock response for development
        return {
            "success": True,
            "tx_hash": f"zama_tx_{method}_{data.get('userAddress', 'unknown')[:6]}",
            "groupAddress": data.get("groupAddress"),
            "vaultAddress": data.get("vaultAddress") or "0xvault_zama_0000",
            "userAddress": data.get("userAddress"),
            "payoutRecipient": data.get("userAddress"),
            "roundNumber": 1,
            "rotationOrder": [],
            "refundAmount": data.get("amount", 0)
        }

    async def _query_zama_contract(
        self,
        method: str,
        param: Any
    ) -> Any:
        """
        Query encrypted data from Zama contract (confidential queries).
        
        TODO: Integrate with Zama SDK
        - Build encrypted query with FHE parameters
        - Query contract with privacy preserving methods
        - Decrypt/process response if needed
        - Return encrypted data for client-side decryption
        """
        logger.warning(
            f"Zama contract query NOT implemented - mock response: {method}"
        )
        
        # Return encrypted responses for Zama (client handles decryption)
        mock_responses = {
            "getGroupInfo": {
                "name": "Test Group",
                "cycleDuration": 86400,
                "createdAt": 1640995200,
                "currentRound": 1,
                "maxMembers": 10,
                "isActive": True,
                "memberCount": 3
            },
            "getMemberInfo": {
                "wallet": param.get("userAddress") if isinstance(param, dict) else param,
                "joinTime": 1640995200,
                "lastPayoutRound": 0,
                "isActive": True
            },
            "getMemberCount": 3,
            "isMember": True,
            "hasPaidCurrentRound": False,
            "getNextPayoutRecipient": "0xencrypted_recipient",
            "getCurrentRound": 1,
            "getGroupBalance": "0xencrypted_balance",  # Encrypted
            "getEncryptedBalance": "0xencrypted_user_balance",  # Already encrypted
            "getContributionAmount": "0xencrypted_contribution"  # Encrypted
        }
        
        return mock_responses.get(method, None)


# Global singleton instance
contract_service = ContractService()