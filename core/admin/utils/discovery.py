import os
import importlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def auto_discovery_apps(exclude=None):
    """
    Dynamically discover Django apps in the project root.
    Automatically excludes:
      - core (developer app)
      - directories containing a `.disable` file
      - system folders (venv, static, etc.)
    """

    if exclude is None:
        exclude = [
            '__pycache__',
            'venv',
            'env',
            'static',
            'templates',
            'media',
            'tests',
            'common',
            'config',
            'migrations',
            'backend',
            'apps',
        ]

    apps = []
    project_root = BASE_DIR

    # Scan multiple directories for apps
    for base_folder in ['apps', 'core']:
        scan_dir = os.path.join(project_root, base_folder)
        if not os.path.exists(scan_dir):
            continue
            
        for entry in os.listdir(scan_dir):
            path = os.path.join(scan_dir, entry)
            # Skip non-directories, __pycache__, and hidden folders
            if not os.path.isdir(path) or entry.startswith('.') or entry == '__pycache__':
                continue
            
            # Skip disabled apps (presence of `.disable` file)
            if os.path.exists(os.path.join(path, ".disable")):
                continue
            
            # Use dot notation for the app path
            app_dot_path = f"{base_folder}.{entry}"
            
            # Apps must have __init__.py and apps.py
            if os.path.exists(os.path.join(path, '__init__.py')) and os.path.exists(os.path.join(path, 'apps.py')):
                try:
                    importlib.import_module(f"{app_dot_path}.apps")
                    apps.append(app_dot_path)
                except ImportError:
                    pass

    return apps
