# Plano Geral de Contabilidade (PGC) - Angola

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green.svg)]()

> Complete Angolan Chart of Accounts (Plano Geral de Contabilidade) in multiple formats ready for integration into accounting software.

## 📋 Overview

This repository contains the **Plano Geral de Contabilidade (PGC)** - Angola's official Chart of Accounts, extracted from Decreto nº 82/01 de 16 de Novembro and converted into multiple machine-readable formats.

**Key Features:**
- ✅ **767 accounts** across 9 classes
- ✅ **Multiple formats**: JSON (hierarchical & flat), CSV, Markdown
- ✅ **QuickBooks ready**: Direct import files included
- ✅ **Validated structure**: All accounts verified and cross-checked
- ✅ **Bilingual**: Portuguese names with English descriptions

## 🚀 Quick Start

### Use in Your Application

**Hierarchical JSON** (for tree views):
```javascript
const pgc = require('./pgc_chart_of_accounts.json');
// Access: pgc.classes[0].accounts[0].children
```

**Flat JSON** (for database imports):
```python
import json
accounts = json.load(open('pgc_chart_of_accounts_flat.json'))
# Each account has: code, name, description, level, parent, type
```

**QuickBooks Import** (ready-to-use CSV files):
1. Open QuickBooks Desktop
2. Go to Lists → Chart of Accounts → Account → Import from Excel
3. Select the appropriate level CSV file from `quickbooks/` folder
4. Follow the import wizard

See [QuickBooks Import Guide](./quickbooks/README.md) for detailed instructions.

## 📁 Repository Structure

```
pgc/
├── README.md                              # This file
├── LICENSE                                 # MIT License
│
├── Output Files (Use These)
├── pgc_chart_of_accounts.json             # Hierarchical JSON structure
├── pgc_chart_of_accounts_flat.json        # Flat JSON structure
├── pgc_chart_of_accounts.md               # Human-readable documentation
│
├── QuickBooks Import
├── quickbooks/
│   ├── README.md                           # QuickBooks import instructions
│   ├── pgc_quickbooks_validated_level_1_import.csv
│   ├── pgc_quickbooks_validated_level_2_import.csv
│   ├── pgc_quickbooks_validated_level_3_import.csv
│   ├── pgc_quickbooks_validated_level_4_import.csv
│   └── pgc_quickbooks_validated_level_5_import.csv
│
├── Scripts (Development)
├── parse_pgc_improved.py                  # Parser script
├── generate_markdown.py                   # Markdown generator
├── validate_pgc.py                        # Validation script
│
├── Source Files
├── pgc.txt                                # Original text file
└── docs/
    ├── pgc.pdf                            # Original decree PDF
    ├── README_PGC_CHART.md                # Detailed technical documentation
    └── IMPLEMENTATION_SUMMARY.md          # Implementation notes
```

## 📊 The 9 Classes

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

## 🎯 Use Cases

### For Software Developers
- Import the chart of accounts into your accounting software
- Use hierarchical JSON for tree-view UI components
- Use flat JSON for database imports and SQL operations

### For Accountants
- Reference complete PGC structure
- Import directly into QuickBooks or similar software
- Understand the Angolan accounting framework

### For Businesses
- Set up accounting system with official Angola COA
- Ensure compliance with Angolan accounting standards
- Customize with entity-specific sub-accounts

## 📖 Documentation

- **[QuickBooks Import Guide](./quickbooks/README.md)** - Step-by-step QuickBooks integration
- **[Technical Documentation](./docs/README_PGC_CHART.md)** - Detailed structure and usage
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - Parser implementation details
- **[Chart of Accounts](./pgc_chart_of_accounts.md)** - Complete account listing

## 🔧 Development

### Regenerate from Source

```bash
# Parse source and create JSON files
python3 parse_pgc_improved.py

# Generate markdown documentation
python3 generate_markdown.py

# Validate all outputs
python3 validate_pgc.py
```

### Requirements
- Python 3.7+
- No external dependencies required (uses standard library only)

## 💾 Output Formats

### 1. Hierarchical JSON (`pgc_chart_of_accounts.json`)
- Nested structure with parent-child relationships
- Best for: Tree-view displays, drill-down interfaces
- Size: ~200KB

### 2. Flat JSON (`pgc_chart_of_accounts_flat.json`)
- Flat list with parent references
- Best for: Database imports, SQL inserts
- Size: ~150KB
- 711 entries (9 classes + 702 accounts)

### 3. Markdown Documentation (`pgc_chart_of_accounts.md`)
- Human-readable documentation
- Table of contents with links
- Hierarchical tables for each class

### 4. QuickBooks CSV Files (`quickbooks/*.csv`)
- 5 separate files for each account level
- Ready for direct import into QuickBooks Desktop
- Validated format and structure

## ✅ Quality Assurance

All outputs have been validated for:
- ✅ Complete 9-class structure
- ✅ Zero duplicate codes
- ✅ Numerical sequence integrity
- ✅ Valid parent-child relationships
- ✅ Consistency across all formats

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Plano Geral de Contabilidade is based on **Decreto nº 82/01 de 16 de Novembro** (official Angolan government decree).

## 🙏 Acknowledgments

- Based on the official Angolan PGC (Decreto nº 82/01)
- Parsed and structured for modern software integration
- Validated against official source documents

## 📞 Support

For questions or issues:
1. Check the [documentation](./docs/README_PGC_CHART.md)
2. Review the [implementation summary](./docs/IMPLEMENTATION_SUMMARY.md)
3. Open an issue on GitHub

---

**Generated:** 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

