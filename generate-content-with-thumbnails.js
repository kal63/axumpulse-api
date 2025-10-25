#!/usr/bin/env node

/**
 * Enhanced Content Generation Script with Thumbnail Generation
 * 
 * This script:
 * 1. Logs in as trainers using provided credentials
 * 2. Processes workout videos from the source directory
 * 3. Generates thumbnails automatically using FFmpeg
 * 4. Uploads videos and thumbnails to the API
 * 5. Creates content entries with randomized metadata
 * 6. Submits content for approval
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';
const SOURCE_VIDEO_DIR = '/Users/isaacnegatu/Documents/Random/WorkoutVids';
const TEMP_DIR = path.join(__dirname, 'temp');
const THUMBNAIL_DIR = path.join(TEMP_DIR, 'thumbnails');

// Import trainer credentials
const TRAINER_CREDENTIALS = require('./trainer-credentials');

// Content templates for randomization (same as before)
const CONTENT_TEMPLATES = {
    titles: [
        'High-Intensity Cardio Blast',
        'Strength Training Fundamentals',
        'Yoga Flow for Beginners',
        'Core Strengthening Workout',
        'Full Body HIIT Session',
        'Flexibility and Stretching',
        'Upper Body Strength',
        'Lower Body Power',
        'Cardio Dance Workout',
        'Pilates Core Session',
        'Functional Fitness',
        'Tabata Training',
        'Boxing Workout',
        'Resistance Band Training',
        'Bodyweight Challenge'
    ],
    descriptions: [
        'A comprehensive workout designed to improve your cardiovascular health and build endurance.',
        'Perfect for beginners looking to start their fitness journey with proper form and technique.',
        'An intense session that will challenge your strength and push your limits.',
        'Focus on building core stability and improving overall body strength.',
        'A dynamic workout combining cardio and strength training for maximum results.',
        'Designed to improve flexibility, reduce stress, and enhance mobility.',
        'Target your upper body muscles with this effective strength training routine.',
        'Build lower body power and endurance with this challenging workout.',
        'Get your heart pumping with this fun and energetic cardio session.',
        'Strengthen your core and improve posture with this Pilates-inspired workout.',
        'Improve daily movement patterns with functional fitness exercises.',
        'High-intensity interval training for maximum calorie burn.',
        'Learn basic boxing techniques while getting an amazing cardio workout.',
        'Effective workout using resistance bands for strength and toning.',
        'Challenge yourself with bodyweight exercises that require no equipment.'
    ],
    difficulties: ['beginner', 'intermediate', 'advanced'],
    categories: ['cardio', 'strength', 'yoga', 'nutrition', 'wellness'],
    tags: [
        ['hiit', 'cardio', 'fitness'],
        ['strength', 'muscle', 'training'],
        ['yoga', 'flexibility', 'mindfulness'],
        ['core', 'abs', 'stability'],
        ['full-body', 'workout', 'fitness'],
        ['stretching', 'flexibility', 'recovery'],
        ['upper-body', 'strength', 'muscle'],
        ['lower-body', 'legs', 'power'],
        ['dance', 'cardio', 'fun'],
        ['pilates', 'core', 'posture'],
        ['functional', 'movement', 'daily'],
        ['tabata', 'hiit', 'intense'],
        ['boxing', 'cardio', 'technique'],
        ['resistance', 'bands', 'strength'],
        ['bodyweight', 'no-equipment', 'challenge']
    ]
};

// Video metadata (estimated durations in seconds)
const VIDEO_METADATA = {
    '2376809-hd_1920_1080_24fps.mp4': { duration: 180, category: 'cardio' },
    '2786540-uhd_3840_2160_25fps.mp4': { duration: 240, category: 'strength' },
    '3195395-uhd_3840_2160_25fps.mp4': { duration: 300, category: 'yoga' },
    '3195530-uhd_3840_2160_25fps.mp4': { duration: 200, category: 'cardio' },
    '3196428-uhd_3840_2160_25fps.mp4': { duration: 220, category: 'strength' },
    '3209068-uhd_3840_2160_25fps.mp4': { duration: 280, category: 'wellness' },
    '4325592-uhd_4096_2160_25fps.mp4': { duration: 320, category: 'yoga' },
    '4367580-hd_1920_1080_30fps.mp4': { duration: 160, category: 'cardio' },
    '4438080-hd_1920_1080_25fps.mp4': { duration: 190, category: 'strength' }
};

class EnhancedContentGenerator {
    constructor() {
        this.authTokens = new Map();
        this.uploadedFiles = new Map();
        this.ffmpeg = null;
        this.setupDirectories();
        this.initializeFFmpeg();
    }

    /**
     * Setup required directories
     */
    setupDirectories() {
        // Create temp directory for thumbnails
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }
        if (!fs.existsSync(THUMBNAIL_DIR)) {
            fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
        }
    }

    /**
     * Initialize FFmpeg for thumbnail generation
     */
    initializeFFmpeg() {
        try {
            // Try to use fluent-ffmpeg if available
            const ffmpeg = require('fluent-ffmpeg');

            // Check if FFmpeg is available
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    console.warn('⚠️  FFmpeg not available, thumbnails will be skipped');
                    this.ffmpeg = null;
                } else {
                    console.log('✅ FFmpeg initialized for thumbnail generation');
                    this.ffmpeg = ffmpeg;
                }
            });
        } catch (error) {
            console.warn('⚠️  fluent-ffmpeg not installed, thumbnails will be skipped');
            console.log('💡 To enable thumbnails, run: npm install fluent-ffmpeg');
            this.ffmpeg = null;
        }
    }

    /**
     * Generate thumbnail from video using FFmpeg
     */
    async generateThumbnail(videoPath, outputPath, timestamp = '00:00:02') {
        if (!this.ffmpeg) {
            console.log('⏭️  Skipping thumbnail generation (FFmpeg not available)');
            return null;
        }

        return new Promise((resolve, reject) => {
            console.log(`🖼️  Generating thumbnail for: ${path.basename(videoPath)}`);

            this.ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timestamp],
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath),
                    size: '320x240'
                })
                .on('end', () => {
                    console.log(`✅ Thumbnail generated: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error(`❌ Thumbnail generation failed:`, err.message);
                    resolve(null); // Don't fail the whole process
                });
        });
    }

    /**
     * Login as a trainer and store the auth token
     */
    async loginTrainer(phone, password) {
        try {
            console.log(`🔐 Logging in trainer: ${phone}`);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                phone,
                password
            });

            if (response.data.success) {
                const token = response.data.data.token;
                this.authTokens.set(phone, token);
                console.log(`✅ Successfully logged in trainer: ${phone}`);
                return token;
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error(`❌ Failed to login trainer ${phone}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get available video files from source directory
     */
    getAvailableVideos() {
        try {
            const files = fs.readdirSync(SOURCE_VIDEO_DIR);
            return files.filter(file => file.endsWith('.mp4'));
        } catch (error) {
            console.error('❌ Error reading video directory:', error.message);
            return [];
        }
    }

    /**
     * Upload file to API
     */
    async uploadFile(filePath, authToken, isThumbnail = false) {
        try {
            const filename = path.basename(filePath);
            const endpoint = isThumbnail ? '/trainer/upload/thumbnail' : '/trainer/upload/content';

            console.log(`📤 Uploading ${isThumbnail ? 'thumbnail' : 'video'}: ${filename}`);

            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath), filename);

            const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.data.success) {
                const fileUrl = response.data.data.url;
                console.log(`✅ Successfully uploaded: ${filename} -> ${fileUrl}`);
                return fileUrl;
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (error) {
            console.error(`❌ Error uploading file ${filePath}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generate random content metadata
     */
    generateContentMetadata(videoFile) {
        const videoMeta = VIDEO_METADATA[videoFile] || { duration: 180, category: 'cardio' };

        const titleIndex = Math.floor(Math.random() * CONTENT_TEMPLATES.titles.length);
        const descriptionIndex = Math.floor(Math.random() * CONTENT_TEMPLATES.descriptions.length);
        const tagsIndex = Math.floor(Math.random() * CONTENT_TEMPLATES.tags.length);

        return {
            title: CONTENT_TEMPLATES.titles[titleIndex],
            description: CONTENT_TEMPLATES.descriptions[descriptionIndex],
            type: 'video',
            duration: videoMeta.duration,
            difficulty: CONTENT_TEMPLATES.difficulties[Math.floor(Math.random() * CONTENT_TEMPLATES.difficulties.length)],
            category: videoMeta.category,
            language: 'en',
            tags: CONTENT_TEMPLATES.tags[tagsIndex],
            isPublic: true
        };
    }

    /**
     * Create content entry in the database (without file URLs first)
     */
    async createContent(authToken, metadata) {
        try {
            console.log(`📝 Creating content: ${metadata.title}`);

            const contentData = {
                ...metadata,
                fileUrl: undefined,
                thumbnailUrl: undefined
            };

            const response = await axios.post(`${API_BASE_URL}/trainer/content`, contentData, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const content = response.data.data.content;
                console.log(`✅ Content created with ID: ${content.id}`);
                return content;
            } else {
                throw new Error(response.data.message || 'Content creation failed');
            }
        } catch (error) {
            console.error(`❌ Error creating content:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Update content with file URLs after upload
     */
    async updateContentWithFiles(authToken, contentId, fileUrl, thumbnailUrl = null) {
        try {
            console.log(`📝 Updating content ${contentId} with file URLs`);

            const updateData = {
                fileUrl,
                thumbnailUrl
            };

            const response = await axios.put(`${API_BASE_URL}/trainer/content/${contentId}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log(`✅ Content ${contentId} updated with file URLs`);
                return response.data.data.content;
            } else {
                throw new Error(response.data.message || 'Content update failed');
            }
        } catch (error) {
            console.error(`❌ Error updating content ${contentId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Submit content for approval
     */
    async submitContent(authToken, contentId) {
        try {
            console.log(`📋 Submitting content for approval: ${contentId}`);

            const response = await axios.put(`${API_BASE_URL}/trainer/content/${contentId}/submit`, {}, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log(`✅ Content submitted for approval: ${contentId}`);
                return response.data.data.content;
            } else {
                throw new Error(response.data.message || 'Content submission failed');
            }
        } catch (error) {
            console.error(`❌ Error submitting content ${contentId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete content (for cleanup on failure)
     */
    async deleteContent(authToken, contentId) {
        try {
            console.log(`🗑️ Deleting content: ${contentId}`);

            const response = await axios.delete(`${API_BASE_URL}/trainer/content/${contentId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log(`✅ Content deleted: ${contentId}`);
                return true;
            } else {
                throw new Error(response.data.message || 'Content deletion failed');
            }
        } catch (error) {
            console.error(`❌ Error deleting content ${contentId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Clean up temporary files
     */
    cleanupTempFiles() {
        try {
            if (fs.existsSync(TEMP_DIR)) {
                fs.rmSync(TEMP_DIR, { recursive: true, force: true });
                console.log('🧹 Cleaned up temporary files');
            }
        } catch (error) {
            console.warn('⚠️  Failed to clean up temporary files:', error.message);
        }
    }

    /**
     * Generate content for a single trainer
     */
    async generateContentForTrainer(phone, password, numVideos = 3) {
        try {
            console.log(`\n🚀 Starting content generation for trainer: ${phone}`);

            // Login
            const authToken = await this.loginTrainer(phone, password);

            // Get available videos
            const availableVideos = this.getAvailableVideos();
            if (availableVideos.length === 0) {
                console.log('❌ No videos found in source directory');
                return;
            }

            // Select random videos
            const selectedVideos = this.shuffleArray(availableVideos).slice(0, Math.min(numVideos, availableVideos.length));
            console.log(`📹 Selected ${selectedVideos.length} videos for upload`);

            const results = [];

            for (const videoFile of selectedVideos) {
                try {
                    console.log(`\n📹 Processing video: ${videoFile}`);

                    // Step 1: Generate metadata
                    const metadata = this.generateContentMetadata(videoFile);

                    // Step 2: Create content record first
                    const content = await this.createContent(authToken, metadata);

                    try {
                        const videoPath = path.join(SOURCE_VIDEO_DIR, videoFile);

                        // Step 3: Generate thumbnail
                        const thumbnailPath = path.join(THUMBNAIL_DIR, `${path.parse(videoFile).name}_thumb.jpg`);
                        const thumbnailGenerated = await this.generateThumbnail(videoPath, thumbnailPath);

                        // Step 4: Upload video
                        const fileUrl = await this.uploadFile(videoPath, authToken, false);

                        // Step 5: Upload thumbnail (if generated)
                        let thumbnailUrl = null;
                        if (thumbnailGenerated && fs.existsSync(thumbnailGenerated)) {
                            thumbnailUrl = await this.uploadFile(thumbnailGenerated, authToken, true);
                        }

                        // Step 6: Update content with file URLs
                        await this.updateContentWithFiles(authToken, content.id, fileUrl, thumbnailUrl);

                        // Step 7: Submit for approval
                        await this.submitContent(authToken, content.id);

                        results.push({
                            videoFile,
                            contentId: content.id,
                            title: metadata.title,
                            thumbnailGenerated: !!thumbnailGenerated,
                            status: 'submitted'
                        });

                        console.log(`✅ Successfully processed: ${videoFile} -> ${metadata.title}`);

                    } catch (uploadError) {
                        // If upload fails, delete the content record to maintain consistency
                        try {
                            await this.deleteContent(authToken, content.id);
                            console.log(`🧹 Cleaned up content record ${content.id} after upload failure`);
                        } catch (deleteError) {
                            console.error(`❌ Failed to clean up content record ${content.id}:`, deleteError.message);
                        }
                        throw uploadError;
                    }

                } catch (error) {
                    console.error(`❌ Failed to process video ${videoFile}:`, error.message);
                    results.push({
                        videoFile,
                        error: error.message,
                        status: 'failed'
                    });
                }
            }

            return results;
        } catch (error) {
            console.error(`❌ Error generating content for trainer ${phone}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate content for all trainers
     */
    async generateContentForAllTrainers() {
        if (TRAINER_CREDENTIALS.length === 0) {
            console.log('❌ No trainer credentials provided. Please add credentials to TRAINER_CREDENTIALS array.');
            return;
        }

        console.log(`🎯 Starting content generation for ${TRAINER_CREDENTIALS.length} trainers`);

        const allResults = [];

        for (const credentials of TRAINER_CREDENTIALS) {
            try {
                const results = await this.generateContentForTrainer(
                    credentials.phone,
                    credentials.password,
                    3 // Generate 3 videos per trainer
                );
                allResults.push({
                    trainer: credentials.phone,
                    results
                });
            } catch (error) {
                console.error(`❌ Failed to generate content for trainer ${credentials.phone}:`, error.message);
                allResults.push({
                    trainer: credentials.phone,
                    error: error.message
                });
            }
        }

        // Clean up temporary files
        this.cleanupTempFiles();

        // Print summary
        this.printSummary(allResults);
        return allResults;
    }

    /**
     * Print generation summary
     */
    printSummary(results) {
        console.log('\n📊 CONTENT GENERATION SUMMARY');
        console.log('================================');

        let totalSuccess = 0;
        let totalFailed = 0;
        let totalThumbnails = 0;

        results.forEach(trainerResult => {
            console.log(`\n👤 Trainer: ${trainerResult.trainer}`);

            if (trainerResult.error) {
                console.log(`❌ Error: ${trainerResult.error}`);
                totalFailed++;
            } else {
                trainerResult.results.forEach(result => {
                    if (result.status === 'submitted') {
                        const thumbStatus = result.thumbnailGenerated ? '🖼️' : '⏭️';
                        console.log(`✅ ${result.videoFile} -> ${result.title} (ID: ${result.contentId}) ${thumbStatus}`);
                        totalSuccess++;
                        if (result.thumbnailGenerated) totalThumbnails++;
                    } else {
                        console.log(`❌ ${result.videoFile} -> ${result.error}`);
                        totalFailed++;
                    }
                });
            }
        });

        console.log(`\n📈 Total: ${totalSuccess} successful, ${totalFailed} failed`);
        console.log(`🖼️  Thumbnails generated: ${totalThumbnails}/${totalSuccess}`);
    }

    /**
     * Utility function to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Main execution
async function main() {
    console.log('🎬 AxumPulse Enhanced Content Generator');
    console.log('========================================');

    // Check if trainer credentials are provided
    if (TRAINER_CREDENTIALS.length === 0) {
        console.log('\n❌ No trainer credentials found!');
        console.log('Please add trainer credentials to the TRAINER_CREDENTIALS array in the script.');
        return;
    }

    // Check if source video directory exists
    if (!fs.existsSync(SOURCE_VIDEO_DIR)) {
        console.log(`❌ Source video directory not found: ${SOURCE_VIDEO_DIR}`);
        return;
    }

    const generator = new EnhancedContentGenerator();

    try {
        await generator.generateContentForAllTrainers();
        console.log('\n🎉 Enhanced content generation completed!');
    } catch (error) {
        console.error('\n💥 Content generation failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = EnhancedContentGenerator;



