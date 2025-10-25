#!/bin/bash

# cPanel Database Export for phpMyAdmin Import
# This creates a clean SQL file optimized for cPanel's import functionality

DB_NAME="bitappstechcom_axum_pulse_api"
DB_USER="bitappstechcom_axum_pulse_api"
DB_PASS="AxumPulse2024!"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="axumpulse_cpanel_${TIMESTAMP}.sql"

echo "🚀 Creating cPanel-optimized database export..."
echo "📁 Export file: ${EXPORT_FILE}"

# Create exports directory
mkdir -p exports

# Export database optimized for cPanel phpMyAdmin import
mysqldump -h localhost -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    --create-options \
    --disable-keys \
    --extended-insert \
    --complete-insert \
    --set-charset \
    --default-character-set=utf8mb4 \
    --lock-tables=false \
    --quick \
    --quote-names \
    --compatible=mysql40 \
    > exports/${EXPORT_FILE}

if [ $? -eq 0 ]; then
    echo "✅ Database export completed successfully!"
    echo "📄 Export saved to: exports/${EXPORT_FILE}"
    
    # Show file size
    FILE_SIZE=$(du -h exports/${EXPORT_FILE} | cut -f1)
    echo "📊 File size: ${FILE_SIZE}"
    
    # Create import instructions for cPanel
    cat > exports/CPANEL_IMPORT_INSTRUCTIONS.txt << EOF
# cPanel phpMyAdmin Import Instructions

## Step 1: Access phpMyAdmin
1. Login to cPanel
2. Go to "phpMyAdmin" in the Databases section
3. Click on your database: ${DB_NAME}

## Step 2: Import the Database
1. Click the "Import" tab at the top
2. Click "Choose File" button
3. Select the file: ${EXPORT_FILE}
4. Make sure "SQL" format is selected
5. Click "Go" button at the bottom

## Step 3: Verify Import
1. Check that all tables are created
2. Verify data is imported correctly
3. Test your API application

## Troubleshooting
- If import fails, try increasing "Maximum execution time" in phpMyAdmin
- For large files, use "Partial import" option
- Check file size limits in cPanel

## File Details
- Export file: ${EXPORT_FILE}
- File size: ${FILE_SIZE}
- Created: $(date)
- Database: ${DB_NAME}
- Optimized for: cPanel phpMyAdmin import
EOF

    echo ""
    echo "📝 Import instructions created: exports/CPANEL_IMPORT_INSTRUCTIONS.txt"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Download the export file: exports/${EXPORT_FILE}"
    echo "2. Go to cPanel → phpMyAdmin"
    echo "3. Select your database"
    echo "4. Click 'Import' tab"
    echo "5. Upload the SQL file"
    echo "6. Click 'Go'"
    
    # List all export files
    echo ""
    echo "📁 All export files:"
    ls -lh exports/
    
else
    echo "❌ Export failed!"
    exit 1
fi

