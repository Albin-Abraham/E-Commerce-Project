import subprocess
import os
import json
import re
import sys
from django.utils import timezone
from core.admin.models import TestRun
from django.conf import settings

class TestRunnerService:
    """
    Service to orchestrate pytest execution and result parsing.
    """
    
    @staticmethod
    def run_suite(module='all', category='all', test_run_id=None):
        """
        Execute pytest for a given module/category and update the TestRun record.
        """
        if test_run_id:
            run = TestRun.objects.get(id=test_run_id)
        else:
            run = TestRun.objects.create(module=module, category=category, status='running')
        
        run.status = 'running'
        run.started_at = timezone.now()
        run.save()

        # Build pytest command
        cmd = [sys.executable, "-m", "pytest"]
        
        if module != 'all':
            # Check if the module is in apps/ or core/
            apps_path = os.path.join(settings.BASE_DIR, "apps", module)
            core_path = os.path.join(settings.BASE_DIR, "core", module.replace("core_", ""))
            
            if os.path.exists(apps_path):
                cmd.append(f"apps/{module}")
            elif os.path.exists(core_path):
                cmd.append(f"core/{module.replace('core_', '')}")
            else:
                # Fallback to current behavior but log error or try literal
                cmd.append(f"apps/{module}")
        
        if category != 'all':
            cmd.extend(["-m", category])
            
        # Add common flags
        cmd.extend(["--verbose", "--capture=no"])
        
        # Environment setup
        env = os.environ.copy()
        env["PYTHONPATH"] = "."
        # Ensure we use test database settings if needed, 
        # but here we rely on the django-pytest plugin handling
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                env=env,
                cwd=settings.BASE_DIR
            )
            
            logs = []
            stdout = process.stdout
            if stdout:
                for line in iter(stdout.readline, ""):
                    logs.append(line)
                    # In a real scenario, we might want to stream this to a websocket
                stdout.close()
            
            return_code = process.wait()
            
            run.logs = "".join(logs)
            run.completed_at = timezone.now()
            
            if return_code == 0:
                run.status = 'passed'
            else:
                run.status = 'failed'
                
            # Parse summary from logs
            run.summary = TestRunnerService._parse_summary(run.logs)
            run.save()
            
            return run
            
        except Exception as e:
            run.status = 'error'
            run.logs = str(e)
            run.completed_at = timezone.now()
            run.save()
            return run

    @staticmethod
    def _parse_summary(logs):
        """
        Extract pass/fail counts from pytest terminal output.
        Example: "10 passed, 2 failed in 5.42s"
        """
        summary = {"passed": 0, "failed": 0, "total": 0}
        
        # Look for the summary line at the end
        match = re.search(r"==+ (.*) ==+", logs)
        if not match:
            return summary
            
        text = match.group(1)
        
        passed = re.search(r"(\d+) passed", text)
        failed = re.search(r"(\d+) failed", text)
        errors = re.search(r"(\d+) error", text)
        skipped = re.search(r"(\d+) skipped", text)
        
        summary["passed"] = int(passed.group(1)) if passed else 0
        summary["failed"] = (int(failed.group(1)) if failed else 0) + (int(errors.group(1)) if errors else 0)
        summary["skipped"] = int(skipped.group(1)) if skipped else 0
        summary["total"] = summary["passed"] + summary["failed"] + summary["skipped"]
        
        return summary
