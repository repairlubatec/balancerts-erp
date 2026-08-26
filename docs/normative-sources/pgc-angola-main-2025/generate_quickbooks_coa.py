#!/usr/bin/env python3
"""
Generate QuickBooks Online Chart of Accounts import CSV from PGC JSON.

This script reads the Angolan PGC (Plano Geral de Contabilidade) from pgc_2.json
and generates CSV files compatible with QuickBooks Online import.

Rules:
- If child has same 'type' as immediate parent: format as "ParentCode ParentName: ChildName"
- If child has different 'type' than parent: standalone account name only
- Account codes have dots removed (11.1.1 becomes 1111)

Output:
- quickbooks_coa_import.csv: All accounts
- quickbooks_coa_level_1.csv: Level 1 accounts (1-digit codes: Classes)
- quickbooks_coa_level_2.csv: Level 2 accounts (2-digit codes)
- quickbooks_coa_level_3.csv: Level 3 accounts (3-digit codes)
- quickbooks_coa_level_4.csv: Level 4 accounts (4-digit codes)
- quickbooks_coa_level_5.csv: Level 5 accounts (5-digit codes)
- quickbooks_coa_level_6.csv: Level 6 accounts (6+ digit codes)
"""

import json
import csv
from pathlib import Path
from collections import defaultdict


def load_pgc_data(filepath: str) -> dict:
    """Load the PGC JSON data from file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def remove_dots(code: str) -> str:
    """Remove dots from account code (e.g., 11.1.1 -> 1111)."""
    return code.replace('.', '')


def get_level(code: str) -> int:
    """
    Determine the hierarchy level based on code length.
    
    Level 1: 1 digit (Classes: 1, 2, 3...)
    Level 2: 2 digits (11, 12, 21...)
    Level 3: 3 digits (111, 112...)
    Level 4: 4 digits (1111, 1112...)
    Level 5: 5 digits (11111, 11112...)
    Level 6: 6+ digits
    """
    length = len(code)
    if length <= 5:
        return length
    return 6  # Group all 6+ digit codes as level 6


def process_account(account: dict, parent: dict = None) -> tuple:
    """
    Process a single account and determine its formatted name.
    
    Args:
        account: The account dict with code, name, type, detailType
        parent: The immediate parent account dict (if any)
    
    Returns:
        Tuple of (code, account_name, type, detail_type)
    """
    code = remove_dots(account['code'])
    name = account['name']
    acc_type = account.get('type', '')
    detail_type = account.get('detailType', '')
    
    # Determine if nesting applies (same type as immediate parent)
    if parent and parent.get('type') == acc_type:
        parent_code = remove_dots(parent['code'])
        account_name = f"{parent_code} {parent['name']}: {name}"
    else:
        account_name = name
    
    return (code, account_name, acc_type, detail_type)


def collect_accounts(items: list, parent: dict = None, results: list = None) -> list:
    """
    Recursively collect all accounts from a hierarchical structure.
    
    Args:
        items: List of account dicts (can be classes, accounts, or children)
        parent: The immediate parent account dict
        results: Accumulated results list
    
    Returns:
        List of tuples: (code, account_name, type, detail_type)
    """
    if results is None:
        results = []
    
    for item in items:
        # Skip items without required fields
        if 'code' not in item or 'name' not in item:
            continue
        
        # Skip optional classes like "Contabilidade Analítica" with no type
        if 'type' not in item and item.get('optional', False):
            continue
        
        # Process this account
        account_data = process_account(item, parent)
        results.append(account_data)
        
        # Process children recursively
        if 'children' in item:
            collect_accounts(item['children'], item, results)
        
        # Process accounts (for classes)
        if 'accounts' in item:
            collect_accounts(item['accounts'], item, results)
    
    return results


def write_csv(filepath: str, accounts: list):
    """Write accounts to a CSV file."""
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(['Account Number', 'Account Name', 'Type', 'Detail Type'])
        for account in accounts:
            writer.writerow(account)


def generate_quickbooks_csv(input_file: str, output_dir: Path):
    """
    Generate QuickBooks Online COA import CSVs from PGC JSON.
    
    Args:
        input_file: Path to pgc_2.json
        output_dir: Directory for output CSV files
    """
    # Load the PGC data
    data = load_pgc_data(input_file)
    
    # Collect all accounts starting from classes
    classes = data.get('classes', [])
    accounts = collect_accounts(classes)
    
    # Write main file with all accounts
    main_output = output_dir / 'quickbooks_coa_import.csv'
    write_csv(str(main_output), accounts)
    print(f"Generated {main_output} with {len(accounts)} accounts")
    
    # Group accounts by level
    levels = defaultdict(list)
    for account in accounts:
        code = account[0]
        level = get_level(code)
        levels[level].append(account)
    
    # Write level-specific files
    for level in sorted(levels.keys()):
        level_accounts = levels[level]
        level_output = output_dir / f'quickbooks_coa_level_{level}.csv'
        write_csv(str(level_output), level_accounts)
        print(f"Generated {level_output} with {len(level_accounts)} accounts")
    
    # Print summary
    print("\n=== Summary by Level ===")
    print(f"{'Level':<8} {'Digits':<12} {'Count':<8} Description")
    print("-" * 50)
    level_descriptions = {
        1: "Classes (top-level)",
        2: "Main accounts",
        3: "Sub-accounts",
        4: "Detail accounts",
        5: "Sub-detail accounts",
        6: "Granular accounts (6+ digits)"
    }
    for level in sorted(levels.keys()):
        desc = level_descriptions.get(level, "")
        digit_range = f"{level} digit{'s' if level > 1 else ''}" if level < 6 else "6+ digits"
        print(f"{level:<8} {digit_range:<12} {len(levels[level]):<8} {desc}")
    print(f"\n{'Total':<8} {'':<12} {len(accounts):<8}")


def main():
    """Main entry point."""
    script_dir = Path(__file__).parent
    input_file = script_dir / 'pgc_2.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        return 1
    
    generate_quickbooks_csv(str(input_file), script_dir)
    return 0


if __name__ == '__main__':
    exit(main())

