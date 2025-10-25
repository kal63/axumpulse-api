#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Local database configuration - UPDATE THESE WITH YOUR LOCAL SETTINGS
const DB_CONFIG = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '', // Add your local MySQL password here
    database: 'axumpulse' // Your local database name
};

// Create exports directory
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir);
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `axumpulse_local_export_${timestamp}.sql`;
const filepath = path.join(exportsDir, filename);

console.log('🚀 Creating local database export...');
console.log(`📁 Export file: ${filepath}`);
console.log(`🗄️  Database: ${DB_CONFIG.database}`);
console.log(`👤 User: ${DB_CONFIG.user}`);

// MySQL dump command optimized for cPanel phpMyAdmin
const mysqldumpCommand = `mysqldump -h ${DB_CONFIG.host} -P ${DB_CONFIG.port} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} \
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
    > ${filepath}`;

// Execute the export
exec(mysqldumpCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Export failed:', error);
        console.error('💡 Make sure MySQL is running and credentials are correct');
        console.error('💡 Update the DB_CONFIG in this script with your local database settings');
        return;
    }

    if (stderr) {
        console.log('⚠️  Warnings:', stderr);
    }

    console.log('✅ Local database export completed successfully!');
    console.log(`📄 Export saved to: ${filepath}`);

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeInMB} MB`);

    // Create detailed import instructions
    const importInstructions = `
# Local Database Export - Import Instructions

## 🎯 For cPanel phpMyAdmin Import

### Step 1: Access phpMyAdmin
1. Login to your cPanel
2. Find "phpMyAdmin" in the "Databases" section
3. Click on phpMyAdmin

### Step 2: Select Your Database
1. In the left sidebar, click on: bitappstechcom_axum_pulse_api
2. You should see all your current tables (if any)

### Step 3: Import the Database
1. Click the "Import" tab at the top of the page
2. Click "Choose File" button
3. Select the file: ${filename}
4. Make sure "SQL" format is selected
5. Leave other options as default
6. Click "Go" button at the bottom

### Step 4: Verify Import
1. Check that all tables are created
2. Verify data is imported correctly
3. Test your API application

## 🔧 Troubleshooting

### If Export Fails:
- **MySQL not running**: Start MySQL service
- **Wrong credentials**: Update DB_CONFIG in this script
- **Database doesn't exist**: Create the database first
- **Permission error**: Check MySQL user permissions

### If Import Fails:
- **File too large**: Use "Partial import" option
- **Timeout**: Increase "Maximum execution time" in phpMyAdmin settings
- **Memory limit**: Contact your hosting provider
- **Permission error**: Check file permissions

## 📋 Export Details
- **Export file**: ${filename}
- **File size**: ${fileSizeInMB} MB
- **Created**: ${new Date().toLocaleString()}
- **Source database**: ${DB_CONFIG.database}
- **Target database**: bitappstechcom_axum_pulse_api
- **Optimized for**: cPanel phpMyAdmin import
- **Includes**: All tables, data, constraints, and indexes

## 🚀 After Import
1. Restart your Node.js API application
2. Test the API endpoints
3. Verify all functionality works
`;

    // Save import instructions
    const instructionsPath = path.join(exportsDir, 'IMPORT_INSTRUCTIONS.txt');
    fs.writeFileSync(instructionsPath, importInstructions);

    console.log(`📝 Import instructions saved to: ${instructionsPath}`);

    // List all export files
    console.log('\n📁 All export files:');
    const files = fs.readdirSync(exportsDir);
    files.forEach(file => {
        const filePath = path.join(exportsDir, file);
        const fileStats = fs.statSync(filePath);
        const size = (fileStats.size / (1024 * 1024)).toFixed(2);
        console.log(`  📄 ${file} (${size} MB)`);
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Upload the export file: exports/' + filename);
    console.log('2. Go to cPanel → phpMyAdmin');
    console.log('3. Select your database: bitappstechcom_axum_pulse_api');
    console.log('4. Click "Import" tab');
    console.log('5. Upload the SQL file');
    console.log('6. Click "Go"');
    console.log('7. Restart your API application');
});

// Make the script executable
process.on('exit', () => {
    console.log('\n✅ Export process completed!');
});
