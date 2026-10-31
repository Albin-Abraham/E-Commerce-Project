# core/authorization/policy_engine.py
import logging

from core.authorization.exceptions import AuthorizationDeniedError
from core.authorization.registries import PolicyRegistry
from core.context.object_context import ObjectContext
from core.context.request_context import RequestContext

logger = logging.getLogger("platform.authorization")


class PolicyEngine:
    """
    Central Authorization Evaluator.
    Compares caller RequestContext with target ObjectContext using registered policies.
    """

    @classmethod
    def evaluate(
        cls,
        action: str,
        request_context: RequestContext,
        object_context: ObjectContext,
    ) -> bool:
        """Evaluates whether the requested action is permitted."""
        policy = PolicyRegistry.resolve(
            resource_type=object_context.resource_type,
            persona=request_context.persona,
        )

        if not policy:
            logger.warning(
                f"No policy registered for resource '{object_context.resource_type}' "
                f"and persona '{request_context.persona}'. Denying by default."
            )
            return False

        allowed = policy.can_perform(action, request_context, object_context)
        if not allowed:
            logger.info(
                f"Policy denied action '{action}' on '{object_context.resource_type}:{object_context.resource_id}' "
                f"for user '{request_context.user_id}' with persona '{request_context.persona}'."
            )
        return allowed

    @classmethod
    def authorize(
        cls,
        action: str,
        request_context: RequestContext,
        object_context: ObjectContext,
    ) -> None:
        """
        Authorizes an action.
        Raises AuthorizationDeniedError if policy evaluation fails.
        """
        if not cls.evaluate(action, request_context, object_context):
            raise AuthorizationDeniedError(
                f"Action '{action}' on '{object_context.resource_type}:{object_context.resource_id}' "
                f"is denied for persona '{request_context.persona}'."
            )
