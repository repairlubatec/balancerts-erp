# PGC Chart of Accounts - Restructured

## Overview

This directory contains the restructured **Plano Geral de Contabilidade (PGC)** - Angolan General Accounting Plan, parsed from the official decree and organized into multiple formats suitable for accounting software implementation.

**Source:** Decreto nº 82/01 de 16 de Novembro  
**Version:** 1.0  
**Total Accounts:** 767 accounts across 9 classes (includes 65 main 2-digit accounts + 702 sub-accounts)

## Files

### Primary Output Files

1. **`pgc_chart_of_accounts.json`** (Hierarchical Structure)
   - Full hierarchical structure with parent-child relationships
   - Best for: Tree-view displays, drill-down interfaces
   - Format: Nested JSON with children arrays
   - Size: ~200KB

2. **`pgc_chart_of_accounts_flat.json`** (Flat Structure)
   - Flat list with parent references
   - Best for: Database imports, SQL inserts, simple lookups
   - Format: Array of objects with parent field
   - Size: ~150KB
   - Contains 711 entries (9 classes + 702 accounts)

3. **`pgc_chart_of_accounts.md`** (Documentation)
   - Human-readable markdown documentation
   - Best for: Reference, documentation, team onboarding
   - Features: Table of contents, hierarchical tables, notes
   - Size: ~50KB, 826 lines

### Source & Tools

- **`pgc.txt`** - Original source text file
- **`parse_pgc_improved.py`** - Parser script (comprehensive structure)
- **`generate_markdown.py`** - Markdown generator
- **`validate_pgc.py`** - Validation script

## Structure

### The 9 Classes

| Code | Name | Accounts | Description |
|:----:|:-----|:--------:|:------------|
| 1 | Meios fixos e investimentos | 85 | Fixed assets and investments |
| 2 | Existências | 34 | Inventories |
| 3 | Terceiros | 210 | Third parties (customers, suppliers, etc.) |
| 4 | Meios monetários | 47 | Monetary assets (cash, banks, etc.) |
| 5 | Capital e reservas | 17 | Equity |
| 6 | Proveitos e ganhos por natureza | 153 | Income and gains by nature |
| 7 | Custos e perdas por natureza | 179 | Costs and losses by nature |
| 8 | Resultados | 42 | Results |
| 9 | Contabilidade Analítica | 0 | Management accounting (optional) |

### Hierarchical Numbering System

The PGC uses a decimal hierarchical system:

```
1                           Class (single digit)
├─ 11                       Main Account (2 digits)
│  ├─ 11.1                  Sub-account (3rd level)
│  │  ├─ 11.1.1             Sub-sub-account (4th level)
│  │  └─ 11.1.4
│  │     ├─ 11.1.4.1        Detail account (5th level)
│  │     ├─ 11.1.4.2
│  │     └─ 11.1.4.3
│  ├─ 11.2
│  └─ 11.3
```

## Features & Fixes

### Issues Resolved ✓

1. **Missing Accounts Added:**
   - 11.3 - Equipamento básico (Basic equipment)
   - 11.4 - Equipamento de carga e transporte (Loading and transport equipment)
   - 11.5 - Equipamento administrativo (Administrative equipment)

2. **Parsing Errors Corrected:**
   - 18.1.2 now correctly shows "Edifícios e outras construções"
   - Fixed truncated account names
   - Removed verbose legal text from descriptions

3. **Proper Structure:**
   - All 9 classes present
   - Correct numerical ordering
   - Valid parent-child relationships
   - No duplicate codes

4. **Class 9 Implementation:**
   - Marked as optional
   - Includes usage note
   - Placeholder for entity-specific analytical accounting

### Quality Assurance

All outputs have been validated for:
- ✅ Complete 9-class structure
- ✅ Zero duplicate codes
- ✅ Numerical sequence integrity
- ✅ Parent-child relationship validity
- ✅ Hierarchical and flat structure consistency

## Usage Examples

### JSON Hierarchical (pgc_chart_of_accounts.json)

```json
{
  "version": "1.0",
  "title": "Plano Geral de Contabilidade - Angola",
  "classes": [
    {
      "code": "1",
      "name": "Meios fixos e investimentos",
      "description": "Fixed assets and investments",
      "accounts": [
        {
          "code": "11.1",
          "name": "Terrenos e recursos naturais",
          "children": [
            {
              "code": "11.1.1",
              "name": "Terrenos em bruto"
            }
          ]
        }
      ]
    }
  ]
}
```

### JSON Flat (pgc_chart_of_accounts_flat.json)

```json
[
  {
    "code": "1",
    "name": "Meios fixos e investimentos",
    "description": "Fixed assets and investments",
    "level": 1,
    "parent": null,
    "type": "class",
    "optional": false
  },
  {
    "code": "11.1",
    "name": "Terrenos e recursos naturais",
    "description": "",
    "level": 2,
    "parent": "1",
    "type": "account"
  }
]
```

## Integration Guide

### For Accounting Software

1. **Database Import:**
   - Use `pgc_chart_of_accounts_flat.json` for direct SQL inserts
   - Map `code` to account number, `name` to description
   - Use `parent` for establishing account hierarchies
   - Use `level` for indentation in reports

2. **Tree View UI:**
   - Use `pgc_chart_of_accounts.json` for hierarchical displays
   - Render `children` as expandable nodes
   - Bold main accounts (level 2), indent sub-accounts

3. **Account Creation Wizard:**
   - Present class selection first (1-9)
   - Filter accounts by selected class
   - Allow custom sub-accounts following numbering pattern

### Customization

Accounts marked with `___` (e.g., `Banco ___`) are placeholders:
- `33.1.1.1: Banco ___` → Replace with actual bank name
- `33.2.1.1: Entidade ___` → Replace with entity name

Additional sub-accounts can be added following the pattern:
- Under `11.1`: Add `11.1.5`, `11.1.6`, etc.
- Under `75.2`: Add `75.2.40`, `75.2.41`, etc.

## Regeneration

To regenerate from source:

```bash
# Parse and create JSON files
python3 parse_pgc_improved.py

# Generate markdown documentation
python3 generate_markdown.py

# Validate all outputs
python3 validate_pgc.py
```

## Notes

1. **Class 9 (Contabilidade Analítica):**
   - Optional usage
   - Recommended for industrial companies
   - Used for management accounting and cost analysis
   - No predefined accounts - entity-specific

2. **Account Descriptions:**
   - Portuguese names (official)
   - English descriptions where significant
   - Brief explanations, not legal text

3. **Compliance:**
   - Based on Decreto nº 82/01 de 16 de Novembro
   - Follows official PGC structure
   - Suitable for Angolan accounting requirements

## Support

For questions or issues with the chart of accounts structure, refer to:
- **Official Decree:** Decreto nº 82/01 de 16 de Novembro
- **Documentation:** `pgc_chart_of_accounts.md`
- **Source File:** `pgc.txt` (lines 2669-3543)

---

**Generated:** 2025  
**Parser Version:** 1.0  
**Status:** Production Ready ✅

