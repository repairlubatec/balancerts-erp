#!/usr/bin/env python3
"""
Validate PGC Chart of Accounts structure
"""

import json
from collections import Counter

def validate():
    print("=== PGC Chart of Accounts Validation ===\n")
    
    # Load hierarchical JSON
    with open("pgc_chart_of_accounts.json", "r", encoding="utf-8") as f:
        hierarchical = json.load(f)
    
    # Load flat JSON
    with open("pgc_chart_of_accounts_flat.json", "r", encoding="utf-8") as f:
        flat = json.load(f)
    
    issues = []
    
    # 1. Check all 9 classes present
    print("✓ Checking classes...")
    if len(hierarchical["classes"]) != 9:
        issues.append(f"Expected 9 classes, found {len(hierarchical['classes'])}")
    else:
        class_codes = [c["code"] for c in hierarchical["classes"]]
        expected = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
        if class_codes != expected:
            issues.append(f"Class codes mismatch: {class_codes} vs {expected}")
        else:
            print(f"  ✓ All 9 classes present (1-9)")
    
    # 2. Check for duplicate codes
    print("✓ Checking for duplicate codes...")
    all_codes = []
    
    def collect_codes(accounts):
        for account in accounts:
            all_codes.append(account["code"])
            if "children" in account:
                collect_codes(account["children"])
    
    for class_data in hierarchical["classes"]:
        all_codes.append(class_data["code"])
        collect_codes(class_data["accounts"])
    
    duplicates = [code for code, count in Counter(all_codes).items() if count > 1]
    if duplicates:
        issues.append(f"Duplicate codes found: {duplicates}")
    else:
        print(f"  ✓ No duplicates ({len(all_codes)} unique codes)")
    
    # 3. Verify numerical sequence
    print("✓ Checking numerical sequence...")
    sequence_issues = []
    
    def check_sequence(accounts, parent_code="", is_class_level=False):
        for i, account in enumerate(accounts):
            code = account["code"]
            parts = code.split(".")
            
            # Check that code starts with parent
            if parent_code and not is_class_level:
                # For sub-accounts, they should start with parent code + "."
                if not code.startswith(parent_code + "."):
                    sequence_issues.append(f"Code {code} doesn't match parent {parent_code}")
            elif parent_code and is_class_level:
                # For main accounts under a class, they should start with class digit
                if not code.startswith(parent_code):
                    sequence_issues.append(f"Account {code} doesn't belong to class {parent_code}")
            
            if "children" in account:
                check_sequence(account["children"], code, is_class_level=False)
    
    for class_data in hierarchical["classes"]:
        check_sequence(class_data["accounts"], class_data["code"], is_class_level=True)
    
    if sequence_issues:
        issues.extend(sequence_issues[:5])  # Show first 5
        if len(sequence_issues) > 5:
            issues.append(f"... and {len(sequence_issues) - 5} more sequence issues")
    else:
        print(f"  ✓ Numerical sequences valid")
    
    # 4. Verify parent-child relationships in flat file
    print("✓ Checking parent-child relationships...")
    flat_codes = {entry["code"]: entry for entry in flat}
    parent_issues = []
    
    for entry in flat:
        if entry["parent"]:
            if entry["parent"] not in flat_codes:
                parent_issues.append(f"Code {entry['code']} has invalid parent {entry['parent']}")
    
    if parent_issues:
        issues.extend(parent_issues[:5])
        if len(parent_issues) > 5:
            issues.append(f"... and {len(parent_issues) - 5} more parent issues")
    else:
        print(f"  ✓ All parent references valid")
    
    # 5. Check for required accounts (the ones identified as missing)
    print("✓ Checking for previously missing accounts...")
    required_accounts = ["11.3", "11.4", "11.5", "18.1.2"]
    missing_required = []
    
    for req_code in required_accounts:
        if req_code not in all_codes:
            missing_required.append(req_code)
    
    if missing_required:
        issues.append(f"Missing required accounts: {missing_required}")
    else:
        print(f"  ✓ All previously missing accounts now present")
        for code in required_accounts:
            account = next((e for e in flat if e["code"] == code), None)
            if account:
                print(f"    - {code}: {account['name']}")
    
    # 6. Verify Class 9 is marked as optional
    print("✓ Checking Class 9 (optional)...")
    class_9 = next((c for c in hierarchical["classes"] if c["code"] == "9"), None)
    if class_9:
        if not class_9.get("optional"):
            issues.append("Class 9 should be marked as optional")
        else:
            print(f"  ✓ Class 9 properly marked as optional")
            print(f"    Note: {class_9.get('note', 'N/A')}")
    else:
        issues.append("Class 9 not found")
    
    # 7. Check flat vs hierarchical count
    print("✓ Verifying flat vs hierarchical consistency...")
    hierarchical_count = len(all_codes)
    flat_count = len(flat)
    
    if hierarchical_count != flat_count:
        issues.append(f"Count mismatch: hierarchical={hierarchical_count}, flat={flat_count}")
    else:
        print(f"  ✓ Both structures have {hierarchical_count} entries")
    
    # 8. Summary statistics
    print("\n=== Statistics ===")
    print(f"Total entries: {len(all_codes)}")
    print(f"Classes: {len(hierarchical['classes'])}")
    
    for class_data in hierarchical["classes"]:
        class_code = class_data["code"]
        class_accounts = [c for c in all_codes if c.startswith(class_code) and c != class_code]
        optional = " (optional)" if class_data.get("optional") else ""
        print(f"  Class {class_code}: {len(class_accounts)} accounts{optional}")
    
    # Final result
    print("\n=== Validation Result ===")
    if issues:
        print(f"❌ FAILED with {len(issues)} issue(s):")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("✅ ALL CHECKS PASSED")
        print("\nThe PGC chart of accounts is:")
        print("  ✓ Complete with all 9 classes")
        print("  ✓ Free of duplicates")
        print("  ✓ Numerically consistent")
        print("  ✓ Properly structured (hierarchical & flat)")
        print("  ✓ Ready for accounting software integration")
        return True

if __name__ == "__main__":
    success = validate()
    exit(0 if success else 1)

