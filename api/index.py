"""
Vercel Serverless Function Entry Point
This file imports the FastAPI app from the parent directory
"""
import sys
from pathlib import Path

# Add parent directory to Python path
parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import the FastAPI app
from api import app

# Vercel will use this app object
handler = app
