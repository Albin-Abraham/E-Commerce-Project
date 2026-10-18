# apps/payments/health/circuit_breaker.py
"""
Circuit Breaker Pattern for payment gateway resilience.
Protects application workflows from cascading failures when upstream gateways experience downtime.
"""

import time
import logging
import threading

logger = logging.getLogger(__name__)


class CircuitState:
    CLOSED = "CLOSED"      # Normal operation: requests pass through
    OPEN = "OPEN"          # Outage tripped: fast fail without calling gateway
    HALF_OPEN = "HALF_OPEN"  # Testing recovery: limited probe requests allowed


class GatewayCircuitBreaker:
    """
    In-memory / runtime circuit breaker for payment gateways.
    Thread-safe and resistant to thundering herd problems during outages.
    """

    _lock = threading.Lock()
    _states: dict[str, str] = {}
    _failure_counts: dict[str, int] = {}
    _success_counts: dict[str, int] = {}
    _last_state_change: dict[str, float] = {}

    FAILURE_THRESHOLD = 5       # Consecutive failures to trip circuit
    RECOVERY_TIMEOUT = 60.0    # Seconds to remain in OPEN before probing
    SUCCESS_THRESHOLD = 2       # Successes required in HALF_OPEN to close circuit

    @classmethod
    def get_state(cls, gateway_type: str) -> str:
        """Returns the current circuit state for the gateway."""
        cleaned = gateway_type.strip().upper()
        with cls._lock:
            state = cls._states.get(cleaned, CircuitState.CLOSED)
            if state == CircuitState.OPEN:
                last_change = cls._last_state_change.get(cleaned, 0.0)
                if (time.time() - last_change) >= cls.RECOVERY_TIMEOUT:
                    cls._states[cleaned] = CircuitState.HALF_OPEN
                    cls._success_counts[cleaned] = 0
                    logger.info(f"Circuit for '{cleaned}' transitioned to HALF_OPEN (probing recovery)")
                    return CircuitState.HALF_OPEN
            return state

    @classmethod
    def can_execute(cls, gateway_type: str) -> bool:
        """
        Determines whether an outbound transaction or probe is permitted to execute.
        Returns False if the circuit is OPEN.
        """
        state = cls.get_state(gateway_type)
        return state in (CircuitState.CLOSED, CircuitState.HALF_OPEN)

    @classmethod
    def record_success(cls, gateway_type: str):
        """Records a successful operation through the gateway."""
        cleaned = gateway_type.strip().upper()
        with cls._lock:
            state = cls._states.get(cleaned, CircuitState.CLOSED)
            if state == CircuitState.HALF_OPEN:
                cls._success_counts[cleaned] = cls._success_counts.get(cleaned, 0) + 1
                if cls._success_counts[cleaned] >= cls.SUCCESS_THRESHOLD:
                    cls._states[cleaned] = CircuitState.CLOSED
                    cls._failure_counts[cleaned] = 0
                    cls._success_counts[cleaned] = 0
                    cls._last_state_change[cleaned] = time.time()
                    logger.info(f"Circuit for '{cleaned}' successfully recovered to CLOSED")
            elif state == CircuitState.CLOSED:
                cls._failure_counts[cleaned] = 0

    @classmethod
    def record_failure(cls, gateway_type: str):
        """Records a failed operation through the gateway."""
        cleaned = gateway_type.strip().upper()
        with cls._lock:
            state = cls._states.get(cleaned, CircuitState.CLOSED)
            if state == CircuitState.HALF_OPEN:
                cls._states[cleaned] = CircuitState.OPEN
                cls._last_state_change[cleaned] = time.time()
                logger.warning(f"Circuit for '{cleaned}' tripped back to OPEN after probe failure")
            elif state == CircuitState.CLOSED:
                count = cls._failure_counts.get(cleaned, 0) + 1
                cls._failure_counts[cleaned] = count
                if count >= cls.FAILURE_THRESHOLD:
                    cls._states[cleaned] = CircuitState.OPEN
                    cls._last_state_change[cleaned] = time.time()
                    logger.error(f"Circuit for '{cleaned}' tripped to OPEN after {count} consecutive failures")

    @classmethod
    def reset(cls, gateway_type: str | None = None):
        """Resets circuit breaker state (useful for tests or administrator overrides)."""
        with cls._lock:
            if gateway_type:
                cleaned = gateway_type.strip().upper()
                cls._states[cleaned] = CircuitState.CLOSED
                cls._failure_counts[cleaned] = 0
                cls._success_counts[cleaned] = 0
                cls._last_state_change[cleaned] = time.time()
            else:
                cls._states.clear()
                cls._failure_counts.clear()
                cls._success_counts.clear()
                cls._last_state_change.clear()
