# QuickBooks Import Files

This folder contains CSV files ready for importing the Angolan PGC Chart of Accounts into QuickBooks Desktop.

## 📋 Files Included

| File | Accounts | Description |
|:-----|:--------:|:------------|
| `pgc_quickbooks_validated_level_1_import.csv` | 5 | Top-level classes only |
| `pgc_quickbooks_validated_level_2_import.csv` | ~127 | Main accounts (2-digit codes) |
| `pgc_quickbooks_validated_level_3_import.csv` | ~341 | Sub-accounts (3rd level) |
| `pgc_quickbooks_validated_level_4_import.csv` | ~212 | Detail accounts (4th level) |
| `pgc_quickbooks_validated_level_5_import.csv` | ~22 | Deep detail accounts (5th level) |

## 🚀 Import Instructions

### Method 1: QuickBooks Desktop (Recommended)

1. **Backup Your Company File**
   - Go to File → Back Up Company → Create Local Backup
   - Wait for backup to complete

2. **Open Chart of Accounts**
   - Go to Lists → Chart of Accounts
   - Or press Ctrl+A (Windows) / Cmd+A (Mac)

3. **Import from Excel**
   - Click Account (bottom left) → Import from Excel
   - Or go to File → Utilities → Import → Excel Files

4. **Select CSV File**
   - Browse to the QuickBooks folder
   - Start with `pgc_quickbooks_validated_level_1_import.csv`
   - Click Open

5. **Map Columns**
   - QuickBooks will show an Import Mapping window
   - Verify the mappings:
     - Column A → Account Number
     - Column B → Account Name
     - Column C → Type
     - Column D → Detail Type (if available)

6. **Import**
   - Click Import
   - Wait for confirmation message
   - Review any warnings or errors

7. **Repeat for Other Levels**
   - Import in order: Level 1 → Level 2 → Level 3 → Level 4 → Level 5
   - This ensures parent accounts exist before importing children

### Method 2: QuickBooks Online

QuickBooks Online has different requirements:

1. **Convert to QBO Format**
   - Open the CSV file in Excel
   - Adjust columns to match QBO requirements:
     - Name, Type, Detail Type, Description, Balance

2. **Import via QBO Web Interface**
   - Go to Settings → Import Data → Chart of Accounts
   - Upload the modified CSV file
   - Map columns as prompted

## ⚠️ Important Notes

### Account Types

The CSV files use these QuickBooks account types (in Portuguese):

| Type in CSV | QuickBooks Category | English Translation |
|:------------|:-------------------|:--------------------|
| Ativos imobilizados | Fixed Assets | Fixed Assets |
| Ativos circulantes | Current Assets | Current Assets |
| Caixa e equivalentes-caixa | Cash and Cash Equivalents | Cash & Bank |
| Capital do proprietário | Equity | Owner's Equity |

**Note:** You may need to adjust these based on your QuickBooks language settings.

### Before Importing

1. ✅ **Backup your QuickBooks file** - Always create a backup first
2. ✅ **Start with a test company** - Try importing in a test file first
3. ✅ **Check account types** - Verify types match your QuickBooks version
4. ✅ **Import in order** - Start with Level 1, then Level 2, etc.

### After Importing

1. **Review Imported Accounts**
   - Check that all accounts imported correctly
   - Verify parent-child relationships
   - Ensure account numbers are correct

2. **Customize as Needed**
   - Replace placeholder accounts (e.g., "Banco ___")
   - Add company-specific sub-accounts
   - Set up default accounts for transactions

3. **Set Account Preferences**
   - Mark accounts as inactive if not needed
   - Set tax line mappings (if applicable)
   - Configure default accounts for common transactions

## 🔧 Troubleshooting

### Problem: "Account Number Already Exists"

**Solution:** The account may already exist in your QuickBooks file. Either:
- Skip duplicate accounts during import
- Delete or merge existing accounts first
- Use different account numbers

### Problem: "Invalid Account Type"

**Solution:** Account types may differ by QuickBooks region/version:
- Open the CSV in Excel
- Modify the "Type" column to match your QuickBooks types
- Available types are in: Lists → Chart of Accounts → New → Account Type

### Problem: "Parent Account Not Found"

**Solution:** Import files in order (Level 1 → 2 → 3 → 4 → 5):
- Ensure Level 1 imported successfully before importing Level 2
- Check that parent account numbers are correct

### Problem: Import Fails with Portuguese Characters

**Solution:** Encoding issue:
1. Open CSV in Excel
2. Save As → CSV UTF-8 (Comma delimited)
3. Try importing again

## 📊 Account Structure

The PGC uses a hierarchical numbering system:

```
1                           Class (Level 1)
├─ 11                       Main Account (Level 2)
│  ├─ 11.1                  Sub-account (Level 3)
│  │  ├─ 11.1.1             Sub-sub-account (Level 4)
│  │  └─ 11.1.4
│  │     ├─ 11.1.4.1        Detail account (Level 5)
│  │     ├─ 11.1.4.2
│  │     └─ 11.1.4.3
```

## 💡 Tips

1. **Import Gradually**
   - Start with Levels 1-2 for basic structure
   - Add Levels 3-5 only if you need detailed accounts

2. **Customize for Your Business**
   - Not all businesses need all 767 accounts
   - Mark unused accounts as inactive
   - Add sub-accounts specific to your operations

3. **Use Account Numbers**
   - Enable account numbers in QuickBooks preferences
   - This maintains the PGC structure
   - Makes it easier to find accounts

4. **Test First**
   - Always test import in a company file copy
   - Verify everything works before importing to production

## 📖 Additional Resources

- [Main Documentation](../README.md) - Overview of the PGC project
- [Technical Details](../docs/README_PGC_CHART.md) - Detailed account structure
- [Chart of Accounts](../pgc_chart_of_accounts.md) - Complete account listing

## ❓ Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review QuickBooks import documentation
3. Open an issue on the project repository

## 📝 File Format

Each CSV file has 4 columns:

```csv
"Account Number","Account Name","Type","Detail Type"
"1","1 Meios fixos e investimentos","Ativos imobilizados","Outros ativos imobilizados"
```

- **Account Number**: PGC code (e.g., "1", "11", "11.1")
- **Account Name**: Account name in Portuguese
- **Type**: QuickBooks account type
- **Detail Type**: QuickBooks detail type (optional)

---

**Generated:** 2025  
**Format:** QuickBooks CSV Import  
**Status:** Validated ✅

