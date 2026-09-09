#!/usr/bin/env python3
"""
send_birthday_wish.py — Send birthday or anniversary greetings directly on WhatsApp.

Usage examples:
  # 1. Send directly to a phone number:
  python send_birthday_wish.py --phone 9876543210 --name "Rahul Sharma" --store "Metro Fashion"

  # 2. Send with custom message:
  python send_birthday_wish.py --phone 9876543210 --message "Happy Birthday Rahul! Enjoy 20% off today!"

  # 3. Look up a member by ID in database and send:
  python send_birthday_wish.py --member-id mem-001

  # 4. Automatically find and wish all members celebrating their birthday TODAY:
  python send_birthday_wish.py --today

  # 5. Open WhatsApp Web directly in your browser:
  python send_birthday_wish.py --phone 9876543210 --name "Priya" --browser
"""
import os
import sys
from pathlib import Path

# Ensure console supports UTF-8 on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Forward to backend/scripts/send_birthday_wish.py
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

script_path = backend_dir / "scripts" / "send_birthday_wish.py"
if script_path.exists():
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()
    exec(code)
else:
    print(f"Error: Could not locate {script_path}")
