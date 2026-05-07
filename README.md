```markdown
# Getting Started - Django Project

## Prerequisites
- Python 3.8 or higher installed
- Git (optional, for cloning repositories)
- pip (Python package manager)

## Setup Instructions

### 1. Clone the Repository (if applicable)
```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Create a Virtual Environment

**Windows:**
```bash
python -m venv venv
```

**Linux:**
```bash
python3 -m venv venv
```

### 3. Activate Virtual Environment

**Windows (Command Prompt):**
```bash
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate
```

**Linux:**
```bash
source venv/bin/activate
```

> **Note:** When activated, you'll see `(venv)` appear at the beginning of your terminal prompt.

### 4. Install Django and Dependencies

```bash
pip install -r requirements.txt
```

*If `requirements.txt` doesn't exist, install Django manually:*
```bash
pip install django
pip freeze > requirements.txt
```

### 5. Run Database Migrations

```bash
python manage.py migrate
```

### 6. Create a Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 7. Run the Development Server

```bash
python manage.py runserver
```

The server will start at `http://127.0.0.1:8000/`

### 8. Deactivate Virtual Environment (when done)

**Windows & Linux:**
```bash
deactivate
```

## Common Django Commands

| Command | Description |
|---------|-------------|
| `python manage.py runserver` | Start development server |
| `python manage.py makemigrations` | Create new migrations |
| `python manage.py migrate` | Apply migrations |
| `python manage.py createsuperuser` | Create admin user |
| `python manage.py shell` | Open Django shell |
| `python manage.py collectstatic` | Collect static files |
| `python manage.py test` | Run tests |

## Troubleshooting

**Permission Issues (Linux/Mac):**
```bash
chmod +x venv/bin/activate
```

**PowerShell Execution Policy (Windows):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Port already in use:**
```bash
python manage.py runserver 8001
```

**Database issues:**
```bash
python manage.py migrate --run-syncdb
```

## Quick Reference Commands

| Operation | Windows | Linux |
|-----------|---------|-------|
| Create venv | `python -m venv venv` | `python3 -m venv venv` |
| Activate | `venv\Scripts\activate` | `source venv/bin/activate` |
| Deactivate | `deactivate` | `deactivate` |
| Install Django | `pip install django` | `pip install django` |
| Run server | `python manage.py runserver` | `python manage.py runserver` |

## Example: Complete Setup Script

**Windows (setup.bat):**
```batch
@echo off
python -m venv venv
call venv\Scripts\activate.bat
pip install django
python manage.py migrate
echo Setup complete! Run 'python manage.py runserver' to start.
```

**Linux (setup.sh):**
```bash
#!/bin/bash
python3 -m venv venv
source venv/bin/activate
pip install django
python manage.py migrate
echo "Setup complete! Run 'python manage.py runserver' to start."
```

## Verify Installation

```bash
python --version
pip --version
django-admin --version
python -c "import django; print(django.get_version())"
```

## Project Structure

```
myproject/
├── manage.py
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── venv/
└── requirements.txt
```

## Next Steps

1. Visit `http://127.0.0.1:8000/admin` to access admin panel
2. Create your first Django app: `python manage.py startapp myapp`
3. Update `settings.py` to add your app
4. Define models, views, and URLs
