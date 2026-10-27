#!/usr/bin/env python3
"""
ZenOS Quality Orchestrator (check.py)

Coordinates formatting, linting, architectural integrity, clean code rules,
and test execution according to the profiles declared in
config/engineering/quality/quality.yaml.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = REPO_ROOT / "config" / "engineering" / "quality" / "quality.yaml"


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def load_config() -> dict:
    if not CONFIG_PATH.is_file():
        print(f"Error: Configuration file not found at {CONFIG_PATH}", file=sys.stderr)
        sys.exit(1)

    if yaml is not None:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            return yaml.safe_load(f)
    else:
        # Fallback simple parser for essential dictionary
        print("Warning: PyYAML not found; using fallback configuration.", file=sys.stderr)
        return {}


def resolve_profile_steps(config: dict, profile_name: str, visited: set | None = None) -> list[str]:
    if visited is None:
        visited = set()

    profiles = config.get("profiles", {})
    if profile_name not in profiles:
        # Check if profile_name is directly a check ID
        if profile_name in config.get("checks", {}):
            return [profile_name]
        print(
            f"Error: Unknown profile or check '{profile_name}'. Available profiles: {list(profiles.keys())}",
            file=sys.stderr,
        )
        sys.exit(1)

    if profile_name in visited:
        print(f"Error: Circular inheritance detected in profile '{profile_name}'", file=sys.stderr)
        sys.exit(1)

    visited.add(profile_name)
    prof_data = profiles[profile_name]
    steps: list[str] = []

    for inherited in prof_data.get("inherits", []):
        for s in resolve_profile_steps(config, inherited, visited.copy()):
            if s not in steps:
                steps.append(s)

    for s in prof_data.get("steps", []):
        if s not in steps:
            steps.append(s)

    return steps


def run_step(
    step_id: str, step_def: dict, auto_fix: bool, verbose: bool, default_timeout: int = 60
) -> tuple[bool, float, str]:
    raw_cmd = step_def.get("fix_command" if auto_fix and "fix_command" in step_def else "command")
    if not raw_cmd:
        return False, 0.0, f"No command defined for {step_id}"

    cmd = list(raw_cmd)
    env = os.environ.copy()
    venv_bin = Path(sys.executable).parent
    env["PATH"] = f"{venv_bin}:{env.get('PATH', '')}"

    # If first token is python, use current sys.executable
    if cmd[0] == "python":
        cmd[0] = sys.executable
    elif (venv_bin / cmd[0]).is_file():
        cmd[0] = str(venv_bin / cmd[0])

    timeout_seconds = step_def.get("timeout_seconds", default_timeout)
    start_time = time.perf_counter()
    try:
        res = subprocess.run(
            cmd,
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
            timeout=timeout_seconds,
        )
        duration = time.perf_counter() - start_time
        success = res.returncode == 0
        output = res.stdout.strip() if res.stdout else ""
    except subprocess.TimeoutExpired as te:
        duration = time.perf_counter() - start_time
        success = False
        output = (
            f"TIMEOUT EXCEEDED: Step '{step_def.get('name', step_id)}' hung and was aborted "
            f"after exceeding limit of {timeout_seconds}s.\n"
            f"Partial output:\n{te.stdout or '(none)'}"
        )
    except Exception as e:
        duration = time.perf_counter() - start_time
        success = False
        output = f"Execution error running {cmd}: {e}"

    return success, duration, output


def format_report_console(profile: str, results: list[dict], total_duration: float) -> str:
    lines = [
        f"{Colors.BOLD}{Colors.CYAN}============================================================{Colors.RESET}",
        f"{Colors.BOLD}{Colors.CYAN}                 ZENOS CODE QUALITY REPORT                  {Colors.RESET}",
        f"{Colors.BOLD}{Colors.CYAN}============================================================{Colors.RESET}",
        f"Profile: {Colors.BOLD}{profile}{Colors.RESET} | Working Dir: {REPO_ROOT.name}",
        "------------------------------------------------------------",
    ]

    all_passed = True
    for r in results:
        status_color = Colors.GREEN if r["passed"] else Colors.RED
        status_label = "[PASS]" if r["passed"] else "[FAIL]"
        lines.append(
            f"{status_color}{status_label}{Colors.RESET} {r['name']:<40} ({r['duration']:.2f}s)"
        )
        if not r["passed"]:
            all_passed = False

    lines.append("------------------------------------------------------------")
    if all_passed:
        lines.append(
            f"{Colors.GREEN}{Colors.BOLD}Result: ALL CHECKS PASSED (Total: {total_duration:.2f}s){Colors.RESET}"
        )
    else:
        lines.append(
            f"{Colors.RED}{Colors.BOLD}Result: ONE OR MORE CHECKS FAILED (Total: {total_duration:.2f}s){Colors.RESET}"
        )
    lines.append(
        f"{Colors.BOLD}{Colors.CYAN}============================================================{Colors.RESET}"
    )
    return "\n".join(lines)


def format_report_markdown(profile: str, results: list[dict], total_duration: float) -> str:
    all_passed = all(r["passed"] for r in results)
    overall_badge = "✅ **PASS**" if all_passed else "❌ **MERGE BLOCKED / FAIL**"

    lines = [
        "## 🛡️ ZenOS Code Quality Report",
        f"**Profile:** `{profile}` | **Status:** {overall_badge} | **Duration:** {total_duration:.2f}s",
        "",
        "| Gate / Check | Module | Status | Duration |",
        "|---|---|:---:|---:|",
    ]

    for r in results:
        status_icon = "✅ PASS" if r["passed"] else "❌ FAIL"
        lines.append(f"| {r['name']} | `{r['module']}` | {status_icon} | {r['duration']:.2f}s |")

    failed = [r for r in results if not r["passed"]]
    if failed:
        lines.append("")
        lines.append("### ⚠️ Violations & Error Output")
        for f in failed:
            lines.append(f"<details><summary><b>{f['name']} ({f['id']})</b></summary>")
            lines.append("")
            lines.append("```text")
            lines.append(f["output"])
            lines.append("```")
            lines.append("</details>")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="ZenOS Quality Orchestrator")
    parser.add_argument(
        "profile",
        nargs="?",
        default="fast",
        help="Profile or check name to run (fast, pre_commit, ci, full)",
    )
    parser.add_argument(
        "--fix", action="store_true", help="Automatically fix issues where supported"
    )
    parser.add_argument("--verbose", action="store_true", help="Print verbose execution outputs")
    parser.add_argument("--json", action="store_true", help="Emit results as JSON")
    parser.add_argument("--markdown", action="store_true", help="Emit results as Markdown")

    args = parser.parse_args()
    config = load_config()

    steps = resolve_profile_steps(config, args.profile)
    checks_def = config.get("checks", {})

    results = []
    start_total = time.perf_counter()

    default_timeout = config.get("policy", {}).get("default_timeout_seconds", 60)

    for step_id in steps:
        step_def = checks_def.get(
            step_id,
            {
                "name": step_id,
                "module": "custom",
                "command": [step_id],
            },
        )

        if args.verbose:
            print(f"Running {step_def.get('name', step_id)}...")

        passed, duration, output = run_step(
            step_id, step_def, args.fix, args.verbose, default_timeout=default_timeout
        )
        results.append(
            {
                "id": step_id,
                "name": step_def.get("name", step_id),
                "module": step_def.get("module", "unknown"),
                "passed": passed,
                "duration": duration,
                "output": output,
            }
        )

        if not passed and not args.json and not args.markdown:
            print(
                f"\n{Colors.RED}------------------------------------------------------------{Colors.RESET}"
            )
            print(
                f"{Colors.RED}{Colors.BOLD}Failure in: {step_def.get('name', step_id)}{Colors.RESET}"
            )
            print(
                f"{Colors.RED}------------------------------------------------------------{Colors.RESET}"
            )
            print(output)
            print(
                f"{Colors.RED}------------------------------------------------------------\n{Colors.RESET}"
            )

        if not passed and config.get("policy", {}).get("fail_fast", False):
            break

    total_duration = time.perf_counter() - start_total

    # Emit output
    if args.json:
        print(
            json.dumps(
                {
                    "profile": args.profile,
                    "passed": all(r["passed"] for r in results),
                    "total_duration": total_duration,
                    "results": results,
                },
                indent=2,
            )
        )
    elif args.markdown:
        print(format_report_markdown(args.profile, results, total_duration))
    else:
        print(format_report_console(args.profile, results, total_duration))

    # Append to GitHub step summary if running in GHA
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path and os.path.exists(os.path.dirname(summary_path)):
        try:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(format_report_markdown(args.profile, results, total_duration) + "\n\n")
        except Exception as e:
            if args.verbose:
                print(f"Notice: Could not write GITHUB_STEP_SUMMARY: {e}", file=sys.stderr)

    sys.exit(0 if all(r["passed"] for r in results) else 1)


if __name__ == "__main__":
    main()
