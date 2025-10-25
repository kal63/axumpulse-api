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

// Create exports directory
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir);
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `axumpulse_complete_${timestamp}.sql`;
const filepath = path.join(exportsDir, filename);

console.log('🚀 Creating complete database export with all data...');
console.log(`📁 Export file: ${filepath}`);

// Enhanced mysqldump command with all options
const mysqldumpCommand = `mysqldump -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} \
    --complete-insert \
    --extended-insert \
    --routines \
    --triggers \
    --single-transaction \
    --lock-tables=false \
    --add-drop-table \
    --create-options \
    --disable-keys \
    --quick \
    --set-charset \
    --default-character-set=utf8mb4 \
    > ${filepath}`;

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

    console.log('✅ Complete database export completed successfully!');
    console.log(`📄 Export saved to: ${filepath}`);

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeInMB} MB`);

    // Create import instructions
    const importInstructions = `
# Database Import Instructions

## To import this database:

1. **Via cPanel phpMyAdmin:**
   - Go to cPanel → phpMyAdmin
   - Select your database: bitappstechcom_axum_pulse_api
   - Click "Import" tab
   - Choose file: ${filename}
   - Click "Go"

2. **Via Terminal:**
   \`\`\`bash
   mysql -h localhost -u bitappstechcom_axum_pulse_api -p bitappstechcom_axum_pulse_api < ${filename}
   \`\`\`

3. **Via Node.js:**
   \`\`\`javascript
   const { exec } = require('child_process');
   exec('mysql -h localhost -u bitappstechcom_axum_pulse_api -p bitappstechcom_axum_pulse_api < ${filename}');
   \`\`\`

## Export Details:
- **File**: ${filename}
- **Size**: ${fileSizeInMB} MB
- **Created**: ${new Date().toLocaleString()}
- **Database**: ${DB_CONFIG.database}
- **Includes**: All tables, data, routines, triggers, and constraints
`;

    // Save import instructions
    const instructionsPath = path.join(exportsDir, `import_instructions_${timestamp}.txt`);
    fs.writeFileSync(instructionsPath, importInstructions);

    console.log(`📝 Import instructions saved to: ${instructionsPath}`);

    // List all export files
    console.log('\n📁 All export files:');
    const files = fs.readdirSync(exportsDir);
    files.forEach(file => {
        const filePath = path.join(exportsDir, file);
        const fileStats = fs.statSync(filePath);
        const size = (fileStats.size / (1024 * 1024)).toFixed(2);
        const isDir = fileStats.isDirectory();
        console.log(`  ${isDir ? '📁' : '📄'} ${file} ${isDir ? '' : `(${size} MB)`}`);
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Upload the export file to your server');
    console.log('2. Import it using phpMyAdmin or terminal');
    console.log('3. Restart your API application');
});

// Also create a backup of your existing backups
console.log('\n📋 Creating backup of existing backups...');
const backupsDir = path.join(__dirname, 'backups');
const backupBackupDir = path.join(exportsDir, 'backup_backups');

if (fs.existsSync(backupsDir)) {
    if (!fs.existsSync(backupBackupDir)) {
        fs.mkdirSync(backupBackupDir);
    }

    const backupFiles = fs.readdirSync(backupsDir);
    backupFiles.forEach(file => {
        if (file.endsWith('.sql')) {
            const sourcePath = path.join(backupsDir, file);
            const destPath = path.join(backupBackupDir, file);
            fs.copyFileSync(sourcePath, destPath);
            console.log(`  📄 Copied: ${file}`);
        }
    });

    console.log(`✅ Backed up ${backupFiles.length} existing backup files`);
}

