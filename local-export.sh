#!/bin/bash

# Local Database Export Script
# Run this on your local machine to export the database

# Update these with your local database credentials
DB_NAME="axumpulse"
DB_USER="root"
DB_PASS=""
DB_HOST="localhost"
DB_PORT="3306"

# Create exports directory
mkdir -p exports

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="axumpulse_local_export_${TIMESTAMP}.sql"

echo "🚀 Creating local database export..."
echo "📁 Export file: exports/${EXPORT_FILE}"

# Export database optimized for cPanel phpMyAdmin
mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
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
    > exports/${EXPORT_FILE}

if [ $? -eq 0 ]; then
    echo "✅ Local database export completed successfully!"
    echo "📄 Export saved to: exports/${EXPORT_FILE}"
    
    # Show file size
    FILE_SIZE=$(du -h exports/${EXPORT_FILE} | cut -f1)
    echo "📊 File size: ${FILE_SIZE}"
    
    # Create import instructions
    cat > exports/IMPORT_INSTRUCTIONS.txt << EOF
# Database Import Instructions

## 🎯 For cPanel phpMyAdmin Import

### Step 1: Access phpMyAdmin
1. Login to your cPanel
2. Go to "phpMyAdmin" in the "Databases" section
3. Click on your database: bitappstechcom_axum_pulse_api

### Step 2: Import the Database
1. Click the "Import" tab at the top
2. Click "Choose File" button
3. Select the file: ${EXPORT_FILE}
4. Make sure "SQL" format is selected
5. Click "Go" button at the bottom

### Step 3: Verify Import
1. Check that all tables are created
2. Verify data is imported correctly
3. Test your API application

## 📋 Export Details
- Export file: ${EXPORT_FILE}
- File size: ${FILE_SIZE}
- Created: $(date)
- Source: Local database (${DB_NAME})
- Target: cPanel database (bitappstechcom_axum_pulse_api)
- Optimized for: cPanel phpMyAdmin import

## 🔧 Troubleshooting
- If import fails, try increasing "Maximum execution time" in phpMyAdmin
- For large files, use "Partial import" option
- Check file size limits in cPanel
EOF

    echo ""
    echo "📝 Import instructions created: exports/IMPORT_INSTRUCTIONS.txt"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Upload the export file: exports/${EXPORT_FILE}"
    echo "2. Go to cPanel → phpMyAdmin"
    echo "3. Select your database: bitappstechcom_axum_pulse_api"
    echo "4. Click 'Import' tab"
    echo "5. Upload the SQL file"
    echo "6. Click 'Go'"
    
    # List all export files
    echo ""
    echo "📁 All export files:"
    ls -lh exports/
    
else
    echo "❌ Export failed!"
    echo "💡 Make sure MySQL is running and credentials are correct"
    exit 1
fi
