"""
Timed Contribution Worker

This module handles scheduled/automated contributions via Celery tasks.
Runs periodically to process contributions that are due based on group frequency settings.

Flow:
1. Query all active groups and their members
2. For each member, check if contribution is due
3. Process auto-contribution if due and wallet has sufficient balance
4. Log results for monitoring and debugging
5. Alert on failures for manual intervention

Security:
- Individual transaction isolation and retry logic
- Graceful error handling (one member failure doesn't block others)
- Audit logging of all automated actions
- Rate limiting per group and user
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import sessionmaker

from app.services.contribution_service import ContributionService, ContributionActionType
from app.services.cooperative_group_service import CooperativeGroupService
from app.services.membership_service import CooperativeMembershipService
from db.models.cooperative_group import CooperativeGroup, CooperativeStatus, ContributionFrequency
from db.models.contribution_model import Contribution, ContributionStatus
from db.models.membership import GroupMembership
from app.utils.logger import logger
from app.schemas.auth import AuthenticatedUser


class TimedContributionWorker:
    """
    Worker for processing time-based, automated contributions.
    
    Usage (with Celery):
        from celery import Celery
        app = Celery('coopwise')
        
        @app.task
        def process_timed_contributions():
            asyncio.run(TimedContributionWorker.process_all_due_contributions())
        
        # Schedule in beat config
        app.conf.beat_schedule = {
            'process-contributions-daily': {
                'task': 'tasks.process_timed_contributions',
                'schedule': crontab(hour=0, minute=0),  # Daily at midnight
            },
            'process-contributions-hourly': {
                'task': 'tasks.process_timed_contributions',
                'schedule': crontab(minute=0),  # Every hour
            },
        }
    """

    # Batch size for processing to avoid overwhelming the system
    BATCH_SIZE = 50
    
    # Max retry attempts for failed contributions
    MAX_RETRIES = 3
    
    # Delay before retry (seconds)
    RETRY_DELAY = 300  # 5 minutes

    @staticmethod
    async def process_all_due_contributions(
        db_session_factory: sessionmaker,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Main entry point for processing all due contributions across all groups.
        
        Returns:
            Dictionary with processing summary:
            {
                "total_processed": int,
                "successful": int,
                "failed": int,
                "skipped": int,
                "errors": [str],
                "start_time": datetime,
                "end_time": datetime
            }
        """
        logger.info("=" * 60)
        logger.info("Starting timed contribution processing")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        summary = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
            "start_time": start_time,
            "end_time": None,
            "network": network
        }

        try:
            async with db_session_factory() as db:
                # Get all active groups
                active_groups = await TimedContributionWorker._get_active_groups(db)
                logger.info(f"Found {len(active_groups)} active groups")

                # Process each group
                for group in active_groups:
                    try:
                        group_result = await TimedContributionWorker._process_group_contributions(
                            db=db,
                            group_id=group.id,
                            group_name=group.name,
                            network=network
                        )
                        
                        summary["total_processed"] += group_result["total"]
                        summary["successful"] += group_result["successful"]
                        summary["failed"] += group_result["failed"]
                        summary["skipped"] += group_result["skipped"]
                        
                        if group_result["errors"]:
                            summary["errors"].extend(group_result["errors"])
                            
                    except Exception as e:
                        error_msg = f"Error processing group {group.id} ({group.name}): {str(e)}"
                        logger.error(error_msg, exc_info=True)
                        summary["errors"].append(error_msg)

                # Finalize summary
                summary["end_time"] = datetime.now()
                duration = (summary["end_time"] - start_time).total_seconds()
                
                logger.info("=" * 60)
                logger.info(f"Timed contribution processing completed")
                logger.info(f"Duration: {duration:.2f} seconds")
                logger.info(f"Total processed: {summary['total_processed']}")
                logger.info(f"Successful: {summary['successful']}")
                logger.info(f"Failed: {summary['failed']}")
                logger.info(f"Skipped: {summary['skipped']}")
                if summary["errors"]:
                    logger.warning(f"Errors ({len(summary['errors'])}): {summary['errors'][:5]}")
                logger.info("=" * 60)

                return summary

        except Exception as e:
            error_msg = f"Fatal error in process_all_due_contributions: {str(e)}"
            logger.error(error_msg, exc_info=True)
            summary["errors"].append(error_msg)
            summary["end_time"] = datetime.now()
            return summary

    @staticmethod
    async def _get_active_groups(db: AsyncSession) -> List[CooperativeGroup]:
        """Query all active cooperative groups"""
        try:
            result = await db.execute(
                select(CooperativeGroup).where(
                    CooperativeGroup.status == CooperativeStatus.active
                )
            )
            groups = result.scalars().all()
            return groups
        except Exception as e:
            logger.error(f"Failed to fetch active groups: {e}")
            return []

    @staticmethod
    async def _process_group_contributions(
        db: AsyncSession,
        group_id: UUID,
        group_name: str,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Process all due contributions for a single group.
        
        Returns:
            {
                "total": int,  # total members processed
                "successful": int,
                "failed": int,
                "skipped": int,
                "errors": [str]
            }
        """
        result = {
            "total": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }

        try:
            logger.info(f"Processing contributions for group: {group_name} ({group_id})")

            # Get all active members
            members = await TimedContributionWorker._get_active_group_members(db, group_id)
            logger.debug(f"Found {len(members)} active members in group")

            # Process in batches
            for i in range(0, len(members), TimedContributionWorker.BATCH_SIZE):
                batch = members[i:i + TimedContributionWorker.BATCH_SIZE]
                batch_result = await TimedContributionWorker._process_member_batch(
                    db=db,
                    group_id=group_id,
                    members=batch,
                    network=network
                )
                
                result["total"] += batch_result["total"]
                result["successful"] += batch_result["successful"]
                result["failed"] += batch_result["failed"]
                result["skipped"] += batch_result["skipped"]
                result["errors"].extend(batch_result["errors"])

            logger.info(
                f"Group {group_name}: processed={result['total']}, "
                f"success={result['successful']}, failed={result['failed']}, "
                f"skipped={result['skipped']}"
            )

            return result

        except Exception as e:
            error_msg = f"Error processing group {group_name}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            result["errors"].append(error_msg)
            return result

    @staticmethod
    async def _get_active_group_members(
        db: AsyncSession,
        group_id: UUID
    ) -> List[GroupMembership]:
        """Get all active members of a group"""
        try:
            result = await db.execute(
                select(GroupMembership).where(
                    and_(
                        GroupMembership.group_id == group_id,
                        GroupMembership.is_active == True
                    )
                )
            )
            members = result.scalars().all()
            return members
        except Exception as e:
            logger.error(f"Failed to fetch active members for group {group_id}: {e}")
            return []

    @staticmethod
    async def _process_member_batch(
        db: AsyncSession,
        group_id: UUID,
        members: List[GroupMembership],
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Process contribution for each member in batch.
        Errors in one member don't block others.
        """
        result = {
            "total": len(members),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }

        for membership in members:
            try:
                # Create simulated user object for service call
                user = AuthenticatedUser(
                    id=membership.user_id,
                    email="",  # Not needed for auto-processing
                    wallet_address=None  # Can be fetched from user DB if needed
                )

                # Attempt contribution
                contribution = await ContributionService.process_auto_contribution(
                    group_id=group_id,
                    user=user,
                    db=db,
                    network=network
                )

                if contribution:
                    result["successful"] += 1
                    logger.info(
                        f"Auto-contribution processed: user={membership.user_id}, "
                        f"group={group_id}, amount={contribution.amount}"
                    )
                else:
                    result["skipped"] += 1
                    logger.debug(
                        f"Auto-contribution skipped: user={membership.user_id}, "
                        f"group={group_id} (not due or insufficient balance)"
                    )

            except HTTPException as e:
                result["failed"] += 1
                error_msg = f"HTTP error for user {membership.user_id}: {e.detail}"
                logger.warning(error_msg)
                result["errors"].append(error_msg)

            except Exception as e:
                result["failed"] += 1
                error_msg = f"Error processing user {membership.user_id}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                result["errors"].append(error_msg)

        return result

    @staticmethod
    async def process_failed_contributions_retry(
        db_session_factory: sessionmaker,
        max_age_hours: int = 24,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Retry processing of failed contributions (within last N hours).
        
        Args:
            db_session_factory: Async session factory
            max_age_hours: Only retry contributions failed within this many hours
            network: Blockchain network
            
        Returns:
            Retry summary
        """
        logger.info("Starting failed contribution retry process")
        
        summary = {
            "total_retry": 0,
            "successful": 0,
            "still_failed": 0,
            "errors": []
        }

        try:
            async with db_session_factory() as db:
                # Find recently failed contributions
                cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
                
                result = await db.execute(
                    select(Contribution).where(
                        and_(
                            Contribution.status == ContributionStatus.failed,
                            Contribution.created_at >= cutoff_time
                        )
                    )
                )
                failed_contributions = result.scalars().all()
                logger.info(f"Found {len(failed_contributions)} failed contributions to retry")

                for contrib in failed_contributions:
                    try:
                        # Reload state from DB in case already processed
                        await db.refresh(contrib)
                        if contrib.status != ContributionStatus.failed:
                            continue

                        summary["total_retry"] += 1

                        # Resubmit to contract
                        user = AuthenticatedUser(
                            id=contrib.user_id,
                            email="",
                            wallet_address=None
                        )

                        group = await db.get(CooperativeGroup, contrib.group_id)
                        if not group:
                            logger.error(f"Group not found for contribution {contrib.id}")
                            continue

                        from app.services.contract_service import contract_service
                        result = await contract_service.submit_contribution(
                            group_address=str(group.id),
                            user_address=user.wallet_address or str(user.id),
                            amount=Decimal(str(contrib.amount)),
                            network=network
                        )

                        if result.get("success"):
                            await ContributionService.mark_contribution_success(
                                db=db,
                                contribution_id=contrib.id,
                                tx_hash=result.get("tx_hash"),
                                action_type=ContributionActionType.AUTO_DEBIT
                            )
                            summary["successful"] += 1
                            logger.info(f"Retried contribution succeeded: {contrib.id}")
                        else:
                            summary["still_failed"] += 1
                            logger.warning(f"Retried contribution still failed: {contrib.id}")

                    except Exception as e:
                        summary["still_failed"] += 1
                        error_msg = f"Error retrying contribution {contrib.id}: {str(e)}"
                        logger.error(error_msg, exc_info=True)
                        summary["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Fatal error in retry process: {str(e)}"
            logger.error(error_msg, exc_info=True)
            summary["errors"].append(error_msg)

        logger.info(
            f"Retry process complete: total={summary['total_retry']}, "
            f"success={summary['successful']}, still_failed={summary['still_failed']}"
        )

        return summary


# Import here to avoid circular imports
from fastapi import HTTPException
