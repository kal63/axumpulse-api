#!/usr/bin/env node

/**
 * Challenge Generation Script for AxumPulse API
 * 
 * This script:
 * 1. Logs in as trainers using provided credentials
 * 2. Creates diverse challenges with different types and difficulties
 * 3. Sets challenges as approved and public
 * 4. Associates challenges with trainers
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// Import trainer credentials
const TRAINER_CREDENTIALS = require('./trainer-credentials');

// Admin credentials for approval
const ADMIN_CREDENTIALS = {
    phone: '+251911234567',
    password: 'admin123'
};

// Challenge templates for randomization
const CHALLENGE_TEMPLATES = {
    fitness: {
        titles: [
            '30-Day Cardio Challenge',
            'Strength Building Bootcamp',
            'HIIT Power Week',
            'Core Strength Challenge',
            'Full Body Transformation',
            'Endurance Warrior',
            'Muscle Building Marathon',
            'Flexibility & Mobility',
            'Bodyweight Mastery',
            'Cardio Blast Challenge',
            'Strength & Stamina',
            'Power & Performance',
            'Athletic Conditioning',
            'Fitness Fundamentals',
            'Workout Warrior'
        ],
        descriptions: [
            'Transform your fitness with this comprehensive challenge designed to build strength, endurance, and overall health.',
            'Push your limits and achieve new fitness goals with this structured program.',
            'Join thousands of participants in this proven fitness challenge.',
            'Build lasting habits and see real results with this expert-designed program.',
            'Challenge yourself to reach new heights in your fitness journey.',
            'Experience the power of consistent training with this structured approach.',
            'Build strength, confidence, and healthy habits that last a lifetime.',
            'Transform your body and mind with this comprehensive fitness program.',
            'Achieve your fitness goals with expert guidance and community support.',
            'Push beyond your comfort zone and discover your true potential.'
        ],
        requirements: [
            'Complete 5 workouts per week',
            'Track your progress daily',
            'Follow the provided exercise routine',
            'Maintain proper form throughout',
            'Stay consistent with your schedule',
            'Challenge yourself with progressive overload',
            'Focus on proper nutrition',
            'Get adequate rest and recovery',
            'Stay hydrated throughout the challenge',
            'Document your journey with photos'
        ]
    },
    nutrition: {
        titles: [
            'Clean Eating Challenge',
            'Hydration Hero',
            'Meal Prep Mastery',
            'Balanced Nutrition Quest',
            'Healthy Habits Challenge',
            'Mindful Eating Journey',
            'Nutritional Transformation',
            'Wellness Nutrition',
            'Healthy Lifestyle Challenge',
            'Nutritional Excellence',
            'Dietary Discipline',
            'Healthy Choices Challenge',
            'Nutritional Awareness',
            'Wellness & Nutrition',
            'Healthy Living Quest'
        ],
        descriptions: [
            'Transform your relationship with food and develop healthy eating habits.',
            'Learn to fuel your body with nutritious, delicious foods.',
            'Build sustainable nutrition habits that support your fitness goals.',
            'Discover the power of proper nutrition for optimal health.',
            'Develop a positive relationship with food and your body.',
            'Learn to make informed nutritional choices every day.',
            'Build healthy eating habits that last a lifetime.',
            'Understand the connection between nutrition and performance.',
            'Create a sustainable approach to healthy eating.',
            'Develop mindful eating practices for better health.'
        ],
        requirements: [
            'Track your daily food intake',
            'Eat 5 servings of fruits and vegetables daily',
            'Drink at least 8 glasses of water per day',
            'Plan and prepare your meals weekly',
            'Avoid processed foods',
            'Focus on whole, nutrient-dense foods',
            'Practice mindful eating',
            'Maintain consistent meal times',
            'Limit added sugars and sodium',
            'Include lean proteins in every meal'
        ]
    },
    wellness: {
        titles: [
            'Mindfulness & Meditation',
            'Stress Management Challenge',
            'Sleep Optimization Quest',
            'Mental Wellness Journey',
            'Self-Care Challenge',
            'Wellness & Balance',
            'Holistic Health Quest',
            'Mind-Body Connection',
            'Wellness Transformation',
            'Healthy Lifestyle Challenge',
            'Wellness Warrior',
            'Balance & Harmony',
            'Wellness Fundamentals',
            'Mental Health Focus',
            'Wellness Revolution'
        ],
        descriptions: [
            'Prioritize your mental and emotional well-being with this comprehensive wellness program.',
            'Develop healthy habits that support your overall well-being and life satisfaction.',
            'Learn to manage stress and build resilience in your daily life.',
            'Create a balanced lifestyle that supports your physical and mental health.',
            'Discover the power of self-care and its impact on your overall wellness.',
            'Build sustainable wellness habits that enhance your quality of life.',
            'Focus on the mind-body connection for optimal health and happiness.',
            'Develop a holistic approach to wellness that encompasses all aspects of health.',
            'Learn to prioritize your well-being in a busy world.',
            'Create lasting habits that support your mental and physical health.'
        ],
        requirements: [
            'Practice 10 minutes of meditation daily',
            'Get 7-8 hours of quality sleep',
            'Practice deep breathing exercises',
            'Take regular breaks from screens',
            'Engage in stress-reducing activities',
            'Maintain a gratitude journal',
            'Practice self-compassion',
            'Connect with nature regularly',
            'Limit caffeine and alcohol intake',
            'Prioritize work-life balance'
        ]
    },
    achievement: {
        titles: [
            'Goal Achievement Challenge',
            'Personal Growth Quest',
            'Success Habits Challenge',
            'Productivity Mastery',
            'Life Transformation',
            'Achievement Unlocked',
            'Success Mindset Challenge',
            'Personal Development',
            'Growth & Achievement',
            'Success Habits Builder',
            'Goal Setting Mastery',
            'Personal Excellence',
            'Achievement Accelerator',
            'Success Blueprint',
            'Growth Mindset Challenge'
        ],
        descriptions: [
            'Develop the habits and mindset needed to achieve your most important goals.',
            'Build a success-oriented lifestyle with proven strategies and techniques.',
            'Transform your approach to goal-setting and achievement.',
            'Develop the discipline and focus needed for long-term success.',
            'Create a systematic approach to achieving your dreams and aspirations.',
            'Build confidence and self-efficacy through structured achievement.',
            'Learn to overcome obstacles and maintain momentum toward your goals.',
            'Develop a growth mindset that supports continuous improvement.',
            'Create accountability systems that drive consistent progress.',
            'Build the mental resilience needed for sustained achievement.'
        ],
        requirements: [
            'Set specific, measurable goals',
            'Create a daily action plan',
            'Track your progress weekly',
            'Review and adjust your approach',
            'Celebrate small wins',
            'Learn from setbacks',
            'Maintain consistent effort',
            'Seek feedback and support',
            'Stay focused on priorities',
            'Practice positive self-talk'
        ]
    }
};

// Challenge difficulty configurations
const DIFFICULTY_CONFIGS = {
    beginner: {
        duration: [7, 14, 21],
        xpReward: [50, 75, 100],
        participantCount: [10, 50, 100]
    },
    intermediate: {
        duration: [14, 21, 30],
        xpReward: [100, 150, 200],
        participantCount: [25, 75, 150]
    },
    advanced: {
        duration: [21, 30, 45],
        xpReward: [200, 300, 500],
        participantCount: [50, 100, 200]
    }
};

class ChallengeGenerator {
    constructor() {
        this.authTokens = new Map();
        this.createdChallenges = [];
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
     * Generate random challenge data
     */
    generateChallengeData(type, difficulty) {
        const templates = CHALLENGE_TEMPLATES[type];
        const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];

        const titleIndex = Math.floor(Math.random() * templates.titles.length);
        const descriptionIndex = Math.floor(Math.random() * templates.descriptions.length);
        const requirementsIndex = Math.floor(Math.random() * templates.requirements.length);

        const duration = difficultyConfig.duration[Math.floor(Math.random() * difficultyConfig.duration.length)];
        const xpReward = difficultyConfig.xpReward[Math.floor(Math.random() * difficultyConfig.xpReward.length)];
        const participantCount = difficultyConfig.participantCount[Math.floor(Math.random() * difficultyConfig.participantCount.length)];

        // Generate start and end dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7)); // Start within next week

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        return {
            title: templates.titles[titleIndex],
            description: templates.descriptions[descriptionIndex],
            type,
            difficulty,
            duration,
            xpReward,
            requirements: templates.requirements[requirementsIndex],
            contentIds: [], // Will be populated with content IDs if available
            language: 'en',
            isPublic: true,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            // Also include the model field names
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString()
        };
    }

    /**
     * Create a challenge via API
     */
    async createChallenge(authToken, challengeData) {
        try {
            console.log(`📝 Creating challenge: ${challengeData.title}`);

            const response = await axios.post(`${API_BASE_URL}/trainer/challenges`, challengeData, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const challenge = response.data.data.challenge;
                console.log(`✅ Challenge created with ID: ${challenge.id}`);
                return challenge;
            } else {
                throw new Error(response.data.message || 'Challenge creation failed');
            }
        } catch (error) {
            console.error(`❌ Error creating challenge:`, error.response?.data || error.message);
            if (error.response?.data?.error?.details) {
                console.error(`📋 Validation details:`, error.response.data.error.details);
            }
            throw error;
        }
    }

    /**
     * Submit challenge for approval
     */
    async submitChallenge(authToken, challengeId) {
        try {
            console.log(`📋 Submitting challenge for approval: ${challengeId}`);

            const response = await axios.put(`${API_BASE_URL}/trainer/challenges/${challengeId}/submit`, {}, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log(`✅ Challenge submitted for approval: ${challengeId}`);
                return response.data.data.challenge;
            } else {
                throw new Error(response.data.message || 'Challenge submission failed');
            }
        } catch (error) {
            console.error(`❌ Error submitting challenge ${challengeId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Login as admin
     */
    async loginAdmin() {
        try {
            console.log(`🔐 Logging in admin: ${ADMIN_CREDENTIALS.phone}`);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                phone: ADMIN_CREDENTIALS.phone,
                password: ADMIN_CREDENTIALS.password
            });

            if (response.data.success) {
                const token = response.data.data.token;
                console.log(`✅ Successfully logged in admin: ${ADMIN_CREDENTIALS.phone}`);
                return token;
            } else {
                throw new Error(response.data.message || 'Admin login failed');
            }
        } catch (error) {
            console.error(`❌ Failed to login admin:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Approve a challenge using admin credentials via moderation endpoint
     */
    async approveChallenge(adminToken, challengeId) {
        try {
            console.log(`✅ Approving challenge: ${challengeId}`);

            // Use the dedicated moderation approval endpoint
            const response = await axios.post(`${API_BASE_URL}/admin/moderation/challenge/${challengeId}/approve`, {}, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                console.log(`✅ Challenge approved: ${challengeId}`);
                return response.data.data.item;
            } else {
                throw new Error(response.data.message || 'Challenge approval failed');
            }
        } catch (error) {
            console.error(`❌ Error approving challenge ${challengeId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generate challenges for a single trainer
     */
    async generateChallengesForTrainer(phone, password, numChallenges = 5) {
        try {
            console.log(`\n🚀 Starting challenge generation for trainer: ${phone}`);

            // Login
            const authToken = await this.loginTrainer(phone, password);

            const results = [];
            const challengeTypes = ['fitness', 'nutrition', 'wellness', 'achievement'];
            const difficulties = ['beginner', 'intermediate', 'advanced'];

            for (let i = 0; i < numChallenges; i++) {
                try {
                    console.log(`\n📋 Creating challenge ${i + 1}/${numChallenges}`);

                    // Generate random challenge data
                    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
                    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
                    const challengeData = this.generateChallengeData(type, difficulty);

                    // Create challenge
                    const challenge = await this.createChallenge(authToken, challengeData);

                    // Submit challenge for approval
                    await this.submitChallenge(authToken, challenge.id);

                    results.push({
                        challengeId: challenge.id,
                        title: challengeData.title,
                        type: challengeData.type,
                        difficulty: challengeData.difficulty,
                        duration: challengeData.duration,
                        status: 'submitted',
                        trainer: phone
                    });

                    console.log(`✅ Successfully created and submitted: ${challengeData.title}`);

                } catch (error) {
                    console.error(`❌ Failed to create challenge ${i + 1}:`, error.message);
                    results.push({
                        error: error.message,
                        status: 'failed',
                        trainer: phone
                    });
                }
            }

            return results;
        } catch (error) {
            console.error(`❌ Error generating challenges for trainer ${phone}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate challenges for all trainers with admin approval
     */
    async generateChallengesForAllTrainers() {
        if (TRAINER_CREDENTIALS.length === 0) {
            console.log('❌ No trainer credentials provided. Please add credentials to TRAINER_CREDENTIALS array.');
            return;
        }

        console.log(`🎯 Starting challenge generation for ${TRAINER_CREDENTIALS.length} trainers`);

        // Login as admin first
        const adminToken = await this.loginAdmin();

        const allResults = [];
        const allChallengeIds = [];

        // Step 1: Create challenges with trainers
        for (const credentials of TRAINER_CREDENTIALS) {
            try {
                const results = await this.generateChallengesForTrainer(
                    credentials.phone,
                    credentials.password,
                    15 // Generate 5 challenges per trainer
                );
                allResults.push({
                    trainer: credentials.phone,
                    results
                });

                // Collect challenge IDs for approval
                results.forEach(result => {
                    if (result.challengeId) {
                        allChallengeIds.push(result.challengeId);
                    }
                });
            } catch (error) {
                console.error(`❌ Failed to generate challenges for trainer ${credentials.phone}:`, error.message);
                allResults.push({
                    trainer: credentials.phone,
                    error: error.message
                });
            }
        }

        // Step 2: Approve all challenges as admin
        console.log(`\n🔐 Admin approval process for ${allChallengeIds.length} challenges`);
        const approvalResults = [];

        for (const challengeId of allChallengeIds) {
            try {
                await this.approveChallenge(adminToken, challengeId);
                approvalResults.push({ challengeId, status: 'approved' });
            } catch (error) {
                console.error(`❌ Failed to approve challenge ${challengeId}:`, error.message);
                approvalResults.push({ challengeId, status: 'failed', error: error.message });
            }
        }

        // Print summary
        this.printSummary(allResults, approvalResults);
        return { allResults, approvalResults };
    }

    /**
     * Print generation summary
     */
    printSummary(results, approvalResults = []) {
        console.log('\n📊 CHALLENGE GENERATION SUMMARY');
        console.log('================================');

        let totalSuccess = 0;
        let totalFailed = 0;
        const typeCounts = {};
        const difficultyCounts = {};

        results.forEach(trainerResult => {
            console.log(`\n👤 Trainer: ${trainerResult.trainer}`);

            if (trainerResult.error) {
                console.log(`❌ Error: ${trainerResult.error}`);
                totalFailed++;
            } else {
                trainerResult.results.forEach(result => {
                    if (result.status === 'submitted') {
                        const typeIcon = this.getTypeIcon(result.type);
                        const difficultyIcon = this.getDifficultyIcon(result.difficulty);
                        console.log(`✅ ${result.title} (ID: ${result.challengeId}) ${typeIcon} ${difficultyIcon} (${result.duration} days)`);
                        totalSuccess++;

                        // Count types and difficulties
                        typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
                        difficultyCounts[result.difficulty] = (difficultyCounts[result.difficulty] || 0) + 1;
                    } else {
                        console.log(`❌ Failed: ${result.error}`);
                        totalFailed++;
                    }
                });
            }
        });

        // Show approval results
        if (approvalResults.length > 0) {
            console.log(`\n🔐 Admin Approval Results:`);
            const approvedCount = approvalResults.filter(r => r.status === 'approved').length;
            const failedCount = approvalResults.filter(r => r.status === 'failed').length;
            console.log(`   ✅ Approved: ${approvedCount}`);
            console.log(`   ❌ Failed: ${failedCount}`);
        }

        console.log(`\n📈 Total: ${totalSuccess} successful, ${totalFailed} failed`);
        console.log(`\n📊 Breakdown by Type:`);
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`   ${this.getTypeIcon(type)} ${type}: ${count}`);
        });
        console.log(`\n📊 Breakdown by Difficulty:`);
        Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
            console.log(`   ${this.getDifficultyIcon(difficulty)} ${difficulty}: ${count}`);
        });
    }

    /**
     * Get type icon
     */
    getTypeIcon(type) {
        const icons = {
            fitness: '💪',
            nutrition: '🥗',
            wellness: '🧘',
            achievement: '🎯'
        };
        return icons[type] || '📋';
    }

    /**
     * Get difficulty icon
     */
    getDifficultyIcon(difficulty) {
        const icons = {
            beginner: '🟢',
            intermediate: '🟡',
            advanced: '🔴'
        };
        return icons[difficulty] || '⚪';
    }
}

// Main execution
async function main() {
    console.log('🎯 AxumPulse Challenge Generator');
    console.log('================================');

    // Check if trainer credentials are provided
    if (TRAINER_CREDENTIALS.length === 0) {
        console.log('\n❌ No trainer credentials found!');
        console.log('Please add trainer credentials to the TRAINER_CREDENTIALS array in the script.');
        return;
    }

    const generator = new ChallengeGenerator();

    try {
        await generator.generateChallengesForAllTrainers();
        console.log('\n🎉 Challenge generation completed!');
        console.log('📋 All challenges are approved and public, ready for users to join!');
    } catch (error) {
        console.error('\n💥 Challenge generation failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ChallengeGenerator;
