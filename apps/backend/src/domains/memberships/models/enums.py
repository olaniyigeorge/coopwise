from enum import Enum




# Enum for Membership role
class MembershipRole(str, Enum):
    admin = "admin"
    member = "member"


# Enum for Membership status
class MembershipStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LEFT = "left"
    REMOVED = "removed"


class InvitationStatus(str, Enum):
    CLICKED = "clicked"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
