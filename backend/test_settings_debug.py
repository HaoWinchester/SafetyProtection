#!/usr/bin/env python3
"""Debug script for settings API"""
import sys
sys.path.insert(0, '/Users/menghao/Documents/幻谱/大模型安全检测工具/SafetyProtection/backend')

try:
    import db_operations as db

    print("Testing get_all_settings_from_db...")
    settings = db.get_all_settings_from_db(public_only=False)

    print(f"✓ Retrieved {len(settings)} settings")

    # Check user settings
    print("\nUser settings:")
    for key in sorted(settings.keys()):
        if 'user_001' in key:
            print(f"  {key:50} = {settings[key]} (type: {type(settings[key]).__name__})")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
