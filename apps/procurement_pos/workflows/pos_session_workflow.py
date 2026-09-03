import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.procurement_pos.models.pos import POSSession

logger = logging.getLogger(__name__)


class POSSessionWorkflow:
    """
    Workflow State Machine & Shift Reconciliation for POS Sessions.
    """

    @classmethod
    @transaction.atomic
    def open_session(cls, register, cashier, opening_balance: Decimal) -> POSSession:
        active_session = POSSession.objects.filter(
            register=register,
            cashier=cashier,
            status=POSSession.SessionStatus.OPEN
        ).first()

        if active_session:
            raise ValidationError(f"Cashier {cashier.username} already has an OPEN session #{active_session.id} on register {register.name}.")

        session = POSSession.objects.create(
            register=register,
            cashier=cashier,
            opening_balance=opening_balance,
            status=POSSession.SessionStatus.OPEN,
            opened_at=timezone.now(),
        )
        logger.info(f"POS Session #{session.id} opened for cashier {cashier.username}")
        return session

    @classmethod
    @transaction.atomic
    def close_and_reconcile(cls, session_id: str, closing_balance: Decimal, user) -> POSSession:
        session = POSSession.objects.select_for_update().get(pk=session_id)
        if session.status != POSSession.SessionStatus.OPEN:
            raise ValidationError(f"Cannot close session in state {session.status}. Must be OPEN.")

        session.closing_balance = closing_balance
        session.closed_at = timezone.now()
        session.status = POSSession.SessionStatus.RECONCILED
        session.save(update_fields=["closing_balance", "closed_at", "status", "updated_at"])

        logger.info(f"POS Session #{session.id} closed and reconciled by user {user.id}")
        return session
