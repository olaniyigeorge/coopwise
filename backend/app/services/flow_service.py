"""
Flow blockchain service — stub implementation.

Real implementation will use FCL (Flow Client Library) server-side
to submit Cadence transactions and listen for emitted events.

Cadence contracts:
  - CreateCircle.cdc  → emits CircleCreated { circleId: UInt64 }
  - JoinCircle.cdc    → emits MemberJoined  { circleId: UInt64, member: Address }
"""
import random
import asyncio
import logging
from app.utils.logger import logger

class FlowService:

    async def create_circle(
        self,
        member_addresses: list[str],
        weekly_amount_usdc: float,
        rotation_order: str = "sequential",
    ) -> str:
        """
        Submit CreateCircle.cdc transaction to Flow testnet.
        Returns the transaction ID.

        TODO: Replace with FCL server-side call:
            result = await fcl.mutate(
                cadence=open("cadence/transactions/CreateCircle.cdc").read(),
                args=lambda arg, t: [
                    arg(member_addresses, t.Array(t.Address)),
                    arg(str(weekly_amount_usdc), t.UFix64),
                    arg(rotation_order, t.String),
                ],
                proposer=fcl.service_account,
                payer=fcl.service_account,
                authorizations=[fcl.service_account],
                limit=9999,
            )
            return result["transactionId"]
        """
        await asyncio.sleep(0.05)  # simulate network latency
        tx_id = f"FLOW_TX_STUB_{random.randint(100000, 999999)}"
        logger.info(f"[FlowService stub] create_circle tx_id={tx_id}")
        return tx_id

    async def await_circle_created_event(self, tx_id: str) -> int:
        """
        Poll Flow until the CircleCreated event is emitted, return chain_circle_id.

        TODO: Replace with FCL event polling:
            tx = await fcl.get_transaction(tx_id)
            event = next(e for e in tx.events if e.type.endswith("CircleCreated"))
            return int(event.data["circleId"])
        """
        await asyncio.sleep(0.05)
        # Generate a unique stub ID — use hash of tx_id so reruns are deterministic
        chain_circle_id = abs(hash(tx_id)) % 2_000_000_000
        logger.info(
            f"[FlowService stub] CircleCreated event "
            f"tx_id={tx_id} chain_circle_id={chain_circle_id}"
        )
        return chain_circle_id

    async def join_circle(self, circle_id: int, member_address: str) -> str:
        """
        Submit JoinCircle.cdc transaction to Flow testnet.

        TODO: Replace with FCL server-side call.
        """
        await asyncio.sleep(0.05)
        tx_id = f"FLOW_TX_STUB_{random.randint(100000, 999999)}"
        logger.info(
            f"[FlowService stub] join_circle "
            f"circle_id={circle_id} member={member_address} tx_id={tx_id}"
        )
        return tx_id


# Singleton — import this everywhere
flow_service = FlowService()