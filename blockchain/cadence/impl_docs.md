# Forte is live on testnet and mainnet with real contract addresses

## CreateCircle.cdc — How it works

### Cadence fundamentals that apply here

Cadence separates contracts (deployed once, define types and logic) from transactions (executed once, mutate state). CreateCircle.cdc is a transaction — it runs once when a user creates a circle, calls into the CoopWise contract, and emits an event that the backend listens for to get the chain_circle_id.

Flow transactions have three roles:

- **Proposer** — the account whose sequence number is used (the user)
- **Authorizer** — signs to grant resource access (the user)
- **Payer** — pays gas (CoopWise fee-payer account — users pay nothing)

Flow has built-in support for these 3 different roles which provides native support for sponsored transactions flow, so splitting proposer/authorizer from payer is protocol-native, not a hack.

### File structure

You'll have two files: the contract (deployed once) and the transaction (called per circle creation).

```
cadence/
    contracts/
        CoopWise.cdc          ← deployed contract, defines Circle struct + events
    transactions/
        CreateCircle.cdc      ← transaction called by backend per circle creation
    scripts/
        GetCircle.cdc         ← read-only query (Step 3)
```

## CoopWise.cdc — the contract

```cadence
// cadence/contracts/CoopWise.cdc
// Deploy once to your CoopWise service account on testnet/mainnet

access(all) contract CoopWise {

        // ── Storage paths
        access(all) let RegistryStoragePath: StoragePath
        access(all) let RegistryPublicPath: PublicPath

        // ── Circle state
        access(all) struct Circle {
                access(all) let id: UInt64
                access(all) let name: String
                access(all) let creator: Address
                access(all) var members: [Address]
                access(all) let weeklyAmountUSDC: UFix64     // 6-decimal USDC amount
                access(all) let rotationOrder: String        // "sequential" | "random"
                access(all) let payoutSchedule: String       // "weekly" | "biweekly" | "monthly"
                access(all) var currentRound: UInt64
                access(all) var rotationQueue: [Address]     // ordered payout queue
                access(all) let createdAt: UFix64            // getCurrentBlock().timestamp

                init(
                        id: UInt64,
                        name: String,
                        creator: Address,
                        members: [Address],
                        weeklyAmountUSDC: UFix64,
                        rotationOrder: String,
                        payoutSchedule: String,
                ) {
                        self.id = id
                        self.name = name
                        self.creator = creator
                        self.members = members
                        self.weeklyAmountUSDC = weeklyAmountUSDC
                        self.rotationOrder = rotationOrder
                        self.payoutSchedule = payoutSchedule
                        self.currentRound = 0
                        self.rotationQueue = members  // set rotation order at creation
                        self.createdAt = getCurrentBlock().timestamp
                }
        }

        // ── Registry resource — stores all circles───────
        access(all) resource Registry {
                access(all) var circles: {UInt64: Circle}
                access(all) var nextId: UInt64

                init() {
                        self.circles = {}
                        self.nextId = 1
                }

                access(all) fun createCircle(
                        name: String,
                        creator: Address,
                        members: [Address],
                        weeklyAmountUSDC: UFix64,
                        rotationOrder: String,
                        payoutSchedule: String,
                ): UInt64 {
                        let id = self.nextId
                        let circle = Circle(
                                id: id,
                                name: name,
                                creator: creator,
                                members: members,
                                weeklyAmountUSDC: weeklyAmountUSDC,
                                rotationOrder: rotationOrder,
                                payoutSchedule: payoutSchedule,
                        )
                        self.circles[id] = circle
                        self.nextId = self.nextId + 1

                        // Emit event — backend listens for this to get chain_circle_id
                        emit CoopWise.CircleCreated(
                                circleId: id,
                                name: name,
                                creator: creator,
                                memberCount: UInt64(members.length),
                                weeklyAmountUSDC: weeklyAmountUSDC,
                        )
                        return id
                }

                access(all) fun addMember(circleId: UInt64, member: Address) {
                        pre {
                                self.circles[circleId] != nil: "Circle not found"
                        }
                        self.circles[circleId]!.members.append(member)
                        self.circles[circleId]!.rotationQueue.append(member)
                        emit CoopWise.MemberJoined(circleId: circleId, member: member)
                }

                access(all) fun getCircle(circleId: UInt64): Circle? {
                        return self.circles[circleId]
                }
        }

        // ── Events — backend subscribes to these
        access(all) event CircleCreated(
                circleId: UInt64,
                name: String,
                creator: Address,
                memberCount: UInt64,
                weeklyAmountUSDC: UFix64,
        )

        access(all) event MemberJoined(circleId: UInt64, member: Address)

        // ── Contract init — runs once at deploy
        init() {
                self.RegistryStoragePath = /storage/CoopWiseRegistry
                self.RegistryPublicPath = /public/CoopWiseRegistry

                // Deploy a Registry resource to the contract account's storage
                let registry <- create Registry()
                self.account.storage.save(<-registry, to: self.RegistryStoragePath)

                // Expose a public capability so anyone can read circles
                let cap = self.account.capabilities.storage.issue<&Registry>(
                        self.RegistryStoragePath
                )
                self.account.capabilities.publish(cap, at: self.RegistryPublicPath)
        }

        // ── Public accessor───────
        access(all) fun getRegistry(): &Registry {
                return self.account.storage.borrow<&Registry>(
                        from: self.RegistryStoragePath
                ) ?? panic("Registry not found")
        }
}
```

