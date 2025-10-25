#!/usr/bin/env node

/**
 * Database Backup Script for AxumPulse API
 * 
 * This script creates a backup of the MySQL database before running
 * content generation or other operations that might modify data.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
    username: 'root',
    password: null, // No password by default
    database: 'axumpulse',
    host: '127.0.0.1',
    port: 3306
};

// Backup configuration
const BACKUP_DIR = path.join(__dirname, 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

class DatabaseBackup {
    constructor() {
        this.backupDir = BACKUP_DIR;
        this.timestamp = TIMESTAMP;
    }

    /**
     * Create backup directory if it doesn't exist
     */
    createBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📁 Created backup directory: ${this.backupDir}`);
        }
    }

    /**
     * Generate backup filename
     */
    getBackupFilename() {
        return `axumpulse_backup_${this.timestamp}.sql`;
    }

    /**
     * Build mysqldump command
     */
    buildMysqldumpCommand() {
        const { username, password, database, host, port } = DB_CONFIG;

        let command = `mysqldump`;
        command += ` --host=${host}`;
        command += ` --port=${port}`;
        command += ` --user=${username}`;

        if (password) {
            command += ` --password=${password}`;
        }

        command += ` --single-transaction`;
        command += ` --routines`;
        command += ` --triggers`;
        command += ` --add-drop-database`;
        command += ` --add-drop-table`;
        command += ` --complete-insert`;
        command += ` --extended-insert`;
        command += ` --lock-tables=false`;
        command += ` --databases ${database}`;

        return command;
    }

    /**
     * Create database backup
     */
    async createBackup() {
        try {
            console.log('🗄️  Starting database backup...');
            console.log(`📊 Database: ${DB_CONFIG.database}`);
            console.log(`📅 Timestamp: ${this.timestamp}`);

            this.createBackupDirectory();

            const backupFile = path.join(this.backupDir, this.getBackupFilename());
            const command = this.buildMysqldumpCommand();

            console.log(`📤 Creating backup: ${backupFile}`);

            return new Promise((resolve, reject) => {
                const child = exec(`${command} > "${backupFile}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Backup failed:`, error.message);
                        reject(error);
                        return;
                    }

                    if (stderr && !stderr.includes('Warning')) {
                        console.warn(`⚠️  Warnings:`, stderr);
                    }

                    // Check if backup file was created and has content
                    if (fs.existsSync(backupFile)) {
                        const stats = fs.statSync(backupFile);
                        if (stats.size > 0) {
                            console.log(`✅ Backup created successfully!`);
                            console.log(`📁 File: ${backupFile}`);
                            console.log(`📊 Size: ${this.formatFileSize(stats.size)}`);
                            resolve(backupFile);
                        } else {
                            reject(new Error('Backup file is empty'));
                        }
                    } else {
                        reject(new Error('Backup file was not created'));
                    }
                });

                // Show progress for large databases
                child.stdout?.on('data', (data) => {
                    process.stdout.write('.');
                });
            });

        } catch (error) {
            console.error(`❌ Database backup failed:`, error.message);
            throw error;
        }
    }

    /**
     * List existing backups
     */
    listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                console.log('📁 No backup directory found');
                return [];
            }

            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.endsWith('.sql'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            console.error(`❌ Error listing backups:`, error.message);
            return [];
        }
    }

    /**
     * Show backup information
     */
    showBackupInfo(backupFile) {
        try {
            const stats = fs.statSync(backupFile);
            console.log('\n📊 Backup Information');
            console.log('====================');
            console.log(`📁 File: ${path.basename(backupFile)}`);
            console.log(`📊 Size: ${this.formatFileSize(stats.size)}`);
            console.log(`📅 Created: ${stats.birthtime.toLocaleString()}`);
            console.log(`📂 Location: ${backupFile}`);
        } catch (error) {
            console.error(`❌ Error reading backup info:`, error.message);
        }
    }

    /**
     * Clean old backups (keep last 5)
     */
    cleanOldBackups() {
        try {
            const backups = this.listBackups();
            if (backups.length > 5) {
                const toDelete = backups.slice(5);
                console.log(`🧹 Cleaning ${toDelete.length} old backup(s)...`);

                toDelete.forEach(backup => {
                    try {
                        fs.unlinkSync(backup.path);
                        console.log(`🗑️  Deleted: ${backup.filename}`);
                    } catch (error) {
                        console.error(`❌ Failed to delete ${backup.filename}:`, error.message);
                    }
                });
            }
        } catch (error) {
            console.error(`❌ Error cleaning backups:`, error.message);
        }
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            console.log('🔍 Testing database connection...');

            const { username, password, database, host, port } = DB_CONFIG;
            const command = `mysql --host=${host} --port=${port} --user=${username} ${password ? `--password=${password}` : ''} --execute="SELECT 1;" ${database}`;

            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Database connection failed:`, error.message);
                        reject(error);
                    } else {
                        console.log(`✅ Database connection successful`);
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Connection test failed:`, error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    console.log('🗄️  AxumPulse Database Backup');
    console.log('=============================');

    const backup = new DatabaseBackup();

    try {
        // Test database connection first
        await backup.testConnection();

        // Create backup
        const backupFile = await backup.createBackup();

        // Show backup information
        backup.showBackupInfo(backupFile);

        // Clean old backups
        backup.cleanOldBackups();

        console.log('\n🎉 Database backup completed successfully!');
        console.log(`💾 Backup saved to: ${backupFile}`);

        return backupFile;

    } catch (error) {
        console.error('\n💥 Database backup failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DatabaseBackup;



