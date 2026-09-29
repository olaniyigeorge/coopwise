from decimal import Decimal
from uuid import uuid4

import pytest

from src.domains.analytics.models import ActivityLog, ActivityType
from src.domains.analytics.service import ActivityService
from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.users.exceptions import UserNotFoundError
from src.domains.users.public_profile import get_public_profile
from tests.test_contribution_service import (
    _make_cooperative,
    _make_membership,
    _make_user,
)


@pytest.mark.asyncio
async def test_public_profile_shows_trust_signals_only(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    db_session.add_all(
        [
            Contribution(
                user_id=user.id,
                group_id=coop.id,
                amount=Decimal("1000"),
                status=status,
            )
            for status in (
                ContributionStatus.completed,
                ContributionStatus.completed,
                ContributionStatus.failed,
            )
        ]
    )
    await db_session.flush()

    profile = await get_public_profile(db_session, user.id)

    assert profile.id == user.id
    assert profile.active_groups_count == 1
    assert profile.completed_contributions_count == 2
    # private fields never appear on the public schema
    exposed = set(profile.model_dump())
    assert not exposed & {"email", "phone_number", "target_savings_amount"}


@pytest.mark.asyncio
async def test_public_profile_unknown_user(db_session):
    with pytest.raises(UserNotFoundError):
        await get_public_profile(db_session, uuid4())


@pytest.mark.asyncio
async def test_group_activities_include_actor(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    db_session.add(
        ActivityLog(
            user_id=user.id,
            group_id=coop.id,
            type=ActivityType.made_contribution,
            description="Contributed NGN 4500.00 to the group",
            amount=4500.0,
        )
    )
    await db_session.flush()

    activities = await ActivityService.get_group_activities(
        db_session, coop.id, user, None
    )

    assert len(activities) == 1
    assert activities[0].actor.id == user.id
    assert activities[0].actor.full_name == "Test Contributor"


@pytest.mark.asyncio
async def test_cooperative_preview_shows_terms_and_headcount_only(db_session):
    from src.domains.cooperatives.models.enums import ContributionFrequency
    from src.domains.cooperatives.preview import get_cooperative_preview
    from tests.test_contribution_service import _make_financial_rule

    member = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, member.id, coop.id)
    await _make_financial_rule(
        db_session,
        coop.id,
        amount=Decimal("2500"),
        frequency=ContributionFrequency.WEEKLY,
    )

    preview = await get_cooperative_preview(db_session, coop.id)

    assert preview.name == "Test Coop"
    assert preview.member_count == 1
    assert preview.contribution_amount == 2500.0
    assert preview.contribution_currency == "NGN"
    assert preview.contribution_frequency == "weekly"
    assert preview.organizer is not None and preview.organizer.full_name == "Creator"
    assert preview.requires_approval is False
    # no member roster or money totals on the preview
    assert not set(preview.model_dump()) & {"members", "total_contributed", "balance"}


@pytest.mark.asyncio
async def test_cooperative_preview_without_rules_and_unknown_coop(db_session):
    from src.domains.cooperatives.exceptions import CooperativeNotFoundError
    from src.domains.cooperatives.preview import get_cooperative_preview

    coop = await _make_cooperative(db_session)
    preview = await get_cooperative_preview(db_session, coop.id)
    assert preview.contribution_amount is None and preview.max_members is None

    with pytest.raises(CooperativeNotFoundError):
        await get_cooperative_preview(db_session, uuid4())
