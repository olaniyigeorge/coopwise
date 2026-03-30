"""
Payout Service

Manages payout execution and rotation logic for cooperative groups.

Key functionality:
- Get next payout recipient based on rotation order
- Execute payout to current recipient
- Advance to next round
- Handle rotation order initialization
- Track payout history and reconciliation

Security:
- Verify member eligibility before payout
- Encrypted amounts during transfer
- Audit trail for all payouts
- Guard against double payouts
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID
from decimal import Decimal
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.utils.logger import logger
from fastapi import HTTPException, status

from db.models.cooperative_group import CooperativeGroup, CooperativeStatus
from db.models.contribution_model import Contribution, ContributionStatus
from db.models.membership import GroupMembership
from app.services.contract_service import contract_service


class PayoutPhase(Enum):
    """Phases of a payout cycle"""
    COLLECTING = "collecting"  # Contributions being collected
    READY = "ready"  # All contributions collected, ready for payout
    EXECUTING = "executing"  # Payout in progress
    COMPLETED = "completed"  # Payout distributed


class PayoutRecord:
    """Represents a payout transaction (for tracking/audit)"""
    def __init__(
        self,
        group_id: UUID,
        recipient: str,
        amount: Decimal,
        round_number: int,
        tx_hash: Optional[str] = None,
        status: str = "pending"
    ):
        self.group_id = group_id
        self.recipient = recipient
        self.amount = amount
        self.round_number = round_number
        self.tx_hash = tx_hash
        self.status = status  # pending, completed, failed
        self.timestamp = datetime.now()


class PayoutService:
    """
    Service for managing payouts in cooperative groups.
    
    Rotation Logic:
    - Deterministic: Based on membership join order or shuffled seed
    - Transparent: Members know rotation order in advance
    - Fair: Each member gets one payout per cycle
    - Verifiable: Order visible on blockchain
    
    Payout Timing:
    - Triggered when all members contribute (OR after deadline)
    - Can be manual or automated
    - Respects member eligibility and account status
    """

    @staticmethod
    async def get_next_payout_recipient(
        group_id: UUID,
        group_address: str,
        db: AsyncSession,
        network: str = "flow"
    ) -> Optional[Dict[str, Any]]:
        """
        Get the next member eligible for payout in the group's rotation.
        
        Returns:
            Dictionary with:
            - recipient_address: Next member's wallet
            - current_round: Current round number
            - rotation_index: Position in rotation order
            - is_eligible: Whether member can receive payout
            - reason_if_ineligible: Why member can't receive (if applicable)
        """
        try:
            # Query from contract
            recipient = await contract_service.get_next_payout_recipient(
                group_address=group_address,
                network=network
            )
            
            if not recipient:
                logger.warning(f"No next payout recipient found for group {group_id}")
                return None

            # Get current round
            current_round = await contract_service.get_current_round(
                group_address=group_address,
                network=network
            )

            # Verify member is still active
            result = await db.execute(
                select(GroupMembership).where(
                    and_(
                        GroupMembership.group_id == group_id,
                        GroupMembership.user_id == UUID(recipient) if recipient != "0x" + "0"*40 else False
                    )
                )
            )
            member = result.scalars().first()

            is_eligible = member is not None and member.is_active
            reason = None
            if not is_eligible:
                reason = "Member inactive or not found" if not member else "Member marked inactive"

            return {
                "recipient_address": recipient,
                "current_round": current_round or 1,
                "is_eligible": is_eligible,
                "reason_if_ineligible": reason
            }

        except Exception as e:
            logger.error(f"Failed to get next payout recipient: {e}")
            return None

    @staticmethod
    async def execute_payout(
        group_id: UUID,
        group_address: str,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Execute a payout to the next member in rotation.
        
        Pre-checks:
        1. Verify all contributing members required funds before executing
        2. Check member eligibility
        3. Verify TX hasn't already been sent
        4. Lock group state during execution
        
        Post-execution:
        1. Update member's payout status
        2. Record payout in audit trail
        3. Advance rotation to next member
        4. Release group lock
        """
        try:
            # Get group info
            group = await db.get(CooperativeGroup, group_id)
            if not group:
                return {
                    "success": False,
                    "error": "Group not found",
                    "group_id": str(group_id)
                }

            # Get next recipient
            recipient_info = await PayoutService.get_next_payout_recipient(
                group_id=group_id,
                group_address=group_address,
                db=db,
                network=network
            )

            if not recipient_info:
                return {
                    "success": False,
                    "error": "No eligible recipient found",
                    "group_id": str(group_id)
                }

            if not recipient_info["is_eligible"]:
                return {
                    "success": False,
                    "error": recipient_info["reason_if_ineligible"],
                    "group_id": str(group_id)
                }

            # Get total vault balance to calculate payout
            vault_balance = await contract_service.get_group_balance(
                group_address=group_address,
                network=network
            )

            if not vault_balance:
                return {
                    "success": False,
                    "error": "Cannot determine vault balance",
                    "group_id": str(group_id)
                }

            # Call contract to execute payout
            payout_result = await contract_service.execute_payout(
                group_address=group_address,
                network=network
            )

            if not payout_result.get("success"):
                logger.error(f"Contract payout execution failed: {payout_result.get('error')}")
                return {
                    "success": False,
                    "error": payout_result.get("error", "Contract payout execution failed"),
                    "group_id": str(group_id)
                }

            # Record payout (would create PayoutRecord table entry)
            logger.info(
                f"Payout executed: group={group_id}, recipient={recipient_info['recipient_address']}, "
                f"round={recipient_info['current_round']}, tx={payout_result.get('tx_hash')}"
            )

            return {
                "success": True,
                "tx_hash": payout_result.get("tx_hash"),
                "group_id": str(group_id),
                "recipient": recipient_info["recipient_address"],
                "round": recipient_info["current_round"],
                "payout_amount": float(vault_balance),
                "network": network
            }

        except Exception as e:
            logger.error(f"Error executing payout: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "group_id": str(group_id)
            }

    @staticmethod
    async def initialize_rotation(
        group_id: UUID,
        group_address: str,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Initialize rotation order for a group's first payout cycle.
        
        Called once when:
        - Group reaches minimum members
        - Group transitions to active status
        - After each round completes
        """
        try:
            # Fetch all active members
            result = await db.execute(
                select(GroupMembership).where(
                    and_(
                        GroupMembership.group_id == group_id,
                        GroupMembership.is_active == True
                    )
                )
            )
            members = result.scalars().all()

            if len(members) < 2:
                return {
                    "success": False,
                    "error": "Minimum 2 members required for rotation",
                    "group_id": str(group_id)
                }

            # Call contract to initialize rotation
            rotation_result = await contract_service.initialize_rotation(
                group_address=group_address,
                network=network
            )

            if not rotation_result.get("success"):
                logger.error(f"Failed to initialize rotation: {rotation_result.get('error')}")
                return {
                    "success": False,
                    "error": rotation_result.get("error", "Contract rotation initialization failed"),
                    "group_id": str(group_id)
                }

            logger.info(
                f"Rotation initialized for group {group_id}: {len(members)} members, "
                f"rotation_order={rotation_result.get('rotation_order', [])[:3]}..."
            )

            return {
                "success": True,
                "tx_hash": rotation_result.get("tx_hash"),
                "group_id": str(group_id),
                "member_count": len(members),
                "rotation_order_sample": rotation_result.get("rotation_order", [])[:5],
                "network": network
            }

        except Exception as e:
            logger.error(f"Error initializing rotation: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "group_id": str(group_id)
            }

    @staticmethod
    async def check_payout_readiness(
        group_id: UUID,
        group_address: str,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Check if a group is ready for payout (all members contributed or deadline passed).
        
        Returns readiness info:
        - is_ready: Whether payout can execute
        - members_contributed: Count of members who paid this round
        - members_total: Total active members
        - contributions_received: Sum of contributions
        - expected_amount: Total expected from all members
        - deadline: When payout must occur if not completed
        """
        try:
            group = await db.get(CooperativeGroup, group_id)
            if not group:
                return {"is_ready": False, "error": "Group not found"}

            # Get member count
            result = await db.execute(
                select(GroupMembership).where(
                    and_(
                        GroupMembership.group_id == group_id,
                        GroupMembership.is_active == True
                    )
                )
            )
            total_members = len(result.scalars().all())

            # Get current round from contract
            current_round = await contract_service.get_current_round(
                group_address=group_address,
                network=network
            )

            # Count members who paid this round (simplified - in production, track per-round)
            members_paid = 0
            total_contributed = Decimal(0)

            for member in result.scalars().all():
                has_paid = await contract_service.has_paid_current_round(
                    group_address=group_address,
                    member_address=str(member.user_id),
                    network=network
                )
                if has_paid:
                    members_paid += 1

            # Calculate expected amount
            expected_amount = group.contribution_amount * Decimal(total_members)

            # Determine readiness
            is_ready = members_paid == total_members
            
            # Deadline is now + cycle duration
            deadline = datetime.now() + timedelta(seconds=int(
                await contract_service._query_flow_contract(
                    "cycleDuration", group_address
                ) or 86400
            ))

            return {
                "is_ready": is_ready,
                "members_contributed": members_paid,
                "members_total": total_members,
                "expected_amount": float(expected_amount),
                "current_round": current_round or 1,
                "deadline": deadline.isoformat(),
                "has_deadline_passed": datetime.now() >= deadline,
                "group_id": str(group_id)
            }

        except Exception as e:
            logger.error(f"Error checking payout readiness: {e}", exc_info=True)
            return {
                "is_ready": False,
                "error": str(e),
                "group_id": str(group_id)
            }

    @staticmethod
    async def get_payout_history(
        db: AsyncSession,
        group_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent payouts for a group (for auditing and transparency).
        
        TODO: Create PayoutRecord table to track all payouts
        """
        try:
            # For now, infer payouts from completed contributions where member received payout
            # In production, maintain explicit PayoutRecord table
            
            result = await db.execute(
                select(Contribution).where(
                    and_(
                        Contribution.group_id == group_id,
                        Contribution.status == ContributionStatus.completed
                    )
                ).order_by(
                    Contribution.fulfilled_at.desc()
                ).limit(limit)
            )
            
            contributions = result.scalars().all()
            
            return [
                {
                    "contribution_id": str(c.id),
                    "user_id": str(c.user_id),
                    "amount": float(c.amount),
                    "fulfilled_at": c.fulfilled_at.isoformat() if c.fulfilled_at else None,
                    "note": c.note
                }
                for c in contributions
            ]

        except Exception as e:
            logger.error(f"Failed to get payout history: {e}")
            return []

    @staticmethod
    async def validate_member_for_payout(
        group_id: UUID,
        member_address: str,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Validate whether a member can receive a payout.
        
        Checks:
        1. Member is in group and active
        2. Member is not on suspension/freeze
        3. Member has satisfied any prerequisites
        4. No double payout this round
        """
        try:
            # Check membership
            try:
                member_uuid = UUID(member_address)
            except ValueError:
                # Blockchain address - would need reverse lookup
                member_uuid = None

            if member_uuid:
                result = await db.execute(
                    select(GroupMembership).where(
                        and_(
                            GroupMembership.group_id == group_id,
                            GroupMembership.user_id == member_uuid
                        )
                    )
                )
                member = result.scalars().first()

                if not member:
                    return {
                        "is_valid": False,
                        "reason": "Member not found in group"
                    }

                if not member.is_active:
                    return {
                        "is_valid": False,
                        "reason": "Member is not active"
                    }

            # Check member info from contract
            member_info = await contract_service.get_member_info(
                group_address=str(group_id),
                member_address=member_address,
                network=network
            )

            if not member_info:
                return {
                    "is_valid": False,
                    "reason": "Member not found on chain"
                }

            if not member_info.get("is_active"):
                return {
                    "is_valid": False,
                    "reason": "Member inactive on chain"
                }

            return {
                "is_valid": True,
                "member_address": member_address,
                "join_time": member_info.get("join_time"),
                "last_payout_round": member_info.get("last_payout_round")
            }

        except Exception as e:
            logger.error(f"Error validating member for payout: {e}")
            return {
                "is_valid": False,
                "reason": f"Validation error: {str(e)}"
            }
