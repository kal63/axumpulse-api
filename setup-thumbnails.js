#!/usr/bin/env node

/**
 * Setup Script for Thumbnail Generation
 * 
 * This script installs the required dependencies for thumbnail generation
 * and checks if FFmpeg is available on the system.
 */

const { exec } = require('child_process');
const fs = require('fs');

class ThumbnailSetup {
    constructor() {
        this.requiredPackages = [
            'fluent-ffmpeg',
            '@ffmpeg-installer/ffmpeg',
            '@ffprobe-installer/ffprobe'
        ];
    }

    /**
     * Check if a package is installed
     */
    isPackageInstalled(packageName) {
        try {
            require.resolve(packageName);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Install npm packages
     */
    async installPackages() {
        console.log('📦 Installing required packages for thumbnail generation...');

        for (const packageName of this.requiredPackages) {
            if (this.isPackageInstalled(packageName)) {
                console.log(`✅ ${packageName} is already installed`);
            } else {
                console.log(`📥 Installing ${packageName}...`);
                await this.runCommand(`npm install ${packageName}`);
            }
        }
    }

    /**
     * Check if FFmpeg is available
     */
    async checkFFmpeg() {
        console.log('🔍 Checking FFmpeg availability...');

        try {
            await this.runCommand('ffmpeg -version');
            console.log('✅ FFmpeg is available on the system');
            return true;
        } catch (error) {
            console.log('❌ FFmpeg is not available on the system');
            console.log('💡 To install FFmpeg:');
            console.log('   - macOS: brew install ffmpeg');
            console.log('   - Ubuntu/Debian: sudo apt install ffmpeg');
            console.log('   - Windows: Download from https://ffmpeg.org/download.html');
            return false;
        }
    }

    /**
     * Test thumbnail generation
     */
    async testThumbnailGeneration() {
        console.log('🧪 Testing thumbnail generation...');

        try {
            const ffmpeg = require('fluent-ffmpeg');

            // Test if fluent-ffmpeg can find FFmpeg
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    console.log('❌ fluent-ffmpeg cannot access FFmpeg');
                    console.log('💡 Make sure FFmpeg is installed and in your PATH');
                } else {
                    console.log('✅ fluent-ffmpeg can access FFmpeg');
                    console.log('🎉 Thumbnail generation is ready!');
                }
            });
        } catch (error) {
            console.log('❌ fluent-ffmpeg test failed:', error.message);
        }
    }

    /**
     * Run a command and return a promise
     */
    runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Run the complete setup
     */
    async runSetup() {
        console.log('🛠️  Thumbnail Generation Setup');
        console.log('==============================');

        try {
            // Install packages
            await this.installPackages();

            // Check FFmpeg
            const ffmpegAvailable = await this.checkFFmpeg();

            // Test thumbnail generation
            if (ffmpegAvailable) {
                await this.testThumbnailGeneration();
            }

            console.log('\n📋 Setup Summary:');
            console.log('==================');
            console.log('✅ Required packages installed');
            if (ffmpegAvailable) {
                console.log('✅ FFmpeg is available');
                console.log('🎉 Thumbnail generation is ready!');
                console.log('\n🚀 You can now run: npm run generate-content-thumbnails');
            } else {
                console.log('❌ FFmpeg is not available');
                console.log('💡 Install FFmpeg to enable thumbnail generation');
            }

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const setup = new ThumbnailSetup();
    await setup.runSetup();
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ThumbnailSetup;



