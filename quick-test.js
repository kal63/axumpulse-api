/**
 * Quick test script for user routes
 * Simple version to quickly verify all endpoints are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
const CREDENTIALS = { phone: '+251934567890', password: 'user123' };

let token = '';

async function quickTest() {
    console.log('🚀 Quick User Routes Test\n');

    try {
        // 1. Login
        console.log('1. Testing login...');
        const login = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
        token = login.data.data.token;
        console.log('✅ Login successful\n');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Test all user routes
        const tests = [
            { name: 'Content List', url: '/user/content?page=1&limit=5' },
            { name: 'Content Categories', url: '/user/content/categories' },
            { name: 'Content Detail', url: '/user/content/7' },
            { name: 'Workout Plans', url: '/user/workout-plans?page=1&limit=5' },
            { name: 'Workout Categories', url: '/user/workout-plans/categories' },
            { name: 'Workout Detail', url: '/user/workout-plans/6' },
            { name: 'Challenges', url: '/user/challenges?page=1&limit=5' },
            { name: 'Challenge Categories', url: '/user/challenges/categories' },
            { name: 'Challenge Detail', url: '/user/challenges/10' },
            { name: 'Challenge Leaderboard', url: '/user/challenges/10/leaderboard' },
            { name: 'Saved Content', url: '/user/engagement/saved' },
            { name: 'Watch History', url: '/user/engagement/history' },
            { name: 'My Workout Plans', url: '/user/progress/my-workout-plans' },
            { name: 'My Challenges', url: '/user/progress/my-challenges' },
            { name: 'User Profile', url: '/user/profile' },
            { name: 'User Stats', url: '/user/profile/stats' },
            { name: 'User Achievements', url: '/user/profile/achievements' },
            { name: 'XP History', url: '/user/profile/history?period=30' }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                const response = await axios.get(`${BASE_URL}${test.url}`, { headers });
                console.log(`✅ ${test.name} - Status: ${response.status}`);
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name} - Error: ${error.response?.status || error.message}`);
                failed++;
            }
        }

        // 3. Test POST endpoints
        console.log('\n📝 Testing POST endpoints...');

        const postTests = [
            {
                name: 'Like Content',
                url: '/user/engagement/like',
                data: { contentId: 7, type: 'content' }
            },
            {
                name: 'Save Content',
                url: '/user/engagement/save',
                data: { contentId: 7, type: 'content' }
            },
            {
                name: 'Watch Progress',
                url: '/user/engagement/watch-progress',
                data: { contentId: 7, watchTime: 50, completed: false }
            },
            {
                name: 'Join Challenge',
                url: '/user/progress/challenge/join',
                data: { challengeId: 10 }
            },
            {
                name: 'Start Workout Plan',
                url: '/user/progress/workout-plan/start',
                data: { workoutPlanId: 6 }
            }
        ];

        for (const test of postTests) {
            try {
                const response = await axios.post(`${BASE_URL}${test.url}`, test.data, { headers });
                console.log(`✅ ${test.name} - Status: ${response.status}`);
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name} - Error: ${error.response?.status || error.message}`);
                failed++;
            }
        }

        console.log('\n📊 Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the test
quickTest();
