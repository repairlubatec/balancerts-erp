#!/usr/bin/env python3
"""
Generate clean markdown documentation from PGC JSON
"""

import json

def generate_markdown():
    with open("pgc_chart_of_accounts.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    md = []
    md.append(f"# {data['title']}")
    md.append("")
    md.append(f"**{data['description']}**")
    md.append("")
    md.append(f"Source: {data['source']}")
    md.append(f"Version: {data['version']}")
    md.append("")
    md.append("---")
    md.append("")
    
    # Count total accounts
    total_accounts = 0
    for class_data in data["classes"]:
        total_accounts += count_accounts_in_class(class_data["accounts"])
    
    md.append(f"Total: **{total_accounts} accounts** across **{len(data['classes'])} classes**")
    md.append("")
    md.append("## Table of Contents")
    md.append("")
    for class_data in data["classes"]:
        optional = " *(optional)*" if class_data.get("optional") else ""
        account_count = count_accounts_in_class(class_data["accounts"])
        md.append(f"- [Class {class_data['code']}: {class_data['name']}{optional}](#class-{class_data['code']}) ({account_count} accounts)")
    md.append("")
    md.append("---")
    md.append("")
    
    # Generate each class section
    for class_data in data["classes"]:
        md.append(f"## Class {class_data['code']}")
        md.append("")
        md.append(f"**{class_data['name']}**")
        if class_data.get("description"):
            md.append(f"*{class_data['description']}*")
        md.append("")
        
        if class_data.get("optional"):
            md.append(f"> **Note:** {class_data.get('note', 'Optional class')}")
            md.append("")
        
        if class_data["accounts"]:
            md.append("| Code | Account Name | Description |")
            md.append("|:-----|:-------------|:------------|")
            
            # Flatten accounts for table
            for account in class_data["accounts"]:
                add_account_rows(account, md, 0)
            
            md.append("")
        else:
            md.append("*No predefined accounts. This class is available for entity-specific analytical accounting.*")
            md.append("")
    
    md.append("---")
    md.append("")
    md.append("## Notes")
    md.append("")
    md.append("- **Class 9 (Contabilidade Analítica)** is optional and recommended for industrial companies")
    md.append("- Accounts marked with `___` (e.g., `Banco ___`) are placeholders to be customized per entity")
    md.append("- Sub-accounts can be added as needed following the hierarchical numbering system")
    md.append("")
    md.append("## Hierarchical Numbering")
    md.append("")
    md.append("The PGC uses a hierarchical decimal numbering system:")
    md.append("")
    md.append("- **Class level**: Single digit (1-9)")
    md.append("- **Account level**: Two digits (11, 21, 31, etc.)")
    md.append("- **Sub-account levels**: Additional digits after decimal points (11.1, 11.1.1, 11.1.4.1, etc.)")
    md.append("")
    md.append("Example hierarchy:")
    md.append("```")
    md.append("1                    Class: Fixed assets and investments")
    md.append("├─ 11                Account: Tangible fixed assets")
    md.append("│  ├─ 11.1           Sub-account: Land and natural resources")
    md.append("│  │  ├─ 11.1.1      Sub-sub-account: Raw land")
    md.append("│  │  └─ 11.1.2      Sub-sub-account: Improved land")
    md.append("│  └─ 11.2           Sub-account: Buildings and structures")
    md.append("```")
    md.append("")
    
    return "\n".join(md)

def count_accounts_in_class(accounts_list):
    """Recursively count accounts"""
    count = len(accounts_list)
    for account in accounts_list:
        if "children" in account:
            count += count_accounts_in_class(account["children"])
    return count

def add_account_rows(account, md, depth):
    """Add account rows with indentation"""
    indent = "&nbsp;&nbsp;" * depth
    code = f"`{account['code']}`"
    name = f"{indent}**{account['name']}**" if depth == 0 else f"{indent}{account['name']}"
    description = account.get("description", "")
    
    md.append(f"| {code} | {name} | {description} |")
    
    if "children" in account:
        for child in account["children"]:
            add_account_rows(child, md, depth + 1)

def main():
    print("Generating markdown documentation...")
    markdown_content = generate_markdown()
    
    with open("pgc_chart_of_accounts.md", "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print("✓ Created pgc_chart_of_accounts.md")
    
    # Calculate stats
    lines = markdown_content.count("\n") + 1
    print(f"  - {lines} lines")
    print(f"  - Clean, organized structure")
    print(f"  - Table of contents with links")
    print(f"  - Hierarchical account display")

if __name__ == "__main__":
    main()




