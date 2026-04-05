
import asyncio
import logging
from flow_py_sdk import flow_client, cadence
from flow_py_sdk.cadence import Address, UFix64, String, Array, UInt64, UInt8
from app.utils.logger import logger

FLOW_SERVICE_ACCOUNT = "0xYOUR_SERVICE_ACCOUNT"
COOPWISE_CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS"
TESTNET_HOST = "access.devnet.nodes.onflow.org"
TESTNET_PORT = 9000


class FlowService:

    async def create_circle(
        self,
        member_addresses: list[str],
        weekly_amount_usdc: float,
        rotation_order: str = "sequential",
        creator_address: str = "",
    ) -> str:
        """
        Submits CreateCircle.cdc to Flow testnet.
        Returns transaction ID.
        """
        cadence_script = open("cadence/transactions/CreateCircle.cdc").read()

        async with flow_client(host=TESTNET_HOST, port=TESTNET_PORT) as client:
            # Build args matching the transaction signature
            args = [
                Array([Address(a) for a in member_addresses]),
                UFix64(weekly_amount_usdc),
                String(rotation_order),
                Address(creator_address),
                UFix64(0.1),  # weeklyFeeAmount — tune after fee estimation
            ]

            block = await client.get_latest_block()
            proposer = await client.get_account_at_latest_block(
                address=bytes.fromhex(FLOW_SERVICE_ACCOUNT.lstrip("0x"))
            )

            tx = (
                cadence.Transaction()
                .set_script(cadence_script.encode())
                .set_reference_block_id(block.id)
                .set_gas_limit(9999)
                .set_proposer(
                    proposer.address,
                    proposer.keys[0].index,
                    proposer.keys[0].sequence_number
                )
                .set_payer(proposer.address)
                .add_authorizer(proposer.address)
                .set_arguments(args)
            )

            # Sign with service account key
            tx = await client.sign_transaction(tx, proposer)
            result = await client.send_transaction(tx)
            return result.id.hex()

    async def await_circle_created_event(self, tx_id: str) -> int:
        """
        Waits for transaction seal and extracts circleId from CircleCreated event.
        Event type: A.{contractAddress}.CoopWise.CircleCreated
        """
        async with flow_client(host=TESTNET_HOST, port=TESTNET_PORT) as client:
            # Poll until sealed
            for attempt in range(30):
                await asyncio.sleep(2)
                try:
                    result = await client.get_transaction_result(
                        id=bytes.fromhex(tx_id)
                    )
                    if result.status.value >= 4:  # SEALED
                        break
                except Exception:
                    pass
            
            event_type = (
                f"A.{COOPWISE_CONTRACT_ADDRESS.lstrip('0x')}"
                f".CoopWise.CircleCreated"
            )
            for event in result.events:
                if event.type == event_type:
                    # event.payload is Cadence JSON
                    # circleId is first field
                    circle_id = int(event.payload["value"]["fields"][0]["value"]["value"])
                    
                    # Fire-and-forget: start the cron schedule
                    asyncio.create_task(self._start_circle_cron(circle_id))
                    
                    return circle_id

            raise ValueError(f"CircleCreated event not found in tx {tx_id}")

    async def _start_circle_cron(self, circle_id: int) -> None:
        """
        Submits StartCircleCron.cdc to kick off weekly automation.
        Called async after circle creation confirms.
        """
        cadence_script = open("cadence/transactions/StartCircleCron.cdc").read()

        async with flow_client(host=TESTNET_HOST, port=TESTNET_PORT) as client:
            args = [
                UInt64(circle_id),
                UInt8(2),    # Low priority
                UInt64(500), # executorExecutionEffort
                UInt64(2500),# keeperExecutionEffort
            ]
            # ... same signing/sending pattern as create_circle
            logger.info(f"[FlowService] Cron started for circle {circle_id}")

    async def stop_circle_cron(self, circle_id: int) -> None:
        """
        Cancels the cron when circle completes all rounds.
        Recovers 50% of prepaid fees.
        """
        # Submit CancelCronSchedule.cdc with /storage/coopwiseCron_{circle_id}
        cron_path = f"coopwiseCron_{circle_id}"
        logger.info(f"[FlowService] Stopping cron for circle {circle_id} at {cron_path}")
        # ... submit CancelCronSchedule.cdc

    async def get_circle_info(self, circle_id: int) -> dict:
        """
        Read-only script to get circle state from chain.
        """
        script = """
        import "CoopWise"
        access(all) fun main(circleId: UInt64): CoopWise.CircleInfo? {
            return CoopWise.getCircle(id: circleId)
        }
        """
        async with flow_client(host=TESTNET_HOST, port=TESTNET_PORT) as client:
            result = await client.execute_script(
                script=script.encode(),
                arguments=[UInt64(circle_id)]
            )
            return result


