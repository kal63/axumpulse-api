#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
    host: 'localhost',
    user: 'bitappstechcom_axum_pulse_api',
    password: 'AxumPulse2024!',
    database: 'bitappstechcom_axum_pulse_api'
};

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir);
}

// Generate timestamp for filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `axumpulse_export_${timestamp}.sql`;
const filepath = path.join(exportsDir, filename);

// MySQL dump command
const mysqldumpCommand = `mysqldump -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} > ${filepath}`;

console.log('🚀 Starting database export...');
console.log(`📁 Export file: ${filepath}`);

// Execute the export
exec(mysqldumpCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Export failed:', error);
        console.error('stderr:', stderr);
        return;
    }

    if (stderr) {
        console.log('⚠️  Warnings:', stderr);
    }

    console.log('✅ Database export completed successfully!');
    console.log(`📄 Export saved to: ${filepath}`);

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeInMB} MB`);

    // List all export files
    console.log('\n📁 All export files:');
    const files = fs.readdirSync(exportsDir);
    files.forEach(file => {
        const filePath = path.join(exportsDir, file);
        const fileStats = fs.statSync(filePath);
        const size = (fileStats.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${file} (${size} MB)`);
    });
});

// Alternative: Create a simplified export script for cPanel
const cpanelExportScript = `#!/bin/bash

# cPanel Database Export Script
# Run this in cPanel terminal

DB_NAME="bitappstechcom_axum_pulse_api"
DB_USER="bitappstechcom_axum_pulse_api"
DB_PASS="AxumPulse2024!"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="axumpulse_export_\${TIMESTAMP}.sql"

echo "🚀 Starting database export..."
echo "📁 Export file: \${EXPORT_FILE}"

# Create exports directory
mkdir -p exports

# Export database
mysqldump -h localhost -u \${DB_USER} -p\${DB_PASS} \${DB_NAME} > exports/\${EXPORT_FILE}

if [ $? -eq 0 ]; then
    echo "✅ Database export completed successfully!"
    echo "📄 Export saved to: exports/\${EXPORT_FILE}"
    
    # Show file size
    FILE_SIZE=$(du -h exports/\${EXPORT_FILE} | cut -f1)
    echo "📊 File size: \${FILE_SIZE}"
    
    # List all exports
    echo ""
    echo "📁 All export files:"
    ls -lh exports/
else
    echo "❌ Export failed!"
    exit 1
fi
`;

// Save the cPanel script
fs.writeFileSync(path.join(__dirname, 'export-database.sh'), cpanelExportScript);
fs.chmodSync(path.join(__dirname, 'export-database.sh'), '755');

console.log('📝 Created export-database.sh for cPanel usage');
console.log('💡 To use: chmod +x export-database.sh && ./export-database.sh');

