#!/bin/bash

# cPanel Database Export Script
# Run this in cPanel terminal

DB_NAME="bitappstechcom_axum_pulse_api"
DB_USER="bitappstechcom_axum_pulse_api"
DB_PASS="AxumPulse2024!"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="axumpulse_export_${TIMESTAMP}.sql"

echo "🚀 Starting database export..."
echo "📁 Export file: ${EXPORT_FILE}"

# Create exports directory
mkdir -p exports

# Export database with all data
mysqldump -h localhost -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    --complete-insert \
    --extended-insert \
    --routines \
    --triggers \
    --single-transaction \
    --lock-tables=false \
    > exports/${EXPORT_FILE}

if [ $? -eq 0 ]; then
    echo "✅ Database export completed successfully!"
    echo "📄 Export saved to: exports/${EXPORT_FILE}"
    
    # Show file size
    FILE_SIZE=$(du -h exports/${EXPORT_FILE} | cut -f1)
    echo "📊 File size: ${FILE_SIZE}"
    
    # List all exports
    echo ""
    echo "📁 All export files:"
    ls -lh exports/
    
    echo ""
    echo "🎯 To import this database:"
    echo "   mysql -h localhost -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < exports/${EXPORT_FILE}"
else
    echo "❌ Export failed!"
    exit 1
fi