## CreateCircle.cdc — the transaction

```cadence
// cadence/transactions/CreateCircle.cdc
// Called by the CoopWise backend (service account as payer)
// when a user creates a new savings circle.
//
// Roles:
//   proposer   = user's Flow account (sequence number)
//   authorizer = user's Flow account (grants permission)
//   payer      = CoopWise service account (pays gas — user pays nothing)

import CoopWise from 0xCOOPWISE_CONTRACT_ADDRESS  // replace with deployed address

transaction(
        name: String,
        memberAddresses: [Address],
        weeklyAmountUSDC: UFix64,
        rotationOrder: String,
        payoutSchedule: String,
) {
        // The authorizer is the creator — their address is recorded on-chain
        prepare(creator: &Account) {
                // No resource access needed for the creator in this tx —
                // the Registry lives on the contract account.
                // This prepare block authenticates the creator's address.
                let _ = creator.address
        }

        execute {
                // Borrow the Registry from the contract account's public capability
                let registry = CoopWise.getRegistry()

                // Build the full members list: creator first, then invited members
                var allMembers: [Address] = []
                // Creator's address comes from the authorizer (injected by FCL)
                // We pass it in memberAddresses[0] from the backend
                allMembers.appendAll(memberAddresses)

                // Create the circle — emits CircleCreated event with the new circleId
                let circleId = registry.createCircle(
                        name: name,
                        creator: memberAddresses[0],   // first element is always creator
                        members: allMembers,
                        weeklyAmountUSDC: weeklyAmountUSDC,
                        rotationOrder: rotationOrder,
                        payoutSchedule: payoutSchedule,
                )

                log("Circle created with ID: ".concat(circleId.toString()))
        }
}
```

## How the backend calls it

This is what replaces the stub in flow_service.py:

```python
# app/services/flow_service.py — real implementation (replace stub later)
# Uses flow-py SDK or subprocess call to Flow CLI

async def create_circle(
        self,
        member_addresses: list[str],
        weekly_amount_usdc: float,
        rotation_order: str = "sequential",
        payout_schedule: str = "weekly",
        name: str = "",
) -> str:
        """
        Calls CreateCircle.cdc on Flow testnet.
        
        FCL server-side pattern (JavaScript backend via child process,
        or flow-py once it supports Cadence args fully):
        
        const txId = await fcl.mutate({
                cadence: fs.readFileSync("cadence/transactions/CreateCircle.cdc", "utf8"),
                args: (arg, t) => [
                        arg(name, t.String),
                        arg(member_addresses.map(a => arg(a, t.Address)), t.Array(t.Address)),
                        arg(weekly_amount_usdc.toFixed(8), t.UFix64),
                        arg(rotation_order, t.String),
                        arg(payout_schedule, t.String),
                ],
                proposer: fcl.currentUser,          // user's account
                authorizations: [fcl.currentUser],  // user authorizes
                payer: serviceAccountAuthorization, // CoopWise pays gas
                limit: 9999,
        })
        return txId
        
        The backend then polls:
        const tx = await fcl.tx(txId).onceSealed()
        const event = tx.events.find(e => e.type.includes("CircleCreated"))
        return event.data.circleId   // this becomes chain_circle_id
        """
        # Stub stays until FCL wiring is done
        await asyncio.sleep(0.05)
        tx_id = f"FLOW_TX_STUB_{abs(hash(name + str(weekly_amount_usdc)))}"
        return tx_id
```

## Key things to know before wiring the real call

- **Contract address format** — on Flow, imports use the account address where the contract is deployed: `import CoopWise from 0xABCD1234`. You get this address after running `flow accounts create` + `flow deploy` on testnet via Flow CLI.

- **UFix64 for amounts** — Flow's fixed-point number type. `0.005000` USDC must be passed as the string `"0.00500000"` (8 decimal places always) when constructing FCL args.

- **CircleCreated event type string** — when polling `tx.events`, the full event type is `A.{contractAddress}.CoopWise.CircleCreated`. Your backend event listener filters on this string to extract `circleId`.

- **Sponsored tx wiring** — the payer authorization requires your CoopWise service account's private key on the backend. Flow Wallet currently sponsors all transactions on testnet and mainnet flow — so during development you can use a single-role transaction (user is proposer + authorizer + payer) and add the fee-payer split when going to production.

### Deploy commands

```bash
# One-time setup
flow accounts create --network testnet
flow project deploy --network testnet

# After deploy, note the contract address printed — 
# update 0xCOOPWISE_CONTRACT_ADDRESS in all .cdc files
```