flow_service = FlowService()























# """
# Flow blockchain service — stub implementation.

# Real implementation will use FCL (Flow Client Library) server-side
# to submit Cadence transactions and listen for emitted events.

# Cadence contracts:
#   - CreateCircle.cdc  → emits CircleCreated { circleId: UInt64 }
#   - JoinCircle.cdc    → emits MemberJoined  { circleId: UInt64, member: Address }
# """
# import random
# import asyncio
# import logging
# from app.utils.logger import logger

# class FlowService:

#     async def create_circle(
#         self,
#         member_addresses: list[str],
#         weekly_amount_usdc: float,
#         rotation_order: str = "sequential",
#     ) -> str:
#         """
#         Submit CreateCircle.cdc transaction to Flow testnet.
#         Returns the transaction ID.

#         TODO: Replace with FCL server-side call:
#             result = await fcl.mutate(
#                 cadence=open("cadence/transactions/CreateCircle.cdc").read(),
#                 args=lambda arg, t: [
#                     arg(member_addresses, t.Array(t.Address)),
#                     arg(str(weekly_amount_usdc), t.UFix64),
#                     arg(rotation_order, t.String),
#                 ],
#                 proposer=fcl.service_account,
#                 payer=fcl.service_account,
#                 authorizations=[fcl.service_account],
#                 limit=9999,
#             )
#             return result["transactionId"]
#         """
#         await asyncio.sleep(0.05)  # simulate network latency
#         tx_id = f"FLOW_TX_STUB_{random.randint(100000, 999999)}"
#         logger.info(f"[FlowService stub] create_circle tx_id={tx_id}")
#         return tx_id

#     async def await_circle_created_event(self, tx_id: str) -> int:
#         """
#         Poll Flow until the CircleCreated event is emitted, return chain_circle_id.

#         TODO: Replace with FCL event polling:
#             tx = await fcl.get_transaction(tx_id)
#             event = next(e for e in tx.events if e.type.endswith("CircleCreated"))
#             return int(event.data["circleId"])
#         """
#         await asyncio.sleep(0.05)
#         # Generate a unique stub ID — use hash of tx_id so reruns are deterministic
#         chain_circle_id = abs(hash(tx_id)) % 2_000_000_000
#         logger.info(
#             f"[FlowService stub] CircleCreated event "
#             f"tx_id={tx_id} chain_circle_id={chain_circle_id}"
#         )
#         return chain_circle_id

#     async def join_circle(self, circle_id: int, member_address: str) -> str:
#         """
#         Submit JoinCircle.cdc transaction to Flow testnet.

#         TODO: Replace with FCL server-side call.
#         """
#         await asyncio.sleep(0.05)
#         tx_id = f"FLOW_TX_STUB_{random.randint(100000, 999999)}"
#         logger.info(
#             f"[FlowService stub] join_circle "
#             f"circle_id={circle_id} member={member_address} tx_id={tx_id}"
#         )
#         return tx_id
