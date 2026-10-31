from __future__ import annotations

from core.base_models.seed_data.engine.runner import DomainRunner


class SeedDomainRegistry:
    """
    Pluggable registry for domain seed runners.
    """

    _runners: dict[str, type[DomainRunner]] = {}

    @classmethod
    def register(cls, domain_code: str, runner_cls: type[DomainRunner]) -> None:
        cls._runners[domain_code.lower()] = runner_cls

    @classmethod
    def get_runner(cls, domain_code: str, config_root: str | None = None) -> DomainRunner:
        runner_cls = cls._runners.get(domain_code.lower())
        if not runner_cls:
            raise KeyError(
                f"Domain '{domain_code}' is not registered in SeedDomainRegistry. "
                f"Available domains: {list(cls._runners.keys())}"
            )
        return runner_cls(config_root=config_root)

    @classmethod
    def list_domains(cls) -> list[str]:
        return list(cls._runners.keys())
