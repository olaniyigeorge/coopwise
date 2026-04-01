// cadence/contracts/CoopWise.cdc
import "FlowTransactionScheduler"
import "FlowToken"
import "FungibleToken"

access(all) contract CoopWise {

    // ── Events 
    access(all) event CircleCreated(
        circleId: UInt64,
        creator: Address,
        memberAddresses: [Address],
        weeklyAmountUsdc: UFix64,
        rotationOrder: String
    )
    access(all) event ContributionCollected(circleId: UInt64, member: Address, round: UInt64)
    access(all) event PayoutTriggered(circleId: UInt64, winner: Address, round: UInt64)
    access(all) event RoundAdvanced(circleId: UInt64, newRound: UInt64)

    // ── Storage paths 
    access(all) let AdminStoragePath: StoragePath

    // ── Circle data 
    access(all) struct CircleInfo {
        access(all) let id: UInt64
        access(all) let creator: Address
        access(all) let members: [Address]          // rotation order is index order
        access(all) let weeklyAmountUsdc: UFix64
        access(all) var currentRound: UInt64        // 0-indexed, which member gets paid next
        access(all) var isComplete: Bool
        access(all) let rotationOrder: String       // "sequential" | "random"
        access(all) var contributedThisRound: {Address: Bool}

        init(
            id: UInt64,
            creator: Address,
            members: [Address],
            weeklyAmountUsdc: UFix64,
            rotationOrder: String
        ) {
            self.id = id
            self.creator = creator
            self.members = members
            self.weeklyAmountUsdc = weeklyAmountUsdc
            self.currentRound = 0
            self.isComplete = false
            self.rotationOrder = rotationOrder
            self.contributedThisRound = {}
        }
    }

    // ── State ─────────────────────────────────────────────────────────────
    access(all) var nextCircleId: UInt64
    access(contract) var circles: {UInt64: CircleInfo}

    // ── ContributionHandler (one resource per circle, stored per-circle) ──
    // FlowCron calls executeTransaction() on this each week
    access(all) resource ContributionHandler: FlowTransactionScheduler.TransactionHandler {

        access(all) let circleId: UInt64

        access(FlowTransactionScheduler.Execute)
        fun executeTransaction(id: UInt64, data: AnyStruct?) {
            // Pull funds from each member and advance the round
            // In MVP: emit events that backend listens to for offramp
            let circleId = self.circleId

            if let circle = CoopWise.circles[circleId] {
                if circle.isComplete { return }

                let winner = circle.members[circle.currentRound]

                // Emit — backend listens and triggers Flutterwave payout
                emit PayoutTriggered(
                    circleId: circleId,
                    winner: winner,
                    round: circle.currentRound
                )

                // Advance round
                let newRound = circle.currentRound + 1
                CoopWise.advanceRound(circleId: circleId, newRound: newRound)

                emit RoundAdvanced(circleId: circleId, newRound: newRound)
            }
        }

        access(all) view fun getViews(): [Type] {
            return [Type<StoragePath>(), Type<PublicPath>()]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<StoragePath>():
                    return StoragePath(
                        identifier: "coopwiseHandler_".concat(self.circleId.toString())
                    )!
                default:
                    return nil
            }
        }
    }

    // ── Admin resource (held by CoopWise service account) ────────────────
    access(all) resource Admin {

        access(all) fun createCircle(
            creator: Address,
            memberAddresses: [Address],
            weeklyAmountUsdc: UFix64,
            rotationOrder: String
        ): UInt64 {
            let circleId = CoopWise.nextCircleId
            CoopWise.nextCircleId = circleId + 1

            let info = CircleInfo(
                id: circleId,
                creator: creator,
                members: memberAddresses,
                weeklyAmountUsdc: weeklyAmountUsdc,
                rotationOrder: rotationOrder
            )
            CoopWise.circles[circleId] = info

            emit CircleCreated(
                circleId: circleId,
                creator: creator,
                memberAddresses: memberAddresses,
                weeklyAmountUsdc: weeklyAmountUsdc,
                rotationOrder: rotationOrder
            )

            return circleId
        }

        access(all) fun createContributionHandler(circleId: UInt64): @ContributionHandler {
            return <- create ContributionHandler(circleId: circleId)
        }
    }

    // ── Internal helpers ─────────────────────────────────────────────────
    access(contract) fun advanceRound(circleId: UInt64, newRound: UInt64) {
        if var circle = self.circles[circleId] {
            circle.currentRound = newRound
            circle.contributedThisRound = {}
            if newRound >= UInt64(circle.members.length) {
                circle.isComplete = true
            }
            self.circles[circleId] = circle
        }
    }

    // ── Public read ───────────────────────────────────────────────────────
    access(all) fun getCircle(id: UInt64): CircleInfo? {
        return self.circles[id]
    }

    access(all) fun getCircleCount(): UInt64 {
        return self.nextCircleId
    }

    // ── Init ──────────────────────────────────────────────────────────────
    init() {
        self.nextCircleId = 0
        self.circles = {}
        self.AdminStoragePath = /storage/coopwiseAdmin

        self.account.storage.save(<- create Admin(), to: self.AdminStoragePath)
    }
}