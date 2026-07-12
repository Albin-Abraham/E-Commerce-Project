#!/bin/bash
# setup_venv.sh
# Sets up a local virtual environment to help IDEs resolve Django and other dependencies.

echo "Creating virtual environment..."
python3 -m venv venv

echo "Installing requirements..."
./venv/bin/pip install -r requirements.txt

echo "Setup complete! Please configure your IDE to use the interpreter at: $(pwd)/venv/bin/python"
