#!/bin/bash

# Simple Database Export Script
# This version prompts for password interactively

# Database configuration
DB_NAME="axumpulse"
DB_USER="root"
DB_HOST="localhost"
DB_PORT="3306"

# Create exports directory
mkdir -p exports

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="axumpulse_simple_export_${TIMESTAMP}.sql"

echo "🚀 Creating simple database export..."
echo "📁 Export file: exports/${EXPORT_FILE}"
echo "🗄️  Database: ${DB_NAME}"
echo "👤 User: ${DB_USER}"
echo ""

# Export database with interactive password prompt
echo "💡 You'll be prompted for your MySQL password..."
mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p ${DB_NAME} \
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
    echo "✅ Simple database export completed successfully!"
    echo "📄 Export saved to: exports/${EXPORT_FILE}"
    
    # Show file size
    FILE_SIZE=$(du -h exports/${EXPORT_FILE} | cut -f1)
    echo "📊 File size: ${FILE_SIZE}"
    
    # Create import instructions
    cat > exports/SIMPLE_IMPORT_INSTRUCTIONS.txt << EOF
# Simple Database Export - Import Instructions

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
- Source database: ${DB_NAME}
- Target database: bitappstechcom_axum_pulse_api
- Optimized for: cPanel phpMyAdmin import

## 🚀 After Import
1. Restart your Node.js API application
2. Test the API endpoints
3. Verify all functionality works
EOF

    echo ""
    echo "📝 Import instructions created: exports/SIMPLE_IMPORT_INSTRUCTIONS.txt"
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
    echo "💡 Try these solutions:"
    echo "1. Make sure MySQL is running: brew services start mysql"
    echo "2. Check your MySQL password"
    echo "3. Try connecting manually: mysql -u root -p"
    exit 1
fi

