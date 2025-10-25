#!/usr/bin/env node

/**
 * Complete Content Generation Workflow
 * 
 * This script runs the complete workflow:
 * 1. Backup database
 * 2. Test API connection
 * 3. Generate content
 * 4. Show summary
 */

const { exec } = require('child_process');
const path = require('path');

class ContentGenerationWorkflow {
    constructor() {
        this.startTime = new Date();
        this.results = {
            backup: null,
            apiTest: null,
            contentGeneration: null
        };
    }

    /**
     * Run a command and return a promise
     */
    runCommand(command, description) {
        return new Promise((resolve, reject) => {
            console.log(`\n🔄 ${description}...`);
            console.log(`📝 Command: ${command}`);

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ ${description} failed:`, error.message);
                    reject(error);
                    return;
                }

                if (stderr && !stderr.includes('Warning')) {
                    console.warn(`⚠️  ${description} warnings:`, stderr);
                }

                console.log(`✅ ${description} completed successfully`);
                resolve({ stdout, stderr });
            });
        });
    }

    /**
     * Step 1: Backup database
     */
    async backupDatabase() {
        try {
            console.log('\n🗄️  STEP 1: Database Backup');
            console.log('==========================');

            const result = await this.runCommand(
                'npm run backup-db',
                'Creating database backup'
            );

            this.results.backup = { success: true, result };
            return true;
        } catch (error) {
            console.error('❌ Database backup failed:', error.message);
            this.results.backup = { success: false, error: error.message };
            throw error;
        }
    }

    /**
     * Step 2: Test API connection
     */
    async testApiConnection() {
        try {
            console.log('\n🔍 STEP 2: API Connection Test');
            console.log('==============================');

            const result = await this.runCommand(
                'npm run test-api',
                'Testing API connection'
            );

            this.results.apiTest = { success: true, result };
            return true;
        } catch (error) {
            console.error('❌ API connection test failed:', error.message);
            this.results.apiTest = { success: false, error: error.message };
            throw error;
        }
    }

    /**
     * Step 3: Generate content
     */
    async generateContent() {
        try {
            console.log('\n🎬 STEP 3: Content Generation');
            console.log('==============================');

            const result = await this.runCommand(
                'npm run generate-content',
                'Generating content'
            );

            this.results.contentGeneration = { success: true, result };
            return true;
        } catch (error) {
            console.error('❌ Content generation failed:', error.message);
            this.results.contentGeneration = { success: false, error: error.message };
            throw error;
        }
    }

    /**
     * Show workflow summary
     */
    showSummary() {
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);

        console.log('\n📊 WORKFLOW SUMMARY');
        console.log('==================');
        console.log(`⏱️  Total Duration: ${duration} seconds`);
        console.log(`📅 Started: ${this.startTime.toLocaleString()}`);
        console.log(`📅 Finished: ${endTime.toLocaleString()}`);

        console.log('\n📋 Step Results:');
        console.log('================');

        // Backup result
        if (this.results.backup) {
            const status = this.results.backup.success ? '✅' : '❌';
            console.log(`${status} Database Backup: ${this.results.backup.success ? 'Success' : 'Failed'}`);
            if (!this.results.backup.success) {
                console.log(`   Error: ${this.results.backup.error}`);
            }
        }

        // API test result
        if (this.results.apiTest) {
            const status = this.results.apiTest.success ? '✅' : '❌';
            console.log(`${status} API Connection: ${this.results.apiTest.success ? 'Success' : 'Failed'}`);
            if (!this.results.apiTest.success) {
                console.log(`   Error: ${this.results.apiTest.error}`);
            }
        }

        // Content generation result
        if (this.results.contentGeneration) {
            const status = this.results.contentGeneration.success ? '✅' : '❌';
            console.log(`${status} Content Generation: ${this.results.contentGeneration.success ? 'Success' : 'Failed'}`);
            if (!this.results.contentGeneration.success) {
                console.log(`   Error: ${this.results.contentGeneration.error}`);
            }
        }

        // Overall result
        const allSuccessful = Object.values(this.results).every(result => result && result.success);
        console.log(`\n🎯 Overall Result: ${allSuccessful ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (allSuccessful) {
            console.log('\n🎉 Content generation workflow completed successfully!');
            console.log('📊 Check your admin dashboard to review the generated content.');
        } else {
            console.log('\n⚠️  Workflow completed with errors.');
            console.log('🔍 Please check the error messages above for details.');
        }
    }

    /**
     * Run the complete workflow
     */
    async runWorkflow() {
        console.log('🚀 AxumPulse Content Generation Workflow');
        console.log('========================================');
        console.log('This workflow will:');
        console.log('1. 🗄️  Backup your database');
        console.log('2. 🔍 Test API connection');
        console.log('3. 🎬 Generate content with videos');
        console.log('4. 📊 Show summary');

        try {
            // Step 1: Backup database
            await this.backupDatabase();

            // Step 2: Test API connection
            await this.testApiConnection();

            // Step 3: Generate content
            await this.generateContent();

            // Show summary
            this.showSummary();

        } catch (error) {
            console.error('\n💥 Workflow failed:', error.message);
            this.showSummary();
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const workflow = new ContentGenerationWorkflow();
    await workflow.runWorkflow();
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContentGenerationWorkflow;



