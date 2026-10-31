from __future__ import annotations

from collections import defaultdict, deque
from collections.abc import Sequence

from core.base_models.seed_data.engine.base import BaseSeedModule


class SeedDependencyError(Exception):
    """Base exception for seed engine dependency resolution errors."""

    pass


class CircularDependencyError(SeedDependencyError):
    """Raised when a cycle is detected in the seed module dependency DAG."""

    pass


class MissingDependencyError(SeedDependencyError):
    """Raised when a seed module references an unregistered or disabled dependency."""

    pass


class DependencyResolver:
    """
    Topological Dependency Resolver using Directed Acyclic Graphs (DAG).
    Ensures seed modules execute in strict topological dependency order.
    """

    @classmethod
    def resolve(
        cls,
        available_modules: Sequence[BaseSeedModule],
        target_names: Sequence[str] | None = None,
        target_sections: Sequence[str] | None = None,
    ) -> list[BaseSeedModule]:
        module_map: dict[str, BaseSeedModule] = {m.name: m for m in available_modules}

        # 1. Check for missing dependencies across registered modules
        for mod in available_modules:
            for dep in mod.depends_on:
                if dep not in module_map:
                    raise MissingDependencyError(
                        f"Module '{mod.name}' depends on '{dep}', which is not registered or available."
                    )

        # 2. Determine target active set (with upstream closure)
        if target_names or target_sections:
            required_names: set[str] = set()

            # Seed initial targets
            for mod in available_modules:
                if target_names and mod.name in target_names:
                    required_names.add(mod.name)
                elif target_sections and mod.section in target_sections:
                    required_names.add(mod.name)

            if not required_names:
                return []

            # Recursively collect all upstream prerequisites
            queue = deque(required_names)
            while queue:
                current = queue.popleft()
                current_mod = module_map[current]
                for dep in current_mod.depends_on:
                    if dep not in required_names:
                        required_names.add(dep)
                        queue.append(dep)

            active_modules = [m for m in available_modules if m.name in required_names]
        else:
            active_modules = list(available_modules)

        # 3. Build Adjacency Graph and in-degree counts (Kahn's Algorithm)
        # Edge: dep -> mod (meaning 'dep' must execute before 'mod')
        adj: dict[str, list[str]] = defaultdict(list)
        in_degree: dict[str, int] = {m.name: 0 for m in active_modules}
        active_set = {m.name for m in active_modules}

        for m in active_modules:
            for dep in m.depends_on:
                if dep in active_set:
                    adj[dep].append(m.name)
                    in_degree[m.name] += 1

        # Queue nodes with in_degree == 0
        ready_queue = deque([name for name, deg in in_degree.items() if deg == 0])
        ordered_names: list[str] = []

        while ready_queue:
            u = ready_queue.popleft()
            ordered_names.append(u)

            for v in adj[u]:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    ready_queue.append(v)

        # 4. Cycle detection
        if len(ordered_names) != len(active_modules):
            unresolved = [name for name, deg in in_degree.items() if deg > 0]
            cycle_path = cls._find_cycle(unresolved, adj)
            raise CircularDependencyError(
                f"Circular dependency detected in seed modules: {' -> '.join(cycle_path)}"
            )

        return [module_map[name] for name in ordered_names]

    @classmethod
    def _find_cycle(cls, unresolved: list[str], adj: dict[str, list[str]]) -> list[str]:
        """DFS to trace an exact cycle path for clear error diagnosis."""
        visited: dict[str, int] = {}  # 0: unvisited, 1: visiting, 2: visited
        parent: dict[str, str | None] = {}
        cycle: list[str] = []

        def dfs(node: str) -> bool:
            visited[node] = 1
            for neighbor in adj.get(node, []):
                if neighbor not in unresolved:
                    continue
                if visited.get(neighbor, 0) == 1:
                    # Found cycle
                    curr = node
                    cycle.append(neighbor)
                    while curr != neighbor:
                        cycle.append(curr)
                        curr = parent.get(curr, neighbor)
                    cycle.append(neighbor)
                    cycle.reverse()
                    return True
                elif visited.get(neighbor, 0) == 0:
                    parent[neighbor] = node
                    if dfs(neighbor):
                        return True
            visited[node] = 2
            return False

        for node in unresolved:
            if visited.get(node, 0) == 0:
                parent[node] = None
                if dfs(node):
                    return cycle
        return unresolved
